import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";


/*
  Admin Material Set detail page.

  Drills into one material set and lists everything inside it:
  lessons (grouped by skill) and writing assignments. From here
  an admin can navigate to a specific lesson or assignment to
  inspect or edit it.

  notFound() is called if the id does not match a row, which
  Next.js renders as a 404 page automatically.
*/


export const metadata = {
  title: "Material set detail - Admin",
};


type Props = {
  params: Promise<{ id: string }>;
};


export default async function AdminMaterialSetDetailPage({ params }: Props): Promise<JSX.Element> {

  const { id } = await params;

  const materialSet = await prisma.materialSet.findUnique({
    where: { id },
    include: {
      level:   true,
      purpose: true,
      lessons: {
        orderBy: [
          { skill:     "asc" },
          { sortOrder: "asc" },
        ],
        include: {
          _count: { select: { questions: true } },
        },
      },
      writingAssignments: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!materialSet) notFound();

  /* Group lessons by skill so the detail view shows them in
     skill-bucketed sections rather than one undifferentiated list. */
  const lessonsBySkill = materialSet.lessons.reduce<Record<string, typeof materialSet.lessons>>(
    (acc, lesson) => {
      const key = lesson.skill;
      if (!acc[key]) acc[key] = [];
      acc[key].push(lesson);
      return acc;
    },
    {},
  );

  const skillLabels: Record<string, string> = {
    READING:   "Reading",
    LISTENING: "Listening",
    WRITING:   "Writing",
    SPEAKING:  "Speaking",
  };

  return (
    <div className="space-y-10">

      {/* Breadcrumb */}
      <div className="text-sm text-foreground/60">
        <Link href="/admin/material-sets" className="hover:text-foreground">
          Material sets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">{materialSet.title}</span>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          {materialSet.level.key} &middot; {materialSet.purpose.name}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          {materialSet.title}
        </h1>
        {materialSet.description ? (
          <p className="mt-3 max-w-2xl text-sm text-foreground/70">
            {materialSet.description}
          </p>
        ) : null}
      </div>

      {/* Lessons by skill */}
      <section className="space-y-6">

        <h2 className="font-serif text-xl text-foreground">Lessons</h2>

        {Object.keys(lessonsBySkill).length === 0 ? (
          <p className="text-sm text-foreground/60">No lessons in this set.</p>
        ) : (
          Object.entries(lessonsBySkill).map(([skill, lessons]) => (
            <div key={skill} className="rounded-2xl border border-foreground/10 bg-background p-6">

              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                {skillLabels[skill] ?? skill}
              </h3>

              <ul className="mt-3 divide-y divide-foreground/10">
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between py-3">

                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate font-medium text-foreground">
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/60">
                        {lesson._count.questions} question{lesson._count.questions === 1 ? "" : "s"}
                        {lesson.estimatedMinutes != null
                          ? ` \u00b7 ~${lesson.estimatedMinutes} min`
                          : ""}
                      </p>
                    </div>

                    <Link
                      href={`/admin/lessons/${lesson.id}`}
                      className="text-sm font-medium text-[#B8985A] hover:underline"
                    >
                      View
                    </Link>

                  </li>
                ))}
              </ul>

            </div>
          ))
        )}
      </section>

      {/* Writing assignments */}
      <section className="space-y-4">

        <h2 className="font-serif text-xl text-foreground">Writing assignments</h2>

        {materialSet.writingAssignments.length === 0 ? (
          <p className="text-sm text-foreground/60">No writing assignments in this set.</p>
        ) : (
          <div className="rounded-2xl border border-foreground/10 bg-background">
            <ul className="divide-y divide-foreground/10">
              {materialSet.writingAssignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between px-6 py-3">

                  <div className="min-w-0 flex-1 pr-4">
                    <p className="truncate font-medium text-foreground">
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/60">
                      {assignment.minWords ? `min ${assignment.minWords} words` : "no minimum"}
                    </p>
                  </div>

                  <Link
                    href={`/admin/assignments/${assignment.id}`}
                    className="text-sm font-medium text-[#B8985A] hover:underline"
                  >
                    View
                  </Link>

                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

    </div>
  );
}
