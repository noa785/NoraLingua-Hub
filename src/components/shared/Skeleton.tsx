/*
  Skeleton

  A neutral placeholder bar used in loading.tsx files across
  routes. Pulses subtly while data loads.

  Why a single primitive instead of inlining classes everywhere?
    Three reasons. First, every loading.tsx in the app should
    look visually consistent so the learner reads it as one
    cohesive "still working" signal. Second, if we later swap
    the animation (a real shimmer, a static bar, etc.), we
    change one file rather than every loading state. Third, it
    documents intent: a Skeleton in the JSX tells the next
    reader "this is a placeholder for content that will
    arrive shortly," not "this is permanent UI."

  Why animate-pulse rather than a custom shimmer:
    animate-pulse is the convention readers across the web have
    been trained to recognise as "loading." Custom shimmer
    effects add complexity without communicating anything new,
    and they tend to fight other transitions on the page.
*/

import type { CSSProperties } from "react";


type Props = {
  className?: string;
  style?:     CSSProperties;
};


export function Skeleton({ className, style }: Props) {
  /* Why role="status" and aria-hidden on the visual bar:
     Screen readers should be informed that something is loading
     (status), but should not read out a string of empty
     placeholder bars (aria-hidden on the visual). The parent
     loading.tsx files include a single visually-hidden status
     message so the announcement is made once, not per bar. */
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded-md bg-foreground/[0.06]",
        className ?? "",
      ].join(" ").trim()}
      style={style}
    />
  );
}