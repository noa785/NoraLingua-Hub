"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";


/*
  ListeningPlayer

  Plays a lesson's text content aloud using the browser's built-in
  Web Speech API (SpeechSynthesisUtterance). No audio files, no
  external API, no cost -- the browser handles everything.

  Why this approach instead of pre-recorded audio?
    - Recording 15 lessons of audio costs time we do not have
      before May 11.
    - Hosting audio files would mean Supabase Storage or a CDN,
      which costs money and adds DevOps work.
    - Web Speech API is supported by every modern browser and
      gives us instant playback for any text we seed.

  How accent is selected:
    The lesson's audioUrl field is a small marker like
    "tts:en-GB" or "tts:en-US". We split on ":" and pass the
    locale to SpeechSynthesisUtterance.lang. The browser then
    picks the best matching voice from its installed list.

  Caveats we accept:
    - Voice quality varies by browser and OS. Edge on Windows
      tends to sound very natural; Chrome on Linux less so.
      That is acceptable for a MVP.
    - Some browsers cancel speech when the tab loses focus.
      We restart on resume rather than fight it.

  Future improvement (post-launch):
    Generate proper audio with a real TTS provider (ElevenLabs,
    Google Cloud TTS) and host the files. Same component
    interface; just swap the playback engine.
*/


type Props = {
  text: string;
  locale: string;
};


export function ListeningPlayer({ text, locale }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
    }
    // Cleanup on unmount: cancel any ongoing speech
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);


  function buildUtterance(): SpeechSynthesisUtterance {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.95; // slightly slower than default for learners
    u.pitch = 1.0;
    u.volume = 1.0;

    u.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    u.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      // Reset progress after a beat so the bar visually returns to 0
      setTimeout(() => setProgress(0), 600);
    };
    u.onpause = () => {
      setIsPaused(true);
    };
    u.onresume = () => {
      setIsPaused(false);
    };
    u.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    /* Approximate progress using the boundary event. The Web
       Speech API fires a boundary event for each word or sentence
       (browser-dependent). We use char index over total length
       as a rough percentage. */
    u.onboundary = (ev: SpeechSynthesisEvent) => {
      if (text.length > 0) {
        const pct = Math.min(100, Math.round((ev.charIndex / text.length) * 100));
        setProgress(pct);
      }
    };

    return u;
  }


  function handlePlay() {
    if (!window.speechSynthesis) return;

    // If something is queued already, cancel it before starting fresh
    window.speechSynthesis.cancel();

    const u = buildUtterance();
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }


  function handlePause() {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }


  function handleResume() {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }


  function handleReplay() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setProgress(0);
    setTimeout(() => handlePlay(), 100);
  }


  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-[#DCE6F2]/40 p-6">
        <p className="text-sm text-foreground/70">
          Audio playback is not supported in this browser. The transcript is
          shown below -- read it as if listening.
        </p>
      </div>
    );
  }


  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-[0_8px_30px_-12px_rgba(11,28,63,0.08)]">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground">
            <Volume2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Audio
            </p>
            <p className="text-sm text-foreground/70">
              {locale === "en-GB" ? "British English" : "American English"}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
        <div
          className="h-full bg-[#B8985A] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">

        {!isPlaying ? (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Play audio"
            className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background transition-all duration-200 hover:scale-105 hover:bg-foreground/90"
          >
            <Play className="h-5 w-5 translate-x-0.5" strokeWidth={2} fill="currentColor" />
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={handleResume}
            aria-label="Resume audio"
            className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background transition-all duration-200 hover:scale-105 hover:bg-foreground/90"
          >
            <Play className="h-5 w-5 translate-x-0.5" strokeWidth={2} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            aria-label="Pause audio"
            className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background transition-all duration-200 hover:scale-105 hover:bg-foreground/90"
          >
            <Pause className="h-5 w-5" strokeWidth={2} fill="currentColor" />
          </button>
        )}

        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay from start"
          className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 text-foreground/70 transition-all duration-200 hover:border-foreground/30 hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <p className="ml-2 text-xs text-foreground/60">
          {!isPlaying && progress === 0 && "Click play to listen."}
          {isPlaying && !isPaused && "Playing..."}
          {isPaused && "Paused."}
        </p>
      </div>

      {/* Disclosure */}
      <details className="mt-6 border-t border-foreground/10 pt-4">
        <summary className="cursor-pointer text-xs font-medium text-foreground/60 hover:text-foreground">
          Show transcript
        </summary>
        <div className="mt-4 whitespace-pre-line text-sm leading-[1.7] text-foreground/80">
          {text}
        </div>
      </details>

    </div>
  );
}
