"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Calendar,
  Check,
  Clock,
  Loader2,
  Video,
  X,
  Globe,
  AlertCircle,
} from "lucide-react";

import { bookSession, cancelBooking } from "@/app/actions/speaking";


/*
  SpeakingBooker

  A two-column booking surface. Left column shows 12 weekly
  sessions generated from a fixed pattern (Sunday, Tuesday,
  Thursday evenings in Saudi time, four weeks ahead). Right
  column shows the assigned teacher and a summary of the user's
  current bookings.

  Why generate the 12 slots client-side?
    The slots are deterministic from a fixed weekly pattern.
    There is no need to store every possible slot in the database;
    only the bookings the user actually makes get persisted. This
    keeps the schema small and rolls the four-week window forward
    automatically whenever a learner returns.

  Why does the page use both useTransition and a router refresh?
    useTransition gives pending UI without freezing the page while
    the server action runs. router.refresh re-runs the parent
    Server Component fetch so the booking list reflects the new
    database state without a full page reload.

  Why a per-booking Join Zoom button instead of one global link?
    Each booking carries its own teacher relation. In v1 every
    learner has one assigned teacher so the URL is always the
    same, but the schema already supports per-booking teachers
    for v2. The button reads booking.teacher.zoomUrl, so the UI
    is forward-compatible with that future state.
*/


// Saudi time is UTC+3 (no daylight saving)
const SAUDI_OFFSET_HOURS = 3;

// Weekly pattern (0 = Sunday, 1 = Monday, etc.)
// Sunday 7 PM, Tuesday 8 PM, Thursday 6 PM (Saudi time)
const WEEKLY_SLOTS: Array<{ dayOfWeek: number; hour: number; label: string }> = [
  { dayOfWeek: 0, hour: 19, label: "Sunday evening"   },
  { dayOfWeek: 2, hour: 20, label: "Tuesday evening"  },
  { dayOfWeek: 4, hour: 18, label: "Thursday evening" },
];

const WEEKS_AHEAD = 4;


type Booking = {
  id:          string;
  sessionDate: string;
  status:      "BOOKED" | "CANCELLED" | "COMPLETED";
  teacher:     {
    id:       string;
    fullName: string;
    zoomUrl:  string | null;
  } | null;
};

type Teacher = {
  id:       string;
  fullName: string;
  email:    string;
  bio:      string;
  zoomUrl:  string | null;
};

type Props = {
  bookings: Booking[];
  teacher:  Teacher | null;
};

type Slot = {
  dateIso: string; // unique key: ISO 8601 string in UTC
  date:    Date;
  label:   string; // "Sunday evening"
};


export function SpeakingBooker({ bookings, teacher }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build the 12 slots from now plus 4 weeks
  const slots = useMemo(() => generateSlots(), []);

  // Map booking date to booking object for quick lookup
  const bookingByDate = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookings) {
      if (b.status !== "BOOKED") continue;
      const key = new Date(b.sessionDate).toISOString();
      map.set(key, b);
    }
    return map;
  }, [bookings]);

  const activeBookingCount = bookings.filter((b) => b.status === "BOOKED").length;
  const remainingSessions = Math.max(0, 3 - activeBookingCount);
  const reachedLimit = activeBookingCount >= 3;


  function handleBook(slot: Slot) {
    setError(null);
    setPendingSlot(slot.dateIso);
    startTransition(async () => {
      const res = await bookSession({ sessionDate: slot.dateIso });
      if (!res.success) {
        setError(res.error);
        setPendingSlot(null);
        return;
      }
      router.refresh();
      setPendingSlot(null);
    });
  }


  function handleCancel(bookingId: string) {
    setError(null);
    setPendingSlot(bookingId);
    startTransition(async () => {
      const res = await cancelBooking({ bookingId });
      if (!res.success) {
        setError(res.error);
        setPendingSlot(null);
        return;
      }
      router.refresh();
      setPendingSlot(null);
    });
  }


  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">

      {/* LEFT: SLOT LIST -- spans 2 columns on lg+ */}
      <div className="lg:col-span-2">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Available sessions
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Pick three to book.
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-2 text-xs font-medium">
            <Globe className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            <span className="text-foreground/60">Times in</span>
            <span className="text-foreground">Saudi time (AST)</span>
          </div>
        </div>

        {/* Counter */}
        <div className="mb-5 rounded-xl border border-foreground/10 bg-[#DCE6F2]/40 px-4 py-3 text-sm">
          {reachedLimit ? (
            <span className="font-medium text-foreground">
              You have booked all 3 sessions. Cancel one to choose a different time.
            </span>
          ) : (
            <span className="text-foreground/80">
              <span className="font-medium text-foreground">{activeBookingCount} of 3</span> sessions booked.
              {remainingSessions > 0 ? ` Pick ${remainingSessions} more.` : null}
            </span>
          )}
        </div>

        {/* Error */}
        {error ? (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#B8345A]/30 bg-[#B8345A]/[0.04] px-4 py-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B8345A]" strokeWidth={2} />
            {error}
          </div>
        ) : null}

        {/* Grouped by week */}
        <div className="space-y-8">
          {groupSlotsByWeek(slots).map((week, weekIdx) => (
            <div key={weekIdx}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                Week {weekIdx + 1}
                <span className="ml-2 font-normal text-foreground/40">
                  {formatWeekRange(week)}
                </span>
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {week.map((slot) => {
                  const booking  = bookingByDate.get(slot.dateIso);
                  const isBooked = Boolean(booking);
                  const isPast   = false;
                  const isThisPending = pendingSlot === slot.dateIso || (booking && pendingSlot === booking.id);

                  return (
                    <SlotCard
                      key={slot.dateIso}
                      slot={slot}
                      booking={booking}
                      isBooked={isBooked}
                      isPast={isPast}
                      isPending={Boolean(isThisPending)}
                      isLimitReached={reachedLimit && !isBooked}
                      onBook={() => handleBook(slot)}
                      onCancel={() => booking && handleCancel(booking.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: TEACHER + BOOKINGS -- 1 column wide, sticky on lg+ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">

        <TeacherCard teacher={teacher} activeBookingCount={activeBookingCount} />

        <BookingsSummary
          bookings={bookings}
          onCancel={handleCancel}
          pendingId={pendingSlot}
        />

      </aside>

    </div>
  );
}


/* ============================================================
   SUB-COMPONENTS
   ============================================================ */


function SlotCard({
  slot,
  booking,
  isBooked,
  isPast,
  isPending,
  isLimitReached,
  onBook,
  onCancel,
}: {
  slot: Slot;
  booking: Booking | undefined;
  isBooked: boolean;
  isPast: boolean;
  isPending: boolean;
  isLimitReached: boolean;
  onBook: () => void;
  onCancel: () => void;
}) {
  const disabled = isPast || (isLimitReached && !isBooked) || isPending;
  const zoomUrl = booking?.teacher?.zoomUrl ?? null;

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-all duration-200",
        isBooked
          ? "border-[#B8985A] bg-[#B8985A]/[0.06] ring-1 ring-[#B8985A]/30"
          : isPast
          ? "border-foreground/10 bg-foreground/[0.02] opacity-50"
          : "border-foreground/10 bg-background hover:border-foreground/20",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
            {slot.label}
          </p>
          <p className="mt-1 font-serif text-base font-medium leading-snug tracking-tight text-foreground">
            {formatDate(slot.date)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-foreground/60">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {formatTime(slot.date)}
          </p>
        </div>

        {isBooked ? (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#B8985A] text-[#0B1C3F]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </div>

      {/* Action row */}
      <div className="mt-3 border-t border-foreground/10 pt-3">
        {isBooked ? (
          <div className="flex flex-wrap items-center gap-2">

            {/* Join Zoom (only if URL exists) */}
            {zoomUrl ? (
              
                <a
              
                  href={zoomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1F8A4C] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1A7440]"
              >
                <Video className="h-3 w-3" strokeWidth={2.5} />
                Join Zoom
              </a>
            ) : null}

            {/* Cancel */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending || isPast}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-3 text-xs font-medium text-foreground/70 transition-all duration-200 hover:border-[#B8345A]/40 hover:text-[#B8345A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Cancelling
                </>
              ) : (
                <>
                  <X className="h-3 w-3" strokeWidth={2.5} /> Cancel
                </>
              )}
            </button>

          </div>
        ) : (
          <button
            type="button"
            onClick={onBook}
            disabled={disabled}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background transition-all duration-200 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Booking
              </>
            ) : isPast ? (
              "Past"
            ) : isLimitReached ? (
              "Limit reached"
            ) : (
              "Book"
            )}
          </button>
        )}
      </div>
    </div>
  );
}


function TeacherCard({
  teacher,
  activeBookingCount,
}: {
  teacher: Teacher | null;
  activeBookingCount: number;
}) {
  /* No teacher assigned yet (legacy account or pre-onboarding). */
  if (!teacher) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-background p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Your teacher
        </p>
        <p className="text-sm leading-[1.6] text-foreground/70">
          A teacher will be assigned once you complete onboarding.
          Once assigned, your teacher's bio and live Zoom link will
          appear here, and a Join Zoom button will appear next to
          each booked session.
        </p>
      </div>
    );
  }

  /* Teacher assigned: show name, bio, and Zoom note. */
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6">

      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
        Your teacher
      </p>

      <h3 className="font-serif text-2xl font-medium tracking-tight text-foreground">
        {teacher.fullName}
      </h3>

      <p className="mt-3 text-sm leading-[1.6] text-foreground/70">
        {teacher.bio}
      </p>

      {/* Zoom block */}
      <div className="mt-5 rounded-xl border border-foreground/10 bg-[#DCE6F2]/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          <Video className="h-3.5 w-3.5" strokeWidth={2} />
          Zoom link
        </div>
        <p className="text-xs leading-[1.5] text-foreground/70">
          {teacher.zoomUrl
            ? "Use the Join Zoom button next to each booked session to enter your teacher's live room."
            : "Your teacher's Zoom link is being prepared. The Join Zoom button will appear here as soon as it is available."}
          {" "}
          {activeBookingCount === 0
            ? "Book a session to get started."
            : `${activeBookingCount === 1 ? "1 session" : `${activeBookingCount} sessions`} confirmed.`}
        </p>
      </div>

    </div>
  );
}


function BookingsSummary({
  bookings,
  onCancel,
  pendingId,
}: {
  bookings: Booking[];
  onCancel: (id: string) => void;
  pendingId: string | null;
}) {
  const active = bookings
    .filter((b) => b.status === "BOOKED")
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  return (
    <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
        Your bookings
      </p>

      {active.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground">
            <Calendar className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm leading-[1.5] text-foreground/70">
            No sessions booked yet. Pick three from the left to get started.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((b) => {
            const date = new Date(b.sessionDate);
            const isPending = pendingId === b.id;
            return (
              <li key={b.id} className="border-b border-foreground/10 pb-4 last:border-0 last:pb-0">

                {/* Top row: date/time on left, small X-Cancel icon on right.
                    The X stays as the lightweight cancel affordance so the row
                    remains compact. Join Zoom sits below as the dominant primary
                    action because it is what a learner does most of the time. */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(date)}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {formatTime(date)} (AST)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCancel(b.id)}
                    disabled={isPending}
                    aria-label="Cancel booking"
                    className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-[#B8345A]/[0.06] hover:text-[#B8345A] disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                  </button>
                </div>

                {/* Join Zoom pill. Same palette green and shape as the dashboard
                    NextClassCard so a learner instantly recognises the affordance
                    from anywhere in the app. Renders only when the assigned
                    teacher has a Personal Meeting Room URL configured; otherwise
                    a subdued placeholder explains the wait. */}
                {b.teacher?.zoomUrl ? (
                  <a
                    href={b.teacher.zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#1F8A4C] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1A7440] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4C] focus-visible:ring-offset-2"
                  >
                    <Video className="h-3 w-3" strokeWidth={2.5} />
                    Join Zoom
                  </a>
                ) : (
                  <span className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-full border border-foreground/10 px-3 text-xs text-foreground/50">
                    Zoom link pending
                  </span>
                )}

              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


/* ============================================================
   HELPERS -- date generation and formatting
   ============================================================ */


function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();

  for (let week = 0; week < WEEKS_AHEAD; week++) {
    for (const pattern of WEEKLY_SLOTS) {
      const slotDate = nextWeekdayAtHour(
        now,
        pattern.dayOfWeek,
        pattern.hour,
        week,
      );
      slots.push({
        dateIso: slotDate.toISOString(),
        date:    slotDate,
        label:   pattern.label,
      });
    }
  }

  return slots;
}


function nextWeekdayAtHour(
  reference: Date,
  dayOfWeek: number,
  hourSaudi: number,
  weekOffset: number,
): Date {
  const result = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
    0, 0, 0, 0,
  ));

  const currentDay = result.getUTCDay();
  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead < 0) daysAhead += 7;
  result.setUTCDate(result.getUTCDate() + daysAhead + weekOffset * 7);

  result.setUTCHours(hourSaudi - SAUDI_OFFSET_HOURS, 0, 0, 0);

  return result;
}


function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
    timeZone: "Asia/Riyadh",
  });
}


function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
  });
}


function groupSlotsByWeek(slots: Slot[]): Slot[][] {
  const weeks: Slot[][] = [];
  for (let i = 0; i < slots.length; i += WEEKLY_SLOTS.length) {
    weeks.push(slots.slice(i, i + WEEKLY_SLOTS.length));
  }
  return weeks;
}


function formatWeekRange(week: Slot[]): string {
  if (week.length === 0) return "";
  const first = week[0].date;
  const last  = week[week.length - 1].date;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    timeZone: "Asia/Riyadh",
  });
  return fmt(first) + " - " + fmt(last);
}
