import Link from "next/link";

import { prisma } from "@/lib/prisma";


/*
  Admin Lessons list page.

  All lessons across all material sets in one scannable table,
  ordered by level then purpose then skill so similar lessons
  cluster naturally. Each row shows which material set the
  lesson belongs to, its skill, and how many questions it has.
*/


export const metadata = {
  title: "Lessons - Admin",
};


export default async function AdminLessonsPage(): Promise<JSX.Element> {

  const lessons = await prisma.lesson.findMany({
    include: {
      materialSet: {
        include: {
          level:   true,
          purpose: true,
        },
      },
      _count: { select: { questions: true } },
    },
    orderBy: [
      { materialSet: { level:   { sortOrder: "asc" } } },
      { materialSet: { purpose: { sortOrder: "asc" } } },
      { skill:     "asc" },
      { sortOrder: "asc" },
    ],
  });

  const skillLabels: Record<string, string> = {
    READING:   "Reading",
    LISTENING: "Listening",
    WRITING:   "Writing",
    SPEAKING:  "Speaking",
  };

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Lessons
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Every lesson on the platform.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Reading and listening lessons across all material sets,
          grouped naturally by level and purpose.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Title</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Material set</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Skill</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Questions</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Minutes</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-foreground/60">
                  No lessons yet.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.id} className="transition-colors hover:bg-foreground/[0.02]">

                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{lesson.title}</p>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-foreground/15 px-2 py-0.5 text-xs font-medium text-foreground">
                      {lesson.materialSet.level.key}
                    </span>
                    <span className="ml-2 text-xs text-foreground/70">
                      {lesson.materialSet.purpose.name}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-foreground/80">
                    {skillLabels[lesson.skill] ?? lesson.skill}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-sm text-foreground">
                    {lesson._count.questions}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-sm text-foreground/70">
                    {lesson.estimatedMinutes ?? "-"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/lessons/${lesson.id}`}
                      className="text-sm font-medium text-[#B8985A] hover:underline"
                    >
                      View &rarr;
                    </Link>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      <p className="text-xs text-foreground/50">
        Showing {lessons.length} lesson{lessons.length === 1 ? "" : "s"}.
      </p>

    </div>
  );
}
