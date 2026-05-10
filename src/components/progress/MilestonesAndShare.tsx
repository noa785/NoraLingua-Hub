"use client";

import { Award, TrendingUp, Lock, Share2, Check } from "lucide-react";
import { useState } from "react";

import type { Milestones } from "@/lib/progress-stats";


/*
  MilestonesAndShare

  Two milestone cards with a small share row beneath them.

  Milestone design philosophy:
    Two only -- "Path Pioneer" (50 percent complete) and
    "Band 7 Achiever" (first writing band at or above 7.0).
    Adult, professional, restrained. No gamified six-badge grid
    that signals "Duolingo for kids". These are the two
    achievements that matter on a CV.

  Share button:
    Clicking opens LinkedIn's share intent URL with a pre-written
    summary. We do NOT auto-post -- we open LinkedIn's compose
    dialog and let the user edit before posting. This is the
    industry-standard pattern: respectful, non-spammy.
*/


type Props = {
  milestones:         Milestones;
  fullName:           string;
  levelKey:           string | null;
  purposeName:        string | null;
  lessonsCompleted:   number;
  bandAverage:        number | null;
};


export function MilestonesAndShare({
  milestones,
  fullName,
  levelKey,
  purposeName,
  lessonsCompleted,
  bandAverage,
}: Props) {

  const [copied, setCopied] = useState(false);

  function buildShareSummary(): string {
    const lines: string[] = [];
    lines.push(`I'm learning English with NoraLingua Hub.`);
    if (levelKey && purposeName) {
      lines.push(`Track: ${levelKey} - ${purposeName} English.`);
    }
    if (lessonsCompleted > 0) {
      lines.push(`${lessonsCompleted} ${lessonsCompleted === 1 ? "lesson" : "lessons"} completed so far.`);
    }
    if (bandAverage !== null) {
      lines.push(`Average writing band: ${bandAverage.toFixed(1)} of 9.`);
    }
    if (milestones.pathPioneer.unlocked) {
      lines.push(`Earned the Path Pioneer milestone.`);
    }
    if (milestones.bandSeven.unlocked) {
      lines.push(`Earned the Band 7 Achiever milestone.`);
    }
    return lines.join("\n");
  }

  function handleLinkedIn() {
    const text = buildShareSummary();
    // LinkedIn's share intent. We share a public URL plus pre-fill text.
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://noralingua.com")}&summary=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    const text = buildShareSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked; fall back silently
    }
  }

  return (
    <div className="space-y-6">

      {/* MILESTONES -- two side-by-side cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <MilestoneCard
          name="Path Pioneer"
          subtitle="50% of your path complete"
          icon={<Award className="h-6 w-6" strokeWidth={1.75} />}
          unlocked={milestones.pathPioneer.unlocked}
          progress={milestones.pathPioneer.progress}
          detail={milestones.pathPioneer.detail}
        />

        <MilestoneCard
          name="Band 7 Achiever"
          subtitle="Reach IELTS Band 7 in writing"
          icon={<TrendingUp className="h-6 w-6" strokeWidth={1.75} />}
          unlocked={milestones.bandSeven.unlocked}
          progress={milestones.bandSeven.bestBand !== null ? Math.round((milestones.bandSeven.bestBand / 7) * 100) : 0}
          detail={milestones.bandSeven.detail}
        />

      </div>

      {/* SHARE ROW */}
      <div className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Share your progress
            </p>
            <h3 className="mt-1 font-serif text-lg font-medium tracking-tight text-foreground sm:text-xl">
              Add to LinkedIn or your network.
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              A clean, professional summary of your English progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleLinkedIn}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90"
            >
              <Share2 className="h-4 w-4" strokeWidth={2} />
              Share on LinkedIn
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/30"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#1F7A4D]" strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" strokeWidth={2} />
                  Copy summary
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}


function MilestoneCard({
  name, subtitle, icon, unlocked, progress, detail,
}: {
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;          // 0 to 100
  detail: string;
}) {
  return (
    <div className={[
      "relative overflow-hidden rounded-2xl border p-6 transition-colors",
      unlocked
        ? "border-[#B8985A]/40 bg-background ring-1 ring-[#B8985A]/15"
        : "border-foreground/10 bg-background",
    ].join(" ")}>

      {/* Icon + status */}
      <div className="mb-5 flex items-start justify-between">
        <div className={[
          "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
          unlocked ? "bg-[#B8985A] text-[#0B1C3F]" : "bg-foreground/[0.04] text-foreground/40",
        ].join(" ")}>
          {unlocked ? icon : <Lock className="h-5 w-5" strokeWidth={1.75} />}
        </div>

        {unlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#B8985A]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8985A]">
            Unlocked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Locked
          </span>
        )}
      </div>

      {/* Name */}
      <p className="font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        {name}
      </p>
      <p className="mt-1 text-sm text-foreground/60">
        {subtitle}
      </p>

      {/* Progress bar -- only shown when locked */}
      {!unlocked ? (
        <div className="mt-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className="h-full bg-[#B8985A]/60 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-xs text-foreground/60">
            {detail}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-xs leading-[1.5] text-foreground/60">
          {detail}
        </p>
      )}

    </div>
  );
}
