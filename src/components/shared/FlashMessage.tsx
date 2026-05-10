"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";


/*
  FlashMessage

  Reads the ?flash=... query parameter once on mount and renders
  a soft banner at the top of the page. The banner auto-dismisses
  after 6 seconds, or when the user clicks the X.

  Why client-side, not server-rendered?
    The banner needs to be dismissable. A server-rendered banner
    cannot disappear without a re-render. Reading the query param
    on the client lets us own dismissal state cleanly.

  Why does it strip the URL?
    On dismiss we also clear ?flash=... from the URL via
    history.replaceState, so refresh does not bring the banner back.
*/


type Props = {
  message: string | null;     // pre-decoded message from server, null if no flash
};


export function FlashMessage({ message }: Props) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    // Strip ?flash from the URL so a refresh does not reshow it
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("flash")) {
        url.searchParams.delete("flash");
        window.history.replaceState({}, "", url.toString());
      }
    }

    // Auto-dismiss after 6 seconds
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message || !visible) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-4 lg:px-8">
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-[#3D6FA8]/25 bg-[#DCE6F2]/50 px-4 py-3 text-sm text-foreground shadow-[0_4px_20px_-12px_rgba(11,28,63,0.15)] backdrop-blur"
      >
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3D6FA8]" strokeWidth={2} />
        <p className="flex-1 leading-[1.5]">
          {message}
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="flex-shrink-0 rounded-full p-1 text-foreground/40 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/70"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
