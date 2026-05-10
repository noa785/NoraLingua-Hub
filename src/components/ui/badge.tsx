import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/*
  Badge: a small pill used for status, tags, counts, or labels.
  Examples: "Beta", "12 lessons", "Active", "Premium".

  We use "class-variance-authority" (cva) to define the badge's
  visual variants in one place. Without cva, we would write nested
  if/else or a switch in the component to choose classes. cva turns
  that into a typed configuration object: each "variant" key maps
  to a Tailwind class string. This keeps logic and styling separate
  and gives full TypeScript autocomplete on the variant prop.
*/
const badgeVariants = cva(
  // Base classes shared by every variant. These define the size,
  // shape, and focus ring behavior, regardless of color.
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      // Each entry here is a different color/style of badge.
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    // If the caller does not pass a variant, use "default".
    defaultVariants: {
      variant: "default",
    },
  }
)

/*
  Component itself.

  asChild={true} is a Radix pattern: instead of rendering its own <span>,
  the component clones its single child and applies the styling to it.
  This lets a caller wrap a Next <Link> in a Badge without producing an
  invalid <span><a>...</a></span> tree. Useful for clickable tags.
*/
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
