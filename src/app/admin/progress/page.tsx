import { prisma } from "@/lib/prisma";


/*
  Admin Progress page.

  Every learner's reading and listening progress in one table,
  ordered by most recently accessed. This is the admin counterpart
  to the per-learner Skill Mastery rings on the dashboard --
  same data, but flattened across every learner so an admin can
  scan platform-wide engagement at a glance.

  Reading and listening are the only skills with comprehension
  questions, so this table naturally excludes writing (which has
  its own Submissions tab) and speaking (Classes tab).
*/


export const metadata = {
  title: "Progress - Admin",
};


export default async function AdminProgressPage() {

  const progress = await prisma.progress.findMany({
    include: {
      user:   { select: { fullName: true, email: true } },
      lesson: {
        include: {
          materialSet: {
            include: { level: true, purpose: true },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
    take: 200,
  });

  /* Sum a couple of headline numbers so the top of the page tells
     a quick story before the table gets into the per-row weeds. */
  const totalRows      = progress.length;
  const completedRows  = progress.filter((p) => p.isCompleted).length;
  const inProgressRows = totalRows - completedRows;

  const skillLabels: Record<string, string> = {
    READING:   "Reading",
    LISTENING: "Listening",
    WRITING:   "Writing",
    SPEAKING:  "Speaking",
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Progress
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Reading and listening across all learners.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          One row per learner-and-lesson. Sorted by most recently
          accessed so the freshest activity sits at the top.
        </p>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-foreground/10 bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Lessons touched
          </p>
          <p className="mt-2 font-serif text-3xl text-foreground">{totalRows}</p>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Completed
          </p>
          <p className="mt-2 font-serif text-3xl text-foreground">{completedRows}</p>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            In progress
          </p>
          <p className="mt-2 font-serif text-3xl text-foreground">{inProgressRows}</p>
        </div>

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Learner</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Lesson</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Skill</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Path</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Score</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Last accessed</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {progress.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-foreground/60">
                  No progress recorded yet.
                </td>
              </tr>
            ) : (
              progress.map((row) => {

                const ratio = row.totalQuestions > 0
                  ? Math.round((row.correctAnswers / row.totalQuestions) * 100)
                  : null;

                return (
                  <tr key={row.id} className="transition-colors hover:bg-foreground/[0.02]">

                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{row.user.fullName}</p>
                      <p className="mt-0.5 text-xs text-foreground/60">{row.user.email}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-foreground/85">
                      {row.lesson.title}
                    </td>

                    <td className="px-6 py-4 text-sm text-foreground/80">
                      {skillLabels[row.lesson.skill] ?? row.lesson.skill}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-foreground/15 px-2 py-0.5 text-xs font-medium text-foreground">
                        {row.lesson.materialSet.level.key}
                      </span>
                      <span className="ml-2 text-xs text-foreground/70">
                        {row.lesson.materialSet.purpose.name}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {row.totalQuestions > 0 ? (
                        <span className="font-mono text-sm text-foreground">
                          {row.correctAnswers} / {row.totalQuestions}
                          <span className="ml-2 text-xs text-foreground/50">
                            ({ratio}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs italic text-foreground/40">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {row.isCompleted ? (
                        <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-[#B8985A]/40 bg-[#B8985A]/[0.06] px-2.5 py-0.5 text-xs font-medium text-[#B8985A]">
                          In progress
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-foreground/60">
                      {new Date(row.lastAccessedAt).toLocaleString("en-GB", {
                        day:   "2-digit",
                        month: "short",
                        year:  "numeric",
                        hour:   "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      <p className="text-xs text-foreground/50">
        Showing {totalRows} progress row{totalRows === 1 ? "" : "s"} (latest 200).
      </p>

    </div>
  );
}
