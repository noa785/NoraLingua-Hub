import Link from "next/link";

import { Calendar, Video } from "lucide-react";


/*
  NextClassCard
  -------------

  Surfaces the learner's upcoming one-on-one speaking sessions on
  the dashboard. The data lives on the Speaking page (via the
  SpeakingBooker component), but the dashboard is the first view
  every student sees on login, and the proposal called for "next
  scheduled Zoom class with teacher name and join link" to appear
  here. Without this card, a learner has to navigate elsewhere to
  find their upcoming session, which defeats the dashboard's
  purpose as a single coherent learner view.

  Why a server component:
    All data is read from the parent server component's Prisma
    query. There is no client interactivity beyond the Join Zoom
    link, which is a plain anchor. Keeping this server-side avoids
    a needless client bundle.

  Duration assumption:
    SpeakingBooking has sessionDate but no durationMin field
    (that field lives on the unused ScheduledClass model). For
    v1, sessions are a fixed 30 minutes, established by the
    SpeakingBooker UI which exposes 30-minute slots. We render
    the end time by adding 30 minutes to sessionDate. This keeps
    the schema lean and avoids storing the same constant on every
    row.
*/


export type NextClassBooking = {
  id:          string;
  sessionDate: Date;
  teacher: {
    fullName: string;
    zoomUrl:  string | null;
  } | null;
};


type NextClassCardProps = {
  bookings: NextClassBooking[];
};


/* Format a session row's time string.
   Example output: "Tue 12 May, 4:00-4:30 PM"
   Uses ASCII hyphen, not en-dash, per project standards. */
function formatSessionTime(sessionDate: Date, durationMin: number): string {
  const end = new Date(sessionDate.getTime() + durationMin * 60_000);

  const datePart = sessionDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  });

  const startTime = sessionDate.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endTime = end.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const startPeriod = startTime.slice(-2);
  const endPeriod   = endTime.slice(-2);
  const startBare   = startTime.slice(0, -3).trim();

  const timePart = startPeriod === endPeriod
    ? startBare + "-" + endTime
    : startTime + "-" + endTime;

  return datePart + ", " + timePart;
}


export function NextClassCard({ bookings }: NextClassCardProps) {

  const isEmpty = bookings.length === 0;

  return (
    <section aria-labelledby="next-class-heading">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
            Speaking
          </p>
          <h2
            id="next-class-heading"
            className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
          >
            Your upcoming sessions.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-foreground/70">
            One on one Zoom practice with your assigned teacher.
          </p>
        </div>

        {isEmpty ? (
          <div className="rounded-xl border border-foreground/10 bg-background p-6 text-sm text-foreground/70">
            No upcoming classes.
          </div>
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => {
              const timeLabel    = formatSessionTime(booking.sessionDate, 30);
              const teacherName  = booking.teacher?.fullName ?? "Teacher to be assigned";
              const zoomUrl      = booking.teacher?.zoomUrl ?? null;

              return (
                <li key={booking.id}>
                  <article className="flex flex-col gap-4 rounded-xl border border-foreground/10 bg-background p-5 sm:flex-row sm:items-center sm:justify-between">

                    <dl className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#B8985A]" strokeWidth={2} aria-hidden="true" />
                        <dt className="sr-only">When</dt>
                        <dd className="text-sm font-medium text-foreground">
                          {timeLabel}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <dt className="sr-only">Teacher</dt>
                        <dd className="text-xs text-foreground/70">
                          with {teacherName}
                        </dd>
                      </div>
                    </dl>

                    {zoomUrl ? (
                      <Link
                        href={zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F8A4C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1A7440] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4C] focus-visible:ring-offset-2"
                      >
                        <Video className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        Join Zoom
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-lg border border-foreground/10 px-4 py-2 text-xs text-foreground/60">
                        Zoom link pending
                      </span>
                    )}

                  </article>
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </section>
  );
}