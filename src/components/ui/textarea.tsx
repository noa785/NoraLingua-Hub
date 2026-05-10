import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Textarea: styled wrapper around the native <textarea> element.
  Same idea as Input: we keep all native behavior, just apply our
  visual style and accessibility states.

  Notable detail: we use the modern CSS property "field-sizing: content"
  (the field-sizing-content utility class). This makes the textarea
  automatically grow taller as the user types, instead of showing a
  scrollbar inside a fixed box. No JavaScript resize hack needed.
*/
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // min-h-16 keeps a sensible starting height even when empty.
        // aria-invalid:* classes activate the red error ring when the
        // surrounding form layer flags the field as invalid.
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
