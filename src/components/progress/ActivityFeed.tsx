import { BookOpen, PenLine, MessagesSquare, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ActivityItem } from "@/lib/progress-stats";


/*
  ActivityFeed

  A simple timeline of the user's last 5 actions. Each item shows
  an icon coloured by activity kind, a title, an optional detail
  line, and a relative timestamp ("2 days ago", "Just now").

  Why timeline rather than table?
    Activity is chronological narrative, not data lookup. A timeline
    visually communicates "things happened in this order" -- table
    rows would invite the reader to compare values, which is not
    the point.
*/


type Props = {
  items:    ActivityItem[];
  pathHref: string;        // for empty-state CTA
};


export function ActivityFeed({ items, pathHref }: Props) {

  // Items array always has at least the JOINED entry, but a brand-new
  // user sees only that. Show empty state until there is some real activity.
  const hasRealActivity = items.some((i) => i.kind !== "JOINED");

  if (!hasRealActivity) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/15 bg-background/50 p-8 text-center">
        <p className="text-sm leading-[1.6] text-foreground/70">
          Your activity feed will fill in as you complete lessons and submissions.
        </p>
        <Link
          href={pathHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#B8985A] transition-colors hover:text-foreground"
        >
          Start practicing
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Recent activity
        </p>
        <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          Your latest steps.
        </h3>
      </div>

      <ul className="relative space-y-5">
        {/* Vertical timeline line */}
        <div
          aria-hidden="true"
          className="absolute left-[15px] top-2 bottom-2 w-px bg-foreground/10"
        />

        {items.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </ul>

    </div>
  );
}


function FeedItem({ item }: { item: ActivityItem }) {
  const visual = visualForKind(item.kind);

  return (
    <li className="relative flex items-start gap-4 pl-0">
      {/* Icon bubble (sits over the timeline line) */}
      <div className={[
        "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-background",
        visual.bgClass,
      ].join(" ")}>
        {visual.icon}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm font-medium leading-snug text-foreground">
          {item.title}
        </p>
        {item.detail ? (
          <p className="mt-0.5 text-xs text-foreground/60">
            {item.detail}
          </p>
        ) : null}
        <p className="mt-1 text-[11px] uppercase tracking-wider text-foreground/40">
          {formatRelative(item.timestamp)}
        </p>
      </div>
    </li>
  );
}


function visualForKind(kind: ActivityItem["kind"]) {
  switch (kind) {
    case "LESSON_COMPLETED":
      return {
        icon: <BookOpen className="h-3.5 w-3.5 text-foreground" strokeWidth={2} />,
        bgClass: "bg-[#DCE6F2]",
      };
    case "WRITING_GRADED":
      return {
        icon: <PenLine className="h-3.5 w-3.5 text-[#0B1C3F]" strokeWidth={2} />,
        bgClass: "bg-[#B8985A]",
      };
    case "SPEAKING_BOOKED":
      return {
        icon: <MessagesSquare className="h-3.5 w-3.5 text-foreground" strokeWidth={2} />,
        bgClass: "bg-[#DCE6F2]",
      };
    case "JOINED":
    default:
      return {
        icon: <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />,
        bgClass: "bg-background ring-1 ring-foreground/10",
      };
  }
}


function formatRelative(then: Date): string {
  const now = Date.now();
  const diffMs = now - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours   = Math.floor(diffMs / 3_600_000);
  const days    = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24)  return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (days < 7)    return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 30)   return `${Math.floor(days / 7)} weeks ago`;
  return then.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}
