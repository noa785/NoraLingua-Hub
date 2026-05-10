import { TrendingUp, ArrowRight, Sparkles, PenLine } from "lucide-react";
import Link from "next/link";

import type { WritingProgress } from "@/lib/progress-stats";


/*
  WritingJourneyChart

  A pure-SVG line chart of band scores per submission over time.
  No chart library -- writing the path data ourselves keeps the
  bundle small and lets us match the brand exactly.

  Why pure SVG?
    The chart is server-rendered and read-only. A chart library
    would add 50+ KB to the client bundle for a single tiny chart
    that needs no interactivity beyond what an SVG element gives
    us. The geometry is straightforward: 7 lines of math.

  Why no axis labels with grid lines?
    The chart is meant to communicate trajectory, not precise
    numbers. Each data point shows its band score on hover, the
    summary stats above the chart give the headline numbers, and
    a clean visual is more LinkedIn-shareable than a busy one.
*/


type Props = {
  writing:  WritingProgress;
  pathHref: string;       // path to writing prompts for the empty-state CTA
};


export function WritingJourneyChart({ writing, pathHref }: Props) {

  // EMPTY STATE
  if (writing.totalSubmissions === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/15 bg-background/50 p-10 text-center sm:p-12">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCE6F2] text-foreground">
          <PenLine className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          Your writing journey starts here.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-[1.6] text-foreground/70">
          Submit your first writing assignment to see how your band score grows over time.
        </p>
        <Link
          href={pathHref}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90"
        >
          Start a writing prompt
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">

      {/* Header strip */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
            Writing journey
          </p>
          <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            Band score across submissions.
          </h3>
        </div>

        {/* Headline numbers */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <Stat label="Average" value={writing.averageBand?.toFixed(1) ?? "--"} />
          <Stat label="Latest"  value={writing.latestBand?.toFixed(1)  ?? "--"} accent />
          {writing.improvement !== null ? (
            <Stat
              label="Change"
              value={(writing.improvement >= 0 ? "+" : "") + writing.improvement.toFixed(1)}
              positive={writing.improvement > 0}
              negative={writing.improvement < 0}
            />
          ) : null}
        </div>

      </div>

      {/* Chart -- only show if 2+ points (1 point is just a dot, not a line) */}
      {writing.history.length >= 2 ? (
        <BandLineChart history={writing.history} />
      ) : (
        <SinglePointFallback band={writing.history[0].band} />
      )}

      {/* Legend / footnote */}
      <p className="mt-5 text-xs text-foreground/50">
        Each point is one graded submission. {writing.totalSubmissions} {writing.totalSubmissions === 1 ? "submission" : "submissions"} so far.
      </p>

    </div>
  );
}


/* ============================================================
   COMPONENTS
   ============================================================ */


function Stat({
  label, value, accent = false, positive = false, negative = false,
}: {
  label: string; value: string; accent?: boolean; positive?: boolean; negative?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className={[
        "font-serif text-2xl font-medium leading-none tracking-tight",
        accent   ? "text-[#B8985A]" :
        positive ? "text-[#1F7A4D]" :
        negative ? "text-[#B8345A]" :
        "text-foreground",
      ].join(" ")}>
        {value}
      </p>
    </div>
  );
}


function BandLineChart({ history }: { history: { band: number; date: Date; assignmentTitle: string }[] }) {
  // Coordinate space: 800 x 240 viewBox, padded inside.
  const W = 800;
  const H = 240;
  const padL = 40;
  const padR = 24;
  const padT = 24;
  const padB = 36;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Domain: x is submission index (0..n-1), y is band 0..9
  const xCount = history.length;

  const xFor = (i: number) => padL + (xCount === 1 ? innerW / 2 : (innerW * i) / (xCount - 1));
  const yFor = (band: number) => padT + innerH - (innerH * Math.min(9, Math.max(0, band))) / 9;

  // Build the line path
  const linePath = history.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.band)}`).join(" ");

  // Build a soft fill area under the line (stroke + fill)
  const areaPath = `${linePath} L ${xFor(xCount - 1)} ${padT + innerH} L ${xFor(0)} ${padT + innerH} Z`;

  // Reference horizontal lines at bands 5 and 7
  const yBand5 = yFor(5);
  const yBand7 = yFor(7);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Line chart of band scores across writing submissions">

        {/* Gridlines: bands 0/3/5/7/9 */}
        {[0, 3, 5, 7, 9].map((b) => {
          const y = yFor(b);
          return (
            <g key={b}>
              <line
                x1={padL} x2={W - padR}
                y1={y} y2={y}
                stroke="rgba(11,28,63,0.06)"
                strokeDasharray={b === 5 || b === 7 ? "" : "2 4"}
              />
              <text
                x={padL - 8}
                y={y + 4}
                fontSize="10"
                textAnchor="end"
                fill="rgba(11,28,63,0.4)"
                fontFamily="var(--font-sans)"
              >
                {b}
              </text>
            </g>
          );
        })}

        {/* Filled area under line */}
        <path d={areaPath} fill="rgba(184,152,90,0.10)" />

        {/* The line itself */}
        <path
          d={linePath}
          fill="none"
          stroke="#B8985A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points -- circles */}
        {history.map((p, i) => (
          <g key={p.assignmentTitle + i}>
            <circle
              cx={xFor(i)}
              cy={yFor(p.band)}
              r="6"
              fill="#0B1C3F"
            />
            <circle
              cx={xFor(i)}
              cy={yFor(p.band)}
              r="3"
              fill="#B8985A"
            />
            {/* Band label above point */}
            <text
              x={xFor(i)}
              y={yFor(p.band) - 12}
              fontSize="11"
              textAnchor="middle"
              fill="rgba(11,28,63,0.85)"
              fontFamily="var(--font-serif)"
              fontWeight="500"
            >
              {p.band.toFixed(1)}
            </text>
            {/* Submission index label below */}
            <text
              x={xFor(i)}
              y={H - padB + 18}
              fontSize="10"
              textAnchor="middle"
              fill="rgba(11,28,63,0.5)"
              fontFamily="var(--font-sans)"
            >
              #{i + 1}
            </text>
            {/* Native tooltip on hover */}
            <title>{`Submission ${i + 1}: ${p.assignmentTitle} - Band ${p.band.toFixed(1)}`}</title>
          </g>
        ))}

        {/* Axis label for X */}
        <text
          x={(padL + W - padR) / 2}
          y={H - 6}
          fontSize="10"
          textAnchor="middle"
          fill="rgba(11,28,63,0.5)"
          fontFamily="var(--font-sans)"
        >
          submission order
        </text>
      </svg>
    </div>
  );
}


function SinglePointFallback({ band }: { band: number }) {
  return (
    <div className="rounded-xl bg-[#DCE6F2]/30 p-8 text-center">
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
        <Sparkles className="h-3 w-3" strokeWidth={2} />
        First submission
      </div>
      <p className="font-serif text-5xl font-medium leading-none tracking-tight text-foreground">
        {band.toFixed(1)}
        <span className="ml-1 text-xl text-foreground/40">/ 9</span>
      </p>
      <p className="mt-3 text-sm text-foreground/60">
        Submit one more to see your trajectory.
      </p>
    </div>
  );
}
