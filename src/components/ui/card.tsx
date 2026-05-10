import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Card: a container that groups related content (a lesson preview,
  a stat tile, a settings section, etc).

  This file exports several pieces that compose together:
    Card           outer wrapper (a div with our card styling)
    CardHeader     top section, holds title and optional action
    CardTitle      heading text inside the header
    CardDescription  subheading text under the title
    CardAction     a button or icon aligned to the top-right
    CardContent    the main body of the card
    CardFooter     bottom strip, often used for actions or meta

  Why split into pieces? Each one knows its own padding, font size,
  and grid placement. When you compose them, layout just works
  without having to remember spacing rules.
*/

/*
  Card root. The size prop ("default" or "sm") tightens spacing
  for compact layouts (e.g., dense lists). Many of the classes
  use Tailwind's "has-*" selectors to react to which children
  the card contains, so the card auto-trims its own padding when
  a footer or a leading image is present.
*/
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // group/card lets nested CardHeader, CardContent, etc.,
        // read this card's data-size and adjust their own padding.
        // has-data-[slot=card-footer]:pb-0 removes bottom padding
        // when a footer is present (the footer handles its own).
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

/*
  CardHeader. Becomes a two-column grid automatically when it
  contains a CardAction child (e.g., a settings card with an
  edit button on the right). Otherwise it stays single-column.
*/
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

/* Heading text. Uses the brand serif font (Playfair). */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

/* Subheading or supporting copy under the title. */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/*
  CardAction sits at the top-right of CardHeader (e.g., a "..." menu
  or an edit pencil). The grid placement classes pin it to column 2,
  spanning both rows so it stays vertically centered next to the
  title and description.
*/
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/* Main body region. Padding mirrors header padding for visual alignment. */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

/*
  Footer strip with a top border and slightly muted background, so it
  reads as a separate region (action zone, timestamps, etc.).
*/
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
