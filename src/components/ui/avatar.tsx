"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/*
  Avatar: the round profile image used in headers, comments, lists.

  This file exports several pieces that work together:
    Avatar            the round container (default 32px, sm 24px, lg 40px)
    AvatarImage       the actual <img> shown when the URL loads
    AvatarFallback    initials or icon shown when the image fails or is loading
    AvatarBadge       a small dot at the bottom-right (online/offline indicator)
    AvatarGroup       a row of overlapping avatars (used for "people on a team")
    AvatarGroupCount  the "+3" pill at the end of an AvatarGroup

  Why use Radix here? It handles the loading state for us: the fallback
  appears while the image is fetching, then swaps to the image when it
  loads, and stays as fallback if the image fails. Doing this by hand
  would mean tracking onLoad and onError manually.
*/

/*
  Avatar root. The size prop drives the container size via data attributes,
  not Tailwind props, so child elements (like AvatarBadge) can read
  group-data-[size=...]/avatar and adjust themselves accordingly.
*/
function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        // group/avatar lets badges and other children respond to size.
        // The "after:" pseudo-element draws a faint inset border that
        // works on any background color (mix-blend-darken in light mode,
        // mix-blend-lighten in dark mode).
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  )
}

/* The actual photo. object-cover prevents distortion if it is not square. */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

/*
  Fallback content (typically initials like "NA"). Radix shows this
  automatically while the image is loading or if it fails. Font size
  shrinks for the small avatar size.
*/
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    />
  )
}

/*
  AvatarBadge: small dot or icon overlaid on the avatar, used for status
  (e.g., green dot = online). Sized differently per parent avatar size,
  using group-data-[size=...]/avatar selectors that read from the Avatar
  root above.
*/
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        // Each line below adapts the badge to a different avatar size.
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

/*
  AvatarGroup: a horizontal stack of avatars that overlap slightly, used
  to show "X people are in this room". Negative space-x pulls them
  together; ring-2 ring-background draws a small gap so each avatar
  stays visually distinct.
*/
function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

/*
  AvatarGroupCount: the trailing "+3" circle used when the group has more
  members than fit in the visible row. Size matches sibling avatars by
  reading the group's size data attribute.
*/
function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
