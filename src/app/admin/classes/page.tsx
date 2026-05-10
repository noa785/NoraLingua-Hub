import { prisma } from "@/lib/prisma";


/*
  Admin Classes page.

  Shows all speaking session bookings sorted by session date.
  SpeakingBooking does not link to a Teacher model in the current
  schema -- bookings are platform-wide and are fulfilled by the
  active teacher off-platform. The status enum (BOOKED, CANCELLED,
  COMPLETED) tells the admin where each booking stands.
*/


export const metadata = {
  title: "Classes - Admin",
};


export default async function AdminClassesPage(): Promise<JSX.Element> {

  const bookings = await prisma.speakingBooking.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { sessionDate: "asc" },
  });

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Classes
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          Speaking sessions across the platform.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Every learner booking, sorted by session date.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">When</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Learner</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Booked on</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-foreground/60">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="transition-colors hover:bg-foreground/[0.02]">

                  <td className="px-6 py-4 text-sm text-foreground">
                    {new Date(booking.sessionDate).toLocaleString("en-GB", {
                      weekday: "short",
                      day:     "2-digit",
                      month:   "short",
                      year:    "numeric",
                      hour:    "2-digit",
                      minute:  "2-digit",
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{booking.user.fullName}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{booking.user.email}</p>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={
                        booking.status === "BOOKED"
                          ? "inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                          : booking.status === "CANCELLED"
                            ? "inline-flex rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium text-foreground/60"
                            : "inline-flex rounded-full border border-[#B8985A]/40 bg-[#B8985A]/[0.06] px-2.5 py-0.5 text-xs font-medium text-[#B8985A]"
                      }
                    >
                      {booking.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-foreground/60">
                    {new Date(booking.createdAt).toLocaleDateString("en-GB", {
                      day:   "2-digit",
                      month: "short",
                      year:  "numeric",
                    })}
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      <p className="text-xs text-foreground/50">
        Showing {bookings.length} booking{bookings.length === 1 ? "" : "s"}.
      </p>

    </div>
  );
}
