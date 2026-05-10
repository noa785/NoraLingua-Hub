"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Loader2, Send, AlertCircle, Sparkles, Check } from "lucide-react";

import { submitWriting } from "@/app/actions/writing";


/*
  WritingComposer

  A client-side textarea with live word counting, draft autosave
  to localStorage, and a submit action that grades the response
  via Claude API and redirects to the result page.

  Why a 50-word hard floor with the prompt's minWords as a target?
    Forcing students to hit a long word count before any feedback
    is allowed discourages drafting. Letting them submit anything
    invites unhelpfully thin responses. The compromise is a hard
    floor at 50 words plus a prominent target band. Between 50 and
    minWords the submit button stays available but its label
    changes so the trade-off is explicit.

  Why useTransition for submit?
    The submit calls Claude (a few seconds) then a Next.js redirect.
    useTransition gives isPending without freezing the page, so the
    button can show a spinner while the user waits.

  Autosave design.
    Drafts are persisted to browser localStorage so a student who
    refreshes, navigates away, or loses their connection mid-essay
    does not lose their text. Storage is per-assignment and writes
    are debounced to one second of idle typing.

  Why localStorage and not the database?
    Drafts are private to the browser the student is using right
    now. Persisting them server-side would require a new endpoint,
    a new schema row, and conflict logic for multi-device editing.
    For v1 cohort sizes, localStorage gives most of the value at
    a fraction of the cost. The trade-off (drafts do not roam
    across browsers or devices) is documented in DESIGN.md as a
    known v1 limitation.

  Why a per-assignment storage key?
    Each writing assignment gets its own draft slot. A student can
    work on assignment A, switch to assignment B, and the two
    drafts will not collide because the key includes the
    assignment ID.

  Why debounce instead of saving on every keystroke?
    Saving 500 times a minute is wasteful and triggers extra
    re-renders. Debouncing to 1.2 seconds of idle typing means
    most students see one save per sentence, which feels live
    without being chatty.

  Why a "loading from draft" gate before the first save?
    On mount, the component reads the draft from localStorage and
    seeds the textarea. Without a gate, the very first save effect
    (with text still empty) would overwrite a real draft with an
    empty string, defeating the whole feature.

  Why clear the draft on successful submit?
    Once Claude grades the response, the canonical version lives
    in the database. Leaving the localStorage copy around would
    re-populate the textarea on a return visit, which is confusing.

  SSR safety.
    Next.js renders this component on the server first, where
    window.localStorage does not exist. All localStorage calls are
    guarded by a typeof window check inside useEffect, which only
    runs on the client.

  Quota handling.
    localStorage has a per-origin limit (typically 5MB). Writing
    responses are at most a few KB so we are nowhere near the
    quota in practice, but we still wrap saves in try/catch so a
    quota error never crashes the page.
*/


const HARD_MIN_WORDS = 50;

/* Debounce window in milliseconds. 1200 feels live without saving
   every keystroke; tune up if profiling shows pressure. */
const AUTOSAVE_DELAY_MS = 1200;

/* localStorage key prefix. Bump the version suffix to invalidate
   stale drafts in production if the schema or shape ever changes. */
const STORAGE_KEY_PREFIX = "noralingua-writing-draft-v1-";


type Props = {
  assignmentId: string;
  minWords:     number;
  maxWords:     number;
};


/* Tiny finite-state machine for the autosave indicator. Easier to
   read than three booleans (saving / saved / idle). */
type AutosaveStatus = "idle" | "saving" | "saved";


export function WritingComposer({ assignmentId, minWords, maxWords }: Props) {
  const router = useRouter();

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /* Autosave state. status drives the indicator under the textarea;
     lastSavedAt is the timestamp of the most recent successful
     localStorage write so we can render "Saved 2 minutes ago". */
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  /* hasLoadedDraft gates the autosave effect until after the load
     effect has read existing draft from localStorage. Using a ref
     because we never want this to trigger a re-render on its own. */
  const hasLoadedDraft = useRef(false);

  /* Storage key derived from the assignmentId so each assignment
     gets its own draft slot. */
  const storageKey = STORAGE_KEY_PREFIX + assignmentId;


  /* Load draft on mount. Reads localStorage and seeds the textarea
     if a draft exists. After this effect runs, hasLoadedDraft is
     marked true so the save effect can proceed safely. */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && saved.length > 0) {
        setText(saved);
        setAutosaveStatus("saved");
        setLastSavedAt(Date.now());
      }
    } catch {
      /* Reading localStorage can fail in private browsing or if
         the user disabled site data. Failing silently is correct
         here; the student can still write, just without restore. */
    } finally {
      hasLoadedDraft.current = true;
    }
  }, [storageKey]);


  /* Debounced autosave on text change. Waits AUTOSAVE_DELAY_MS of
     idle typing before writing. Skips runs while the load effect
     has not completed (otherwise it overwrites the draft with an
     empty string on first render). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoadedDraft.current) return;

    /* Empty text removes the draft entirely so a student who
       intentionally clears the field does not have it auto-restored
       on next visit. */
    if (text.length === 0) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore quota or permission errors */
      }
      setAutosaveStatus("idle");
      setLastSavedAt(null);
      return;
    }

    setAutosaveStatus("saving");

    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, text);
        setAutosaveStatus("saved");
        setLastSavedAt(Date.now());
      } catch {
        /* Quota exceeded or write blocked. Silent fallback is the
           kindest behaviour. The form still works, the student
           just will not be able to restore on reload. */
        setAutosaveStatus("idle");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [text, storageKey]);


  /* "Saved X ago" relative-time tick. Re-renders the indicator
     every 15 seconds so "just now" becomes "a moment ago", "1
     minute ago", etc. Tick on a fixed interval rather than
     recomputing on every render to keep the indicator stable. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (autosaveStatus !== "saved") return;
    const id = window.setInterval(() => setTick((n) => n + 1), 15000);
    return () => window.clearInterval(id);
  }, [autosaveStatus]);


  /* Live word count, recomputed only when text changes. */
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [text]);

  /* Status flags drive the counter colour and the submit button shape. */
  const belowFloor    = wordCount < HARD_MIN_WORDS;
  const aboveTarget   = wordCount >= minWords;
  const wayTooLong    = wordCount > maxWords + 50;
  const overTarget    = wordCount > maxWords && !wayTooLong;
  const inShortRange  = !belowFloor && !aboveTarget;
  const canSubmit     = !belowFloor && !wayTooLong;


  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);

    startTransition(async () => {
      const res = await submitWriting({ assignmentId, text });
      if (!res.success) {
        setError(res.error);
        return;
      }

      /* Successful grade. Clear the draft so the next visit to
         this assignment starts clean rather than re-populating
         from the old text. */
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        /* ignore */
      }

      router.push("/submissions/" + res.submissionId);
    });
  }


  /* Ratio for the word-count progress bar. minWords is the 100% mark. */
  const targetRatio = Math.min(1.5, wordCount / Math.max(1, minWords));

  /* Human-readable autosave label. Vague language ("just now",
     "a moment ago") instead of precise seconds because precision
     is overkill and reads as fussy. */
  const autosaveLabel = buildAutosaveLabel(autosaveStatus, lastSavedAt, tick);


  return (
    <div className="space-y-6">

      {/* Composer card */}
      <div className="rounded-2xl border border-foreground/10 bg-background p-1">
        {/*
          The data-gramm / data-gramm_editor / data-enable-grammarly
          attributes ask Grammarly and similar browser extensions to
          leave this textarea alone. Without them, Grammarly inserts
          its own DOM wrapper around the textarea, which intercepts
          the React onChange event and breaks our controlled-input
          autosave pipeline. Setting these is harmless for users
          without Grammarly installed.
        */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending}
          placeholder="Start writing your response here. Aim for clear ideas, varied sentences, and accurate grammar."
          className="block w-full resize-none rounded-2xl border-none bg-transparent px-6 py-5 text-base leading-[1.75] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-0 disabled:opacity-60"
          rows={16}
          aria-label="Your writing response"
          aria-describedby="word-count autosave-status"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          spellCheck={false}
        />
      </div>

      {/* Autosave indicator. Lives in its own row so it does not
          fight the word-count pill for space on narrow viewports. */}
      <div
        id="autosave-status"
        className="flex items-center gap-1.5 text-xs text-foreground/55"
        aria-live="polite"
      >
        {autosaveStatus === "saving" ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            <span>Saving draft</span>
          </>
        ) : autosaveStatus === "saved" ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" strokeWidth={2.5} />
            <span>{autosaveLabel}</span>
          </>
        ) : (
          <span className="opacity-0">placeholder</span>
        )}
      </div>

      {/* Word count + bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Counter pill */}
        <div
          id="word-count"
          className={[
            "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            wayTooLong
              ? "border-[#B8345A]/30 bg-[#B8345A]/[0.06] text-[#B8345A]"
              : aboveTarget
              ? "border-[#B8985A]/40 bg-[#B8985A]/[0.06] text-foreground"
              : "border-foreground/15 bg-background text-foreground/70",
          ].join(" ")}
          aria-live="polite"
        >
          <span className="font-serif text-base text-foreground">
            {wordCount}
          </span>
          <span>
            target {minWords}-{maxWords} words
          </span>
          {wayTooLong ? (
            <span className="text-xs">(too long)</span>
          ) : overTarget ? (
            <span className="text-foreground/50">(over target)</span>
          ) : belowFloor ? (
            <span className="text-foreground/50">(min {HARD_MIN_WORDS})</span>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5 sm:max-w-md">
          <div
            className={[
              "h-full transition-all duration-300 ease-out",
              wayTooLong
                ? "bg-[#B8345A]"
                : belowFloor
                ? "bg-[#DCE6F2]"
                : aboveTarget
                ? "bg-[#B8985A]"
                : "bg-[#B8985A]/40",
            ].join(" ")}
            style={{ width: (Math.min(100, targetRatio * 100)) + "%" }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Server error */}
      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B8345A]/30 bg-[#B8345A]/[0.04] px-4 py-3 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B8345A]" strokeWidth={2} />
          {error}
        </div>
      ) : null}

      {/* Submit -- shape and label change based on word count zone */}
      <div className="flex flex-col items-center gap-3 border-t border-foreground/10 pt-8">

        {aboveTarget ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            aria-busy={isPending}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI examiner is grading
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={2} />
                Submit for grading
              </>
            )}
          </button>
        ) : inShortRange ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            aria-busy={isPending}
            className="group inline-flex h-12 items-center gap-2 rounded-full border border-foreground/30 bg-background px-6 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI examiner is grading
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={2} />
                Submit short response anyway
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-full border border-foreground/15 bg-background px-7 text-sm font-medium text-foreground/40"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            Write at least {HARD_MIN_WORDS} words to submit
          </button>
        )}

        <p className="inline-flex max-w-md items-center gap-1.5 text-center text-xs text-foreground/60">
          <Sparkles className="h-3 w-3 flex-shrink-0 text-[#B8985A]" strokeWidth={2} />
          {isPending
            ? "This usually takes 10 to 20 seconds. Please do not close the tab."
            : inShortRange
            ? "Short responses get less detailed feedback. Aim for " + minWords + "+ words for a fuller grading."
            : "Your response will be graded by an AI trained on examiner rubrics. Drafts are saved automatically in this browser."}
        </p>
      </div>

    </div>
  );
}


/* Build the "Saved X ago" label. Pure function, side-effect free.
   The tick parameter is included only to force re-evaluation when
   the parent's interval ticks; the value itself is not used. */
function buildAutosaveLabel(
  status:      AutosaveStatus,
  lastSavedAt: number | null,
  _tick:       number,
): string {
  if (status !== "saved" || lastSavedAt === null) return "";

  const elapsedSeconds = Math.round((Date.now() - lastSavedAt) / 1000);

  if (elapsedSeconds < 5)   return "Draft saved just now";
  if (elapsedSeconds < 60)  return "Draft saved a moment ago";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes === 1)   return "Draft saved 1 minute ago";
  if (elapsedMinutes < 60)    return "Draft saved " + elapsedMinutes + " minutes ago";

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours === 1)   return "Draft saved 1 hour ago";
  return "Draft saved " + elapsedHours + " hours ago";
}