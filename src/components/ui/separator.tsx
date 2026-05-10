"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/*
  Separator: a horizontal or vertical line used to divide content groups.
  We use Radix primitive instead of a plain <hr> because Radix handles the
  ARIA semantics: decorative=true means the line is purely visual and
  screen readers will skip it; decorative=false makes it a real semantic
  divider announced to assistive tech.
*/
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        // Radix sets data-orientation on the element, so one class set
        // works for both horizontal (1px tall, full width) and vertical
        // (1px wide, full height) without conditional logic in JSX.
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
