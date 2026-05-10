/*
  Admin authorization helper.

  Used by every admin page and server action.
  If the current session is not an admin, redirects to /dashboard.
  If there is no session at all, middleware will have already
  redirected to /login before this runs, so we only handle the
  authenticated-but-not-admin case here.

  Returns the full Prisma User row so callers can read fullName,
  email, etc. without a second database round trip.
*/

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return dbUser;
}
