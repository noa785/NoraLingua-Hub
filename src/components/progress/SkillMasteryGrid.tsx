import { BookOpen, Headphones, PenLine, MessagesSquare } from "lucide-react";
import Link from "next/link";

import type { SkillMastery } from "@/lib/progress-stats";


/*
  SkillMasteryGrid

  A 4-up grid of skill rings. Each card shows:
    - Skill name and icon
    - SVG progress ring (0 to 100 percent of the path's items for that skill)
    - "X of Y" caption
    - Click target -- jumps to /paths/{level}/{purpose}/{skill}

  Aesthetic: uniform soft sky-blue tint in light mode, subtle
  elevated-card surface in dark mode. The skill is differentiated
  by icon, not by colour.
*/


type Props = {
  skills:      SkillMastery[];
  pathPrefix:  string;
};


const SKILL_ICONS = {
  READING:   BookOpen,
  LISTENING: Headphones,
  WRITING:   PenLine,
  SPEAKING:  MessagesSquare,
} as const;


export function SkillMasteryGrid({ skills, pathPrefix }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {skills.map((s) => (
        <SkillRingCard
          key={s.skill}
          skill={s}
          href={`${pathPrefix}/${s.skill.toLowerCase()}`}
        />
      ))}
    </div>
  );
}


function SkillRingCard({ skill, href }: { skill: SkillMastery; href: string }) {
  const Icon = SKILL_ICONS[skill.skill];
  const isComplete = skill.percentDone === 100;
  const isStarted  = skill.completed > 0;

  return (
    <Link
      href={href}
      className="group flex flex-col items-center rounded-2xl border border-[#3D6FA8]/15 bg-[#DCE6F2]/35 p-6 text-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#B8985A]/40 hover:bg-[#DCE6F2]/55 hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.12)] dark:border-foreground/10 dark:bg-foreground/[0.07] dark:hover:border-[#B8985A]/40 dark:hover:bg-foreground/[0.11]"
    >

      {/* Ring */}
      <div className="relative mb-4 h-24 w-24">
        <ProgressRing percent={skill.percentDone} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="mb-0.5 h-4 w-4 text-foreground/60" strokeWidth={1.75} />
          <span className="font-serif text-xl font-medium tracking-tight text-foreground">
            {skill.percentDone}
          </span>
          <span className="-mt-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40">
            percent
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="font-serif text-base font-medium tracking-tight text-foreground">
        {skill.label}
      </p>

      <p className="mt-1 text-xs text-foreground/60">
        {skill.completed} of {skill.totalItems} {skill.skill === "SPEAKING" ? "sessions" : "items"}
      </p>

      {/* Status pill */}
      {isComplete ? (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#B8985A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8985A]">
          Complete
        </span>
      ) : isStarted ? (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/65 dark:bg-foreground/[0.12]">
          In progress
        </span>
      ) : (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50 dark:bg-foreground/[0.07]">
          Not started
        </span>
      )}

    </Link>
  );
}


/*
  SVG progress ring -- pure geometry. The track and fill colours
  use semi-transparent values that read on either background.
*/

function ProgressRing({ percent }: { percent: number }) {
  const size = 96;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  const isEmpty = percent === 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth={stroke}
        className="text-foreground"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isEmpty ? "currentColor" : "#B8985A"}
        strokeOpacity={isEmpty ? "0.12" : "1"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={isEmpty ? "text-foreground transition-[stroke-dashoffset] duration-700 ease-out" : "transition-[stroke-dashoffset] duration-700 ease-out"}
      />
    </svg>
  );
}
