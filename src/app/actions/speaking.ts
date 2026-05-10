"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";


/*
  Speaking server actions.

  Why server actions instead of an /api route?
    Server actions are the modern Next.js pattern for forms and
    mutations. They are typed end-to-end, integrate with React's
    useTransition for pending UI, and skip the boilerplate of
    REST routes. A booking is a single mutation tied to one page,
    which is exactly what server actions are designed for.

  Why limit users to 3 active bookings?
    The product promise on the homepage is three live one-on-one
    sessions. Letting a user book unlimited sessions would change
    that promise. We cap at three to keep the speaking experience
    aligned with what was sold.

  Why revalidatePath instead of relying on the client?
    After a mutation, the speaking page needs to re-fetch the user's
    bookings so the UI reflects the new state. revalidatePath tells
    Next.js to invalidate that cached page so the next render reads
    fresh data from the database. This is more reliable than asking
    the client to optimistically update its local state.
*/


const MAX_BOOKINGS = 3;

const SLOT_PATH = "/paths"; // covers /paths/[level]/[purpose]/speaking via wildcard


type BookSessionInput = {
  sessionDate: string; // ISO 8601 string -- backend converts to Date
};

type ActionResult =
  | { success: true }
  | { success: false; error: string };


export async function bookSession(input: BookSessionInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to book a session." };

  const sessionDate = new Date(input.sessionDate);
  if (isNaN(sessionDate.getTime())) {
    return { success: false, error: "Invalid session date." };
  }

  // Reject sessions in the past
  if (sessionDate.getTime() < Date.now()) {
    return { success: false, error: "Cannot book a session in the past." };
  }

  // Count existing active bookings for this user
  const activeCount = await prisma.speakingBooking.count({
    where: {
      userId: user.id,
      status: "BOOKED",
    },
  });

  if (activeCount >= MAX_BOOKINGS) {
    return {
      success: false,
      error: `You already have ${MAX_BOOKINGS} sessions booked. Cancel one to book a different time.`,
    };
  }

  // Check that this exact slot is not already booked by this user
  const existing = await prisma.speakingBooking.findFirst({
    where: {
      userId:      user.id,
      sessionDate: sessionDate,
      status:      "BOOKED",
    },
  });

  if (existing) {
    return { success: false, error: "You have already booked this session." };
  }

  // Look up the user's assigned teacher so we can attach it to
  // the booking. The schema makes SpeakingBooking.teacherId
  // nullable to keep flexibility for v2 (per-booking teacher
  // swaps), but in v1 every booking should carry the user's
  // assigned teacher so the Join Zoom button can render the
  // teacher's Personal Meeting Room without an extra round trip.
  const profile = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { assignedTeacherId: true },
  });

  // Create the booking with the assigned teacher attached.
  // assignedTeacherId may be null if onboarding has not run yet
  // for legacy accounts; in that case the booking is still valid
  // and the UI will render a "Zoom link pending" placeholder
  // until a teacher is assigned.
  await prisma.speakingBooking.create({
    data: {
      userId:      user.id,
      teacherId:   profile?.assignedTeacherId ?? null,
      sessionDate: sessionDate,
      status:      "BOOKED",
    },
  });

  revalidatePath(SLOT_PATH, "layout");
  return { success: true };
}


export async function cancelBooking(input: { bookingId: string }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to cancel a booking." };

  // Make sure the booking belongs to the user
  const booking = await prisma.speakingBooking.findUnique({
    where: { id: input.bookingId },
  });

  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.userId !== user.id) return { success: false, error: "You can only cancel your own bookings." };

  await prisma.speakingBooking.update({
    where: { id: input.bookingId },
    data:  { status: "CANCELLED" },
  });

  revalidatePath(SLOT_PATH, "layout");
  return { success: true };
}
