import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";


/*
  Path access guard.

  When a user manually visits /paths/A2/TRAVEL but their profile
  is set to B1 + JOB, we redirect them back to /dashboard with a
  flash message explaining what happened.

  Why redirect rather than 404?
    A 404 reads as "this URL is broken" and feels punitive. A
    redirect reads as "you took a wrong turn, here's where you
    belong." The flash message tells the user what they tried
    to do and where they ended up. It is gracious.

  Why use a URL query param for the flash message?
    We do not have a toast/notification library. The simplest
    durable mechanism is to pass a one-shot string in ?flash=...
    and have the dashboard read it on render. Server components
    cannot set cookies on this kind of redirect cleanly, but they
    can build a URL with a query string -- which is exactly what
    we need.
*/


/*
  Returns true if (levelKey, purposeKey) matches the user's profile.
  Returns false if not -- caller should redirect.
*/

export async function userOwnsPath(
  userId:     string,
  levelKey:   string,    // e.g. "B1"
  purposeKey: string,    // e.g. "JOB"
): Promise<boolean> {
  const profile = await prisma.user.findUnique({
    where:  { id: userId },
    select: { level: true, purpose: true },
  });
  if (!profile?.level || !profile?.purpose) return false;
  return profile.level === levelKey.toUpperCase()
      && profile.purpose === purposeKey.toUpperCase();
}


/*
  Convenience: enforce ownership in a server component. If the
  path does not belong to the user, this calls Next.js redirect()
  which throws -- so it never returns in that case.
*/

export async function enforcePathOwnership(
  userId:     string,
  levelKey:   string,
  purposeKey: string,
): Promise<void> {
  const ok = await userOwnsPath(userId, levelKey, purposeKey);
  if (ok) return;

  // Build flash message and redirect
  const message = encodeURIComponent(
    `That path is not part of your study plan. You have been returned to your dashboard.`,
  );
  redirect(`/dashboard?flash=${message}`);
}
