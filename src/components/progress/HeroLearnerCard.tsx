import { Calendar, BookOpen, MessagesSquare, TrendingUp } from "lucide-react";


/*
  HeroLearnerCard

  The top hero of the dashboard. Two parts:
    LEFT  -- learner identity (name, level/purpose tags, member since date)
    RIGHT -- four metric tiles: lessons, writing avg, sessions, days active

  Aesthetic: every metric tile uses the same sky tint in light mode
  and a subtle elevated-card surface in dark mode. All four tiles
  are visually equal -- no gold accent on Writing -- so the row
  reads as one cohesive unit in any theme.

  Why dark-mode variants on hardcoded tints?
    Tailwind's "dark:" prefix activates when the html element has
    class="dark". Without dark variants, hex colours like #DCE6F2
    stay sky-blue in dark mode, where they end up muddy on the
    navy background. The pattern below pairs each light tint with
    a foreground/opacity token that picks up the right surface in
    either mode.
*/


type Props = {
  fullName:               string;
  levelKey:               string | null;
  levelName:              string | null;
  purposeName:            string | null;
  joinedAt:               Date;
  lessonsCompleted:       number;
  writingBandAverage:     number | null;
  speakingSessionsBooked: number;
  daysActive:             number;
};


export function HeroLearnerCard({
  fullName,
  levelKey,
  levelName,
  purposeName,
  joinedAt,
  lessonsCompleted,
  writingBandAverage,
  speakingSessionsBooked,
  daysActive,
}: Props) {

  const initials = fullName.split(" ").slice(0, 2).map((s) => s[0] ?? "").join("").toUpperCase();
  const memberSince = joinedAt.toLocaleDateString("en-GB", {
    month: "long",
    year:  "numeric",
  });

  return (
    <div className="rounded-3xl border border-[#B8985A]/20 bg-gradient-to-br from-background to-[#DCE6F2]/25 p-8 ring-1 ring-[#B8985A]/10 dark:to-foreground/[0.03] sm:p-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

        {/* LEFT -- identity */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B8985A] font-serif text-2xl font-medium text-[#0B1C3F] sm:h-20 sm:w-20 sm:text-3xl"
            >
              {initials || "N"}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                Learner profile
              </p>
              <h1 className="mt-1 font-serif text-2xl font-medium leading-tight tracking-tight text-foreground sm:text-3xl">
                {fullName}
              </h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {levelKey ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs font-medium text-foreground">
                <span className="font-serif text-sm">{levelKey}</span>
                <span className="text-foreground/60">{levelName ?? ""}</span>
              </span>
            ) : null}
            {purposeName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/60 px-3 py-1 text-xs font-medium text-foreground/80 dark:bg-foreground/[0.09]">
                {purposeName} English
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/60 dark:bg-foreground/[0.07]">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              Member since {memberSince}
            </span>
          </div>
        </div>

        {/* RIGHT -- 4 metric tiles in a 2x2 grid (all uniform) */}
        <div className="lg:col-span-3 lg:border-l lg:border-foreground/10 lg:pl-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
            At a glance
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            <MetricTile
              icon={<BookOpen className="h-4 w-4" strokeWidth={1.75} />}
              label="Lessons completed"
              value={lessonsCompleted.toString()}
            />

            <MetricTile
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
              label="Writing average"
              value={writingBandAverage !== null ? writingBandAverage.toFixed(1) : "--"}
              suffix={writingBandAverage !== null ? "/ 9" : undefined}
            />

            <MetricTile
              icon={<MessagesSquare className="h-4 w-4" strokeWidth={1.75} />}
              label="Speaking sessions"
              value={speakingSessionsBooked.toString()}
              suffix="/ 3"
            />

            <MetricTile
              icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />}
              label="Days active"
              value={daysActive.toString()}
            />

          </div>
        </div>

      </div>
    </div>
  );
}


function MetricTile({
  icon, label, value, suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#3D6FA8]/15 bg-[#DCE6F2]/40 p-4 transition-colors dark:border-foreground/10 dark:bg-foreground/[0.07]">
      <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-background/70 text-foreground dark:bg-foreground/[0.12]">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/55">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-medium leading-none tracking-tight text-foreground">
          {value}
        </span>
        {suffix ? <span className="text-xs text-foreground/50">{suffix}</span> : null}
      </p>
    </div>
  );
}
