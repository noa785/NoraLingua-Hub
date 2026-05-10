"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/*
  Label: the text shown above (or beside) a form control.

  We use Radix Label instead of a plain <label> for one reason:
  Radix automatically associates the label with its control via the
  htmlFor attribute, and it handles edge cases where the label is
  placed near the control but not as a direct parent. Screen readers
  announce the label when the user focuses the input.

  The disabled-state classes dim the label whenever its associated
  input is disabled, which keeps the visual state consistent.
*/
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // group-data-[disabled=true] reads from a parent FormField wrapper
        // when the underlying input is disabled, so the label dims with it.
        // peer-disabled does the same when the input is a sibling using
        // Tailwind's "peer" pattern.
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
