import Link from "next/link";

import { prisma } from "@/lib/prisma";


/*
  Admin Material Sets list page.

  Shows every MaterialSet in the system in one table, ordered by
  level then purpose for predictable scanning. Each row links to a
  detail view where lessons can be inspected and managed.

  Counts (lessons, writing assignments) are computed in a single
  query using Prisma _count, so the table loads in one round trip
  no matter how many sets exist.
*/


export const metadata = {
  title: "Material sets - Admin",
};


export default async function AdminMaterialSetsPage(): Promise<JSX.Element> {

  const materialSets = await prisma.materialSet.findMany({
    include: {
      level:   true,
      purpose: true,
      _count: {
        select: {
          lessons:           true,
          writingAssignments: true,
        },
      },
    },
    orderBy: [
      { level:   { sortOrder: "asc" } },
      { purpose: { sortOrder: "asc" } },
    ],
  });

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Material sets
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Every level + purpose pairing on the platform.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Each material set bundles the lessons and writing
          assignments a learner sees once they declare a level
          and purpose during onboarding.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Title</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Level</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Purpose</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Lessons</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Writing</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {materialSets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-foreground/60">
                  No material sets yet. Run the database seed.
                </td>
              </tr>
            ) : (
              materialSets.map((set) => (
                <tr key={set.id} className="transition-colors hover:bg-foreground/[0.02]">

                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{set.title}</p>
                    {set.description ? (
                      <p className="mt-0.5 text-xs text-foreground/60 line-clamp-1">
                        {set.description}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {set.level.key}
                    </span>
                    <span className="ml-2 text-xs text-foreground/60">
                      {set.level.name}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-foreground/80">
                    {set.purpose.name}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-sm text-foreground">
                    {set._count.lessons}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-sm text-foreground">
                    {set._count.writingAssignments}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/material-sets/${set.id}`}
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
        Showing {materialSets.length} material{materialSets.length === 1 ? " set" : " sets"}.
      </p>

    </div>
  );
}
