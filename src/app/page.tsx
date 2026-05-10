import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  PenLine,
  MessagesSquare,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Nav } from "@/components/EditorialNav";
import { Footer } from "@/components/EditorialFooter";


/*
  Homepage
  Modern landing page with interactive cards. Six sections:
  hero, trust strip, four-skill cards, how-it-works, CTA, footer.
  Cards lift on hover and reveal a gold accent.
*/


export default function HomePage() {
  return (
    <main className="min-h-screen">

      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">

        {/* Soft sky-blue glow behind the hero, just for atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
        />

        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center lg:px-8 lg:pt-32 lg:pb-24">

          {/* Sky-blue pill badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-[#DCE6F2]/40 px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            Personalized for adult learners
          </div>

          {/* Hero headline */}
          <h1 className="font-serif text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            English, matched to your
            <br />
            <span className="italic text-foreground/90">level and purpose.</span>
          </h1>

          {/* Lede */}
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-[1.65] text-foreground/70">
            Tell us your level and goal, whether for work, travel, university,
            or exam preparation, and we will build the path that fits.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.03] hover:bg-foreground/90"
            >
              Start learning free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-12 items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-7 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/30 hover:bg-foreground/5"
            >
              How it works
            </Link>
          </div>

        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center sm:gap-12">

            <TrustItem
              icon={<Target className="h-5 w-5" strokeWidth={1.5} />}
              label="6 CEFR levels"
              sub="A1 to C2"
            />
            <TrustItem
              icon={<Zap className="h-5 w-5" strokeWidth={1.5} />}
              label="AI graded writing"
              sub="Feedback in seconds"
            />
            <TrustItem
              icon={<MessagesSquare className="h-5 w-5" strokeWidth={1.5} />}
              label="Live teachers"
              sub="3 Zoom sessions"
            />

          </div>
        </div>
      </section>

      {/* FOUR-SKILL CARDS -- the centerpiece */}
      <section className="relative bg-[#DCE6F2]/50 dark:bg-foreground/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">

          <div className="mx-auto max-w-3xl text-center mb-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              The Curriculum
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
              Built around four skills.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-foreground/70">
              Reading, listening, writing, and speaking. Each is a separate
              practice with its own rhythm, treated with equal weight.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <SkillCard
              icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
              title="Reading"
              description="Curated articles matched to your level, with comprehension checks after every passage."
            />
            <SkillCard
              icon={<Headphones className="h-5 w-5" strokeWidth={1.75} />}
              title="Listening"
              description="Natural audio at your pace, with multiple choice and short answer questions."
            />
            <SkillCard
              icon={<PenLine className="h-5 w-5" strokeWidth={1.75} />}
              title="Writing"
              description="Submit prompts and receive AI graded feedback within seconds, scored 0 to 100."
              featured
            />
            <SkillCard
              icon={<MessagesSquare className="h-5 w-5" strokeWidth={1.75} />}
              title="Speaking"
              description="Three one on one Zoom sessions with a real teacher. No artificial substitute."
            />

          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">

          <div className="mx-auto max-w-3xl text-center mb-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              How it works
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
              Three minutes to your first lesson.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
            <Step
              number="01"
              title="Create your account"
              description="A short signup form. Email and password. No credit card."
            />
            <Step
              number="02"
              title="Tell us about you"
              description="Three quick questions: your level, your goal, the skill you want to focus on."
            />
            <Step
              number="03"
              title="Start your first lesson"
              description="We build a personalized path based on your answers and put you straight into it."
            />
          </div>

        </div>
      </section>

      {/* BIG CTA CARD */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1C3F] px-8 py-16 text-center sm:px-16 sm:py-20">

          {/* Gold glow accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-1/2 h-64 w-64 translate-x-1/2 rounded-full bg-[#B8985A] opacity-20 blur-3xl"
          />

          <div className="relative">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Begin
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[#F7F4EE]">
              Begin where you are.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-[#F7F4EE]/70">
              Three minutes of setup. Your first lesson is waiting on the
              other side.
            </p>
            <Link
              href="/register"
              className="group mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-[#B8985A] px-7 text-sm font-medium text-[#0B1C3F] transition-all duration-200 hover:scale-[1.03] hover:bg-[#B8985A]/90"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </div>

        </div>
      </section>

      <Footer />

    </main>
  );
}


/*
  Trust strip item.
  Small icon left, label + sub line right. Used in the row
  beneath the hero.
*/

function TrustItem({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-center sm:text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-[#B8985A] ring-1 ring-foreground/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground/60">{sub}</p>
      </div>
    </div>
  );
}


/*
  Skill card.
  Interactive: hover lifts the card 4px, swaps the border to
  gold, and slides the arrow right. The "featured" prop accents
  the Writing card with a subtle gold-tinted background since
  AI graded writing is the hero feature of the platform.
*/

function SkillCard({
  icon,
  title,
  description,
  featured = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <Link
      href="/about"
      className={[
        "group relative flex flex-col rounded-2xl border bg-background p-6 transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[#B8985A] hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.15)]",
        featured
          ? "border-[#B8985A]/50 ring-1 ring-[#B8985A]/20"
          : "border-foreground/10",
      ].join(" ")}
    >
      {/* Featured ribbon */}
      {featured && (
        <span className="absolute right-4 top-4 rounded-full bg-[#B8985A] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0B1C3F]">
          Featured
        </span>
      )}

      {/* Icon tile */}
      <div
        className={[
          "mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
          featured
            ? "bg-[#B8985A] text-[#0B1C3F]"
            : "bg-[#DCE6F2] text-foreground group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F]",
        ].join(" ")}
      >
        {icon}
      </div>

      <h3 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-[1.6] text-foreground/70">
        {description}
      </p>

      <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground/80">
        Learn more
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
      </div>
    </Link>
  );
}


/*
  Step.
  Numbered "01 / 02 / 03" steps in the how-it-works section.
  Big gold serif numeral, title, prose. Kept clean and quiet,
  the cards above carry the visual weight.
*/

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <div className="font-serif text-5xl font-medium leading-none tracking-tight text-[#B8985A]">
        {number}
      </div>
      <h3 className="mt-5 font-serif text-xl font-medium leading-tight tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[1.65] text-foreground/70">
        {description}
      </p>
    </div>
  );
}
