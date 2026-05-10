import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Input: a styled wrapper around the native HTML <input> element.
  We do not reinvent the input; we just give it consistent visual styling
  that matches the rest of the design system. Because we spread {...props}
  onto the native element, every standard HTML attribute (type, value,
  onChange, disabled, autoComplete, etc.) works exactly as expected.

  React.ComponentProps<"input"> means: take every prop the native input
  accepts, in TypeScript form. This is how we get full type safety
  without having to list each attribute by hand.
*/
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // The aria-invalid:* classes light up a red ring when the parent
        // form layer marks this input as invalid (set by react-hook-form
        // via the FormControl wrapper). This is how validation errors
        // become visually obvious without inline conditionals.
        // The focus-visible:* classes only show the focus ring for
        // keyboard users, not mouse clicks, which is the modern accessible
        // default (avoids visual noise for sighted mouse users while
        // still meeting WCAG keyboard requirements).
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
