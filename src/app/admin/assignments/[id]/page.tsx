import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";


/*
  Admin Writing Assignment detail page.

  Read-only view of one writing assignment: its prompt, minimum
  word count, and recent learner submissions for it.
*/


export const metadata = {
  title: "Writing assignment - Admin",
};


type Props = {
  params: Promise<{ id: string }>;
};


export default async function AdminAssignmentDetailPage({ params }: Props) {

  const { id } = await params;

  const assignment = await prisma.writingAssignment.findUnique({
    where: { id },
    include: {
      materialSet: {
        include: { level: true, purpose: true },
      },
      submissions: {
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!assignment) notFound();

  return (
    <div className="space-y-10">

      <div className="text-sm text-foreground/60">
        <Link href="/admin/material-sets" className="hover:text-foreground">Material sets</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/material-sets/${assignment.materialSet.id}`} className="hover:text-foreground">
          {assignment.materialSet.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">{assignment.title}</span>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          {assignment.materialSet.level.key} &middot; {assignment.materialSet.purpose.name} &middot; Writing
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          {assignment.title}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Minimum {assignment.minWords} words &middot; max {assignment.maxWords} words
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-foreground">Prompt</h2>
        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {assignment.prompt}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-foreground">
          Recent submissions ({assignment.submissions.length})
        </h2>
        {assignment.submissions.length === 0 ? (
          <p className="text-sm text-foreground/60">No submissions for this assignment yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
            <ul className="divide-y divide-foreground/10">
              {assignment.submissions.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-foreground">{sub.user.fullName}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">
                      {new Date(sub.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-foreground">
                      {sub.bandOverall != null ? `${sub.bandOverall.toFixed(1)} / 9` : "pending"}
                    </span>
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="text-sm font-medium text-[#B8985A] hover:underline"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

    </div>
  );
}
