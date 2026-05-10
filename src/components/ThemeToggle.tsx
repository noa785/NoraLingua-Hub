"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";


/*
  Theme toggle.

  Why a client component?
    Reading and writing localStorage is a browser-only operation.
    The toggle button itself reacts to user clicks. Both require
    "use client". The no-flash trick that actually prevents a
    light-to-dark flicker on first paint lives in a separate
    inline script in the root layout (see ThemeProviderScript
    below) -- that script runs before React, before hydration,
    and is what stops the flash. This component handles the
    visible toggle UI.

  Why no library (e.g. next-themes)?
    Next-themes is great but it pulls in a dependency for what
    is essentially 30 lines of code. We do not need its system-
    detection, transition-disabling, or CSS-variable-mode
    machinery. A class on html and a value in localStorage is
    the entire model.

  Why three states (light, dark, system)?
    Two felt undercooked: if a user picks "light" once, we lock
    them out of "follow my OS." With three, the default ("system")
    just reads prefers-color-scheme and updates as the OS changes.
    "light" and "dark" are explicit overrides.
*/


type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "noralingua-theme";

function applyTheme(theme: Theme): void {
  /* "system" reads the OS preference; "light" and "dark" are
     explicit. The end result is always one or the other on
     the html element. */
  const resolved =
    theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}


export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  /* Pre-mount placeholder. Same dimensions, no icon. Prevents
     layout shift when the real icon appears. */
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center"
      >
        <span className="block h-4 w-4" />
      </button>
    );
  }

  const showMoon =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-200 hover:bg-foreground/5 hover:text-[#B8985A]"
    >
      {showMoon ? (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      ) : (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}


/*
  No-flash inline script.

  This is a separate export because it must be rendered as a
  raw <script> tag inside <body>, BEFORE React hydrates. The
  trick: read localStorage, resolve system preference, apply
  the class, all synchronously before the first paint. If we
  did this in a useEffect, the page would render in light mode
  for a split second before flipping to dark -- the dreaded
  flash of light theme.
*/

export function ThemeProviderScript() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem('${STORAGE_KEY}');
        var theme = stored || 'system';
        var dark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {
        /* localStorage may be blocked (e.g. private mode). Default to light. */
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
