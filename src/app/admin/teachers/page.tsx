import { prisma } from "@/lib/prisma";


/*
  Admin Teachers page.

  Lists every teacher record with key operational data:
    - full name, email
    - Zoom link (live URL)
    - active flag
    - assigned student count (how many learners are paired with
      this teacher right now)
    - booking counts grouped by status (BOOKED, COMPLETED, CANCELLED)

  Why surface assigned-student count?
    The platform load-balances new students to the teacher with
    the fewest active assignments. Seeing the current spread tells
    the admin whether the cohort is balanced and helps catch the
    rare case where a teacher is offline but still receiving new
    students.
*/


export const metadata = {
  title: "Teachers - Admin",
};


type TeacherRow = {
  id:          string;
  fullName:    string;
  email:       string;
  bio:         string;
  zoomUrl:     string | null;
  isActive:    boolean;
  studentCount:    number;
  bookingsBooked:    number;
  bookingsCompleted: number;
  bookingsCancelled: number;
};


export default async function AdminTeachersPage() {

  /* Fetch all teachers with relation counts. We compute booking
     counts grouped by status separately because Prisma _count
     does not support filtered counts in a single call without
     splitting by relation. Two queries kept simple and clear. */
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id:        true,
      fullName:  true,
      email:     true,
      bio:       true,
      zoomUrl:   true,
      isActive:  true,
      _count: {
        select: { assignedStudents: true },
      },
    },
  });

  /* Booking counts per teacher, grouped by status. */
  const bookingGroups = await prisma.speakingBooking.groupBy({
    by:      ["teacherId", "status"],
    _count:  { _all: true },
  });

  const bookingMap = new Map<string, { booked: number; completed: number; cancelled: number }>();
  for (const row of bookingGroups) {
    if (!row.teacherId) continue;
    const current = bookingMap.get(row.teacherId) ?? { booked: 0, completed: 0, cancelled: 0 };
    if (row.status === "BOOKED")    current.booked    = row._count._all;
    if (row.status === "COMPLETED") current.completed = row._count._all;
    if (row.status === "CANCELLED") current.cancelled = row._count._all;
    bookingMap.set(row.teacherId, current);
  }

  const rows: TeacherRow[] = teachers.map((t) => {
    const counts = bookingMap.get(t.id) ?? { booked: 0, completed: 0, cancelled: 0 };
    return {
      id:                t.id,
      fullName:          t.fullName,
      email:             t.email,
      bio:               t.bio,
      zoomUrl:           t.zoomUrl,
      isActive:          t.isActive,
      studentCount:      t._count.assignedStudents,
      bookingsBooked:    counts.booked,
      bookingsCompleted: counts.completed,
      bookingsCancelled: counts.cancelled,
    };
  });

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Teachers
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Teaching team and student load.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Each new student is auto-assigned to the active teacher
          with the fewest current students. Use the counts here to
          confirm load is spread evenly.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-background p-12 text-center">
          <p className="text-sm text-foreground/60">
            No teachers yet. Add a teacher record in Supabase to enable
            speaking session assignment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {rows.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl border border-foreground/10 bg-background p-6"
            >

              {/* Header row */}
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
                    {t.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60">
                    {t.email}
                  </p>
                </div>

                <span
                  className={
                    t.isActive
                      ? "inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                      : "inline-flex rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium text-foreground/60"
                  }
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </header>

              {/* Bio */}
              <p className="mt-4 text-sm leading-[1.6] text-foreground/70">
                {t.bio}
              </p>

              {/* Stats grid */}
              <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-foreground/10 pt-5">

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Students</dt>
                  <dd className="mt-1 font-serif text-2xl text-foreground">{t.studentCount}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Booked</dt>
                  <dd className="mt-1 font-serif text-2xl text-foreground">{t.bookingsBooked}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Done</dt>
                  <dd className="mt-1 font-serif text-2xl text-foreground">{t.bookingsCompleted}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Cancelled</dt>
                  <dd className="mt-1 font-serif text-2xl text-foreground/50">{t.bookingsCancelled}</dd>
                </div>

              </dl>

              {/* Zoom URL */}
              <div className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Zoom Link
                </p>
                {t.zoomUrl ? (
                  
                    <a
                  
                      href={t.zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-sm text-emerald-400 underline-offset-2 hover:underline"
                  >
                    {t.zoomUrl}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-amber-400">
                    No Zoom URL set. Students will not see a Join Zoom button until this is added.
                  </p>
                )}
              </div>

            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-foreground/50">
        Showing {rows.length} teacher{rows.length === 1 ? "" : "s"}.
      </p>

    </div>
  );
}
