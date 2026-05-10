import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Award,
  BookOpen,
  Headphones,
  PenLine,
  MessagesSquare,
} from "lucide-react";

import { Nav } from "@/components/EditorialNav";
import { Footer } from "@/components/EditorialFooter";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "How it works",
  description:
    "How NoraLingua Hub teaches English through reading, listening, AI graded writing, and live speaking.",
};


/*
  About page
  Explains the platform's method: how lessons work, how AI grading
  works, how speaking sessions work. Same Linear-style aesthetic
  as the homepage. Five sections.
*/


export default function AboutPage() {
  return (
    <main className="min-h-screen">

      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
        />
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center lg:px-8 lg:pt-32 lg:pb-20">

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-[#DCE6F2]/40 px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            How we teach
          </div>

          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            English is learned by
            <br />
            <span className="italic text-foreground/90">doing the work.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-[1.65] text-foreground/70">
            We do not believe in streaks, badges, or gamified flashcards. We
            believe in real lessons, real writing, real conversations, and
            measurable progress.
          </p>

        </div>
      </section>

      {/* THE METHOD -- 4 PILLARS */}
      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">

          <div className="mx-auto max-w-3xl text-center mb-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              The Method
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
              Four skills. Equal weight.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-foreground/70">
              Most platforms focus on one or two skills. We treat all four as
              equally important practices, each with its own rhythm.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <PillarCard
              icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
              title="Reading, with comprehension checks"
              description="Articles matched to your CEFR level. Every passage ends with multiple choice and short answer questions so we know what you understood."
            />
            <PillarCard
              icon={<Headphones className="h-5 w-5" strokeWidth={1.75} />}
              title="Listening, at your real pace"
              description="Audio from real speakers, not synthetic voices. Accents vary on purpose. Pause, replay, and answer questions to confirm you heard it right."
            />
            <PillarCard
              icon={<PenLine className="h-5 w-5" strokeWidth={1.75} />}
              title="Writing, graded by AI"
              description="Submit a prompt and get a 0 to 100 score plus written feedback within seconds. The grader reads for argument, structure, vocabulary, and grammar."
            />
            <PillarCard
              icon={<MessagesSquare className="h-5 w-5" strokeWidth={1.75} />}
              title="Speaking, with a real teacher"
              description="Three one on one Zoom sessions. No AI substitute. The teacher is the only human in this loop and that is the point."
            />

          </div>
        </div>
      </section>

      {/* AI GRADING DEEP DIVE */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* Left: text */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                AI Graded Writing
              </p>
              <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
                Submit a prompt. Get feedback in seconds.
              </h2>
              <p className="mt-6 text-base leading-[1.65] text-foreground/70">
                Most writing courses give back essays graded a week later. We
                grade in seconds, every time, so you can iterate while the
                lesson is still fresh in your mind. Each submission gets a 0 to
                100 score and a paragraph of substantive feedback.
              </p>

              <ul className="mt-8 space-y-3">
                <BenefitItem text="Scored on argument, structure, vocabulary, and grammar" />
                <BenefitItem text="Written feedback in plain English, no jargon" />
                <BenefitItem text="No daily limits, submit as often as you want" />
                <BenefitItem text="Your past submissions stay in your dashboard" />
              </ul>
            </div>

            {/* Right: visual mock */}
            <div className="relative">
              <div className="rounded-2xl border border-foreground/10 bg-background p-6 shadow-[0_8px_30px_-12px_rgba(11,28,63,0.1)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    Your submission
                  </span>
                  <span className="rounded-full bg-[#B8985A] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0B1C3F]">
                    Graded
                  </span>
                </div>
                <p className="text-sm leading-[1.6] text-foreground/80 italic">
                  &quot;The shift to remote work has fundamentally changed how
                  teams collaborate. While productivity has remained stable for
                  established organisations...&quot;
                </p>
                <div className="mt-6 border-t border-foreground/10 pt-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-5xl font-medium leading-none tracking-tight text-[#B8985A]">
                      87
                    </span>
                    <span className="text-sm text-foreground/60">/ 100</span>
                  </div>
                  <p className="mt-3 text-sm leading-[1.6] text-foreground/70">
                    Strong argument with clear examples. Watch the present
                    perfect tense in the second paragraph. Vocabulary is
                    appropriate for B2.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CEFR + PERSONALIZATION STRIP */}
      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">

          <div className="mx-auto max-w-3xl text-center mb-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Personalization
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
              Lessons matched to you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-foreground/70">
              Tell us your level and your goal. We choose the lessons that
              fit. No two paths are identical.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

            <FactCard
              icon={<Target className="h-5 w-5" strokeWidth={1.75} />}
              big="6"
              label="CEFR levels"
              description="From A1 beginner to C2 mastery. We match every lesson to your current level."
            />
            <FactCard
              icon={<Zap className="h-5 w-5" strokeWidth={1.75} />}
              big="6"
              label="Goals to choose from"
              description="Job, travel, university, IELTS, business, or general everyday English."
            />
            <FactCard
              icon={<Award className="h-5 w-5" strokeWidth={1.75} />}
              big="3"
              label="Live teacher sessions"
              description="One on one Zoom calls included with every account, ready when you want them."
            />

          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1C3F] px-8 py-16 text-center sm:px-16 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 right-1/2 h-64 w-64 translate-x-1/2 rounded-full bg-[#B8985A] opacity-20 blur-3xl"
          />
          <div className="relative">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Ready to start
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[#F7F4EE]">
              Your first lesson is waiting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.65] text-[#F7F4EE]/70">
              Three minutes of setup. Then you start learning.
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


/* PillarCard: white card on sky strip, hover lifts and turns gold. */
function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-foreground/10 bg-background p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#B8985A] hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.15)]">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground transition-colors duration-300 group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F]">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[1.6] text-foreground/70">
        {description}
      </p>
    </div>
  );
}


/* FactCard: a stat in big gold serif numerals, label, description. */
function FactCard({
  icon,
  big,
  label,
  description,
}: {
  icon: React.ReactNode;
  big: string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground">
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-5xl font-medium leading-none tracking-tight text-[#B8985A]">
          {big}
        </span>
        <span className="text-sm font-medium text-foreground/70">{label}</span>
      </div>
      <p className="mt-3 text-sm leading-[1.6] text-foreground/70">
        {description}
      </p>
    </div>
  );
}


/* BenefitItem: a checkmark + text line in the AI grading section. */
function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#B8985A] text-[#0B1C3F]">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      </span>
      <span className="text-sm leading-[1.6] text-foreground/80">{text}</span>
    </li>
  );
}
