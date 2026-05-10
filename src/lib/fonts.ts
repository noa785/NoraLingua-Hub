/*
  Editorial typography for NoraLingua Hub.

  Why next/font/google?
    next/font self-hosts the font files at build time. The browser
    never makes a request to fonts.googleapis.com, which means no
    third-party DNS lookup, no privacy leak, and no FOUT (flash of
    unstyled text) while waiting for Google to respond. The fonts
    ship from your own origin.

  Why two fonts and not three?
    Fraunces is the editorial display serif used for headlines,
    lesson titles, drop caps, pull quotes, and any masthead-style
    text. It has optical sizing and looks like a real magazine
    typeface at large sizes. DM Sans handles everything else:
    body, UI, small-caps category tags, captions. Two fonts
    cover the entire system.

    IBM Plex Sans Arabic is mentioned in the original brief as a
    future Arabic pairing. We are not loading it yet because
    Arabic UI is out of scope for Phase 1 and Phase 2, and every
    unused font is a measurable cost on first paint. When Arabic
    ships it gets its own design pass and the font is added then.

  Why "swap" display?
    With swap, the browser shows the system fallback while the
    custom font loads, then swaps to the custom font when it
    arrives. The user sees readable text immediately. The
    alternative ("block") shows nothing for up to 3 seconds,
    which is worse on slow networks.

  Why CSS variables instead of className?
    Each font exposes a className you can apply directly, but the
    cleaner pattern is to expose them as CSS variables on the html
    element and reference them from globals.css. That keeps the
    font choice decoupled from any specific component.
*/

import { Fraunces, DM_Sans } from "next/font/google";


// Editorial display serif. Used for headlines, lesson titles,
// drop caps, and any text that wants to feel printed.
export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
});


// UI and body sans. Clean, premium, neutral. Used for everything
// that is not display text.
export const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});


// Convenience: the className string to drop on html or body so
// both font CSS variables become available everywhere.
export const fontClassNames = `${fraunces.variable} ${dmSans.variable}`;
