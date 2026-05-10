import Link from "next/link";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  CalendarCheck,
  PencilLine,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";


/*
  AdminPanelCard

  Renders a glanceable operations panel at the top of the dashboard
  for administrators. Shows four key metrics (cohort size, teaching
  team, active speaking bookings, ungraded submissions) plus a CTA
  to the full admin panel.

  Why a panel on top of the learner dashboard, not a separate page?
    Two reasons. First, the dashboard URL (/dashboard) is the
    natural landing page after login for every user; admin and
    learner alike. Routing admins elsewhere would create surprise.
    Second, an administrator needs to be able to preview the
    learner experience to validate content, layouts, and progress
    rendering. By keeping the learner dashboard intact below this
    card, we get role-aware UI without losing the testing surface.

  Why surface these four specific stats?
    Each maps to a daily admin task:
      Students   - is the cohort growing? are there orphans (no
                   teacher)?
      Teachers   - is the teaching team operational? is anyone
                   inactive?
      Bookings   - is session load balanced? are there overdue
                   completions?
      Pending    - is the grading queue backed up? Submissions are
        Submissions auto-graded by Claude, so a non-zero pending
        count signals an API hiccup or a student in mid-write.
    Other admin tabs (Material Sets, Lessons, Progress) are
    accessible via the CTA but did not earn a top-level slot
    because they change rarely and do not need glance-level
    visibility.

  Why not show grades/content directly here?
    Glance metrics earn the slot. Anything that needs reading
    (submission text, lesson content) belongs in the dedicated
    admin tabs where the admin has space to focus.

  Edge cases handled:
    - Zero students: shows "0 students" without breaking
    - Zero teachers: amber warning state (operational risk)
    - Zero ungraded submissions: shows "All caught up" copy
    - Many ungraded submissions (10+): amber warning state
    - Singular vs plural labels handled across all counts
    - Long admin names truncate gracefully via flex layout
*/


type Props = {
  studentCount:       number;
  teacherCount:       number;
  bookedSessionCount: number;
  ungradedCount:      number;
};


/* Threshold above which the ungraded queue is visually flagged.
   Set to 10 because the writing flow auto-grades on submit, so
   a backlog of more than ten almost always means an API failure
   or stalled action. Tunable as the platform scales. */
const UNGRADED_WARNING_THRESHOLD = 10;


export function AdminPanelCard({
  studentCount,
  teacherCount,
  bookedSessionCount,
  ungradedCount,
}: Props) {

  /* Compute warning flags up front so the JSX stays readable.
     We separate "no teachers" (a hard operational issue: students
     cannot be assigned) from "ungraded backlog" (a softer warning
     that the queue has grown). Each flag shows a distinct visual
     state. */
  const hasNoTeachers      = teacherCount === 0;
  const hasUngradedBacklog = ungradedCount >= UNGRADED_WARNING_THRESHOLD;

  /* Submission stat label switches to a friendly "All caught up"
     when zero, since "0 to review" reads as if something is broken. */
  const ungradedLabel = ungradedCount === 0
    ? "All caught up"
    : ungradedCount === 1
      ? "1 to review"
      : `${ungradedCount} to review`;

  return (
    <section
      aria-labelledby="admin-panel-heading"
      className="mx-auto max-w-6xl px-6 pt-10 lg:px-8"
    >

      <div className="overflow-hidden rounded-2xl border border-[#B8985A]/30 bg-[#B8985A]/[0.04]">

        {/* HEADER ROW */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B8985A]/20 px-6 py-4">

          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#B8985A] text-[#0B1C3F]"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                Admin Panel
              </p>
              <h2
                id="admin-panel-heading"
                className="font-serif text-lg font-medium tracking-tight text-foreground"
              >
                Operations at a glance.
              </h2>
            </div>
          </div>

          {/* CTA -- always visible, primary path into admin tabs */}
          <Link
            href="/admin"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#B8985A] px-5 text-sm font-medium text-[#0B1C3F] transition-all duration-200 hover:bg-[#A88A4F]"
          >
            Open Admin Panel
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>

        </header>

        {/* STAT GRID
            Layout: stack on mobile, 4-up on lg+. Each stat is a
            small definition list so screen readers announce the
            label and value as a pair. */}
        <dl className="grid grid-cols-1 gap-px bg-[#B8985A]/15 sm:grid-cols-2 lg:grid-cols-4">

          {/* 1. Students */}
          <Stat
            label="Students"
            value={studentCount}
            singularLabel="student"
            pluralLabel="students"
            icon={<Users className="h-4 w-4" strokeWidth={2} />}
          />

          {/* 2. Teachers
              If zero, we flag this in amber because new students
              cannot be auto-assigned and Speaking sessions cannot
              show a Join Zoom button. Click-through goes straight
              to the Teachers tab so the admin can act. */}
          <Stat
            label="Teachers"
            value={teacherCount}
            singularLabel="teacher"
            pluralLabel="teachers"
            icon={<GraduationCap className="h-4 w-4" strokeWidth={2} />}
            warning={hasNoTeachers}
            warningMessage={hasNoTeachers ? "Add a teacher to enable Speaking" : null}
            href="/admin/teachers"
          />

          {/* 3. Active speaking bookings */}
          <Stat
            label="Active sessions"
            value={bookedSessionCount}
            singularLabel="session"
            pluralLabel="sessions"
            icon={<CalendarCheck className="h-4 w-4" strokeWidth={2} />}
            href="/admin/classes"
          />

          {/* 4. Ungraded submissions
              Special label handling: shows "All caught up" when
              zero rather than "0 to review", which can read as a
              broken UI. */}
          <Stat
            label="Submissions"
            value={ungradedCount}
            customDisplay={ungradedLabel}
            icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}
            warning={hasUngradedBacklog}
            warningMessage={hasUngradedBacklog ? "Backlog growing" : null}
            href="/admin/submissions"
          />

        </dl>

      </div>

    </section>
  );
}


/* ============================================================
   Stat sub-component
   ============================================================ */

/*
  Single stat tile. Kept private to this file because it is only
  meaningful inside AdminPanelCard. If we add another panel that
  needs the same shape, we can lift it into a shared component.

  Why both `value` (number) and `customDisplay` (string)?
    Most stats render the count as-is plus a singular/plural noun
    ("3 students"). The submissions stat uses a custom string
    ("All caught up", "1 to review", "47 to review") because the
    zero case has different copy. Keeping value as a number means
    we still get pluralisation via singularLabel/pluralLabel for
    every other stat without each stat doing its own grammar.
*/
function Stat({
  label,
  value,
  singularLabel,
  pluralLabel,
  customDisplay,
  icon,
  warning = false,
  warningMessage = null,
  href,
}: {
  label:           string;
  value:           number;
  singularLabel?:  string;
  pluralLabel?:   string;
  customDisplay?: string;
  icon:           React.ReactNode;
  warning?:       boolean;
  warningMessage?: string | null;
  href?:          string;
}) {

  /* Build the display string. customDisplay wins if provided;
     otherwise we use plain number plus the right plural noun. */
  const display = customDisplay ?? (
    singularLabel && pluralLabel
      ? value === 1
        ? `${value} ${singularLabel}`
        : `${value} ${pluralLabel}`
      : String(value)
  );

  /* The whole tile is wrapped in a Link if href is provided.
     Using a wrapper helper keeps the JSX from branching twice. */
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <Link
        href={href}
        className="block bg-background p-5 transition-colors duration-200 hover:bg-foreground/[0.02]"
      >
        {children}
      </Link>
    ) : (
      <div className="bg-background p-5">{children}</div>
    );

  return (
    <Wrapper>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">

          {/* Label row */}
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
            <span aria-hidden="true" className="text-[#B8985A]">
              {icon}
            </span>
            {label}
          </dt>

          {/* Value */}
          <dd
            className={[
              "mt-2 font-serif text-2xl font-medium tracking-tight",
              warning ? "text-amber-500" : "text-foreground",
            ].join(" ")}
          >
            {display}
          </dd>

          {/* Warning sub-line, only when relevant */}
          {warning && warningMessage ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.25} />
              {warningMessage}
            </p>
          ) : null}

        </div>
      </div>
    </Wrapper>
  );
}
