import Link from "next/link";

import { prisma } from "@/lib/prisma";


/*
  Admin Submissions list page.

  Every writing submission across all learners. Sorted newest first
  (gradedAt when graded, otherwise createdAt). Read-only by design:
  writing submissions are immutable once graded by the Claude API.
*/


export const metadata = {
  title: "Submissions - Admin",
};


export default async function AdminSubmissionsPage() {

  const submissions = await prisma.submission.findMany({
    include: {
      user:       { select: { fullName: true, email: true } },
      assignment: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Submissions
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Every writing submission, newest first.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Each row is one learner submission graded by the Claude
          API. Click a row to view the full response, score
          breakdown, and feedback.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Learner</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Assignment</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Band</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">Words</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Submitted</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-foreground/60">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="transition-colors hover:bg-foreground/[0.02]">

                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{sub.user.fullName}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{sub.user.email}</p>
                  </td>

                  <td className="px-6 py-4 text-sm text-foreground/80">
                    {sub.assignment.title}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {sub.bandOverall != null ? (
                      <span className="font-mono text-sm text-foreground">
                        {sub.bandOverall.toFixed(1)} <span className="text-foreground/40">/ 9</span>
                      </span>
                    ) : (
                      <span className="text-xs italic text-foreground/40">pending</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right font-mono text-sm text-foreground/70">
                    {sub.wordCount}
                  </td>

                  <td className="px-6 py-4 text-xs text-foreground/60">
                    {new Date(sub.createdAt).toLocaleString("en-GB", {
                      day:   "2-digit",
                      month: "short",
                      year:  "numeric",
                      hour:   "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/submissions/${sub.id}`}
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
        Showing {submissions.length} submission{submissions.length === 1 ? "" : "s"}.
      </p>

    </div>
  );
}
