"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

/*
  Auth server actions.

  Three actions live here:
    registerUser  creates a Supabase Auth user and mirrors the row
                  into our own User table.
    loginUser     signs an existing user in.
    signOut       clears the session and redirects to /login.

  Why server actions instead of REST endpoints?
    Server actions are functions you write once and call from a
    client component as if they were local. Next.js handles the
    transport (a POST under the hood). No need for a parallel
    /api/register route.

  Why we re-validate input here even though the form already did?
    The form runs on the client, where anyone can disable JS or
    POST a request that bypasses it. The server is the security
    boundary. We always validate again here using the same Zod
    schema the form imports, so the rules cannot drift.

  Why a discriminated union return type?
    Returning { success: true } | { success: false; error: string }
    lets the form check result.success once. TypeScript narrows the
    type so result.error is only readable on the failure branch.

  Why the same generic message for any login failure?
    If we said "no account with that email" vs "wrong password",
    we would be telling an attacker which emails are registered.
    That is called user enumeration and it is a real risk. The
    same opaque message for any failure prevents that leak.

  Why hide internal errors from the user?
    Prisma stack traces and Supabase error codes are useful in dev
    but should never reach a real user; they leak implementation
    details and create confusion. Internal errors are logged on
    the server with console.error and surface to the user as a
    plain "something went wrong" message.
*/

type ActionResult =
  | { success: true }
  | { success: false; error: string };

const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";
const INVALID_CREDENTIALS = "Invalid email or password.";

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  /* parsed.error.issues[0]?.message picks the first specific error
     to show; if there are several, the user fixes them one at a time. */
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_AUTH_ERROR,
    };
  }

  const { fullName, email, password } = parsed.data;

  const supabase = await createClient();

  /* Create the auth identity. The full_name goes into Supabase's
     user_metadata where it lives alongside the email and id. */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    /* Supabase returns a message containing "already registered"
       for duplicate emails. Surface that one specifically because
       the user genuinely needs to know to sign in instead. Every
       other failure stays generic. */
    console.error("Supabase signUp error:", error);
    const message = error.message.toLowerCase().includes("already")
      ? "An account with this email already exists."
      : GENERIC_AUTH_ERROR;
    return { success: false, error: message };
  }

  if (!data.user) {
    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  /* Mirror the user into our own User table.

     Why a separate table? Supabase Auth holds credentials and
     email verification. Our User table holds domain data: full
     name, level, purpose, target skill, progress relations. Both
     share the same UUID (data.user.id) so foreign keys to User.id
     work transparently.

     upsert handles the rare case where a row was created by a
     previous attempt that failed after this step. */
  try {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email, fullName },
      create: { id: data.user.id, email, fullName },
    });
  } catch (e) {
    console.error("Prisma upsert error:", e);
    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  /* revalidatePath tells Next.js to throw away the cached render
     for this path so any Server Component reading the session
     re-runs on the next navigation. "layout" scope means the
     root layout and everything under it. */
  revalidatePath("/", "layout");
  return { success: true };
}

export async function loginUser(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    /* Even validation failures return the generic message.
       This is the no-enumeration policy described in the file
       header. */
    return { success: false, error: INVALID_CREDENTIALS };
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Supabase signIn error:", error);
    return { success: false, error: INVALID_CREDENTIALS };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/*
  signOut returns Promise<never> because redirect() throws an
  internal Next.js error to short-circuit rendering, so this
  function never returns normally. The type reflects that.
*/
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
