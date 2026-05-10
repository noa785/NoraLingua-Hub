"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { saveOnboarding } from "@/app/actions/onboarding";
import { CEFR_LEVELS, PURPOSES, SKILLS } from "@/lib/constants";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

import type { CefrLevel, PurposeKey, SkillType } from "@/generated/prisma";

/*
  OnboardingForm: collects three required answers using picker
  tiles. Each tile is a flat sky-blue card; selecting it switches
  the border to gold and adds a gold check badge in the corner.

  Why pickers instead of dropdowns?
    Faster to scan and pick on both desktop and mobile. The user
    sees all options at once with no chevron-then-list extra
    step. Pickers also feel more modern in 2026.

  Why a single sky tint instead of per-option color?
    The palette is small on purpose -- navy, off-white, sky, gold.
    Multi-color picker tiles felt too playful and clashed with the
    editorial aesthetic of the rest of the site. One tint, with
    gold reserved for "selected", reads cleaner and stays on brand.
*/


const SKILL_BLURBS: Record<SkillType, string> = {
  READING: "Articles and passages",
  LISTENING: "Audio and dialogue",
  WRITING: "Prompts graded by AI",
  SPEAKING: "Live one on one sessions",
};


export function OnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      level: undefined,
      purpose: undefined,
      targetSkill: undefined,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedLevel = form.watch("level");
  const selectedPurpose = form.watch("purpose");
  const selectedSkill = form.watch("targetSkill");

  async function onSubmit(values: OnboardingInput): Promise<void> {
    setServerError(null);

    const result = await saveOnboarding(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-10"
      noValidate
    >

      {/* Question 1: level */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Step 1
        </legend>
        <p className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">
          What is your current level?
        </p>
        <div
          role="radiogroup"
          aria-label="Level"
          className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {CEFR_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.key;
            return (
              <PickerTile
                key={level.key}
                isSelected={isSelected}
                disabled={isSubmitting}
                onClick={() => form.setValue("level", level.key as CefrLevel, { shouldValidate: true })}
              >
                <div className="font-serif text-lg font-medium text-foreground">
                  {level.key}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground/80">
                  {level.name}
                </div>
                <div className="mt-1 text-xs leading-snug text-foreground/60">
                  {level.description}
                </div>
              </PickerTile>
            );
          })}
        </div>
        {form.formState.errors.level ? (
          <p className="mt-3 text-sm text-foreground">
            {form.formState.errors.level.message}
          </p>
        ) : null}
      </fieldset>

      {/* Question 2: purpose */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Step 2
        </legend>
        <p className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">
          What is English for, for you?
        </p>
        <div
          role="radiogroup"
          aria-label="Purpose"
          className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {PURPOSES.map((purpose) => {
            const isSelected = selectedPurpose === purpose.key;
            return (
              <PickerTile
                key={purpose.key}
                isSelected={isSelected}
                disabled={isSubmitting}
                onClick={() => form.setValue("purpose", purpose.key as PurposeKey, { shouldValidate: true })}
              >
                <div className="text-base font-medium text-foreground">
                  {purpose.name}
                </div>
                <div className="mt-1 text-xs leading-snug text-foreground/60">
                  {purpose.description}
                </div>
              </PickerTile>
            );
          })}
        </div>
        {form.formState.errors.purpose ? (
          <p className="mt-3 text-sm text-foreground">
            {form.formState.errors.purpose.message}
          </p>
        ) : null}
      </fieldset>

      {/* Question 3: skill */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Step 3
        </legend>
        <p className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">
          Where would you like to start?
        </p>
        <div
          role="radiogroup"
          aria-label="Target skill"
          className="mt-5 grid grid-cols-2 gap-3"
        >
          {SKILLS.map((skill) => {
            const isSelected = selectedSkill === skill.key;
            return (
              <PickerTile
                key={skill.key}
                isSelected={isSelected}
                disabled={isSubmitting}
                onClick={() => form.setValue("targetSkill", skill.key as SkillType, { shouldValidate: true })}
              >
                <div className="text-base font-medium text-foreground">
                  {skill.name}
                </div>
                <div className="mt-1 text-xs leading-snug text-foreground/60">
                  {SKILL_BLURBS[skill.key]}
                </div>
              </PickerTile>
            );
          })}
        </div>
        {form.formState.errors.targetSkill ? (
          <p className="mt-3 text-sm text-foreground">
            {form.formState.errors.targetSkill.message}
          </p>
        ) : null}
      </fieldset>

      {/* Server error */}
      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-foreground/20 bg-[#DCE6F2]/40 px-4 py-3 text-sm text-foreground"
        >
          {serverError}
        </div>
      ) : null}

      {/* Submit */}
      <div className="border-t border-foreground/10 pt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.01] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Setting things up
            </>
          ) : (
            "Start learning"
          )}
        </button>
        <p className="mt-3 text-center text-xs text-foreground/60">
          You can change these answers any time.
        </p>
      </div>

    </form>
  );
}


/*
  PickerTile: one option in a picker grid. Sky-blue background by
  default. Selected state takes a gold border, ring, and a gold
  check badge in the top-right corner.
*/

function PickerTile({
  isSelected,
  disabled,
  onClick,
  children,
}: {
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onClick}
      className={[
        "relative rounded-2xl border p-4 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-8px_rgba(11,28,63,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8985A] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        isSelected
          ? "border-[#B8985A] bg-background ring-2 ring-[#B8985A]/30"
          : "border-foreground/10 bg-[#DCE6F2]/40 hover:border-foreground/20 hover:bg-[#DCE6F2]/60",
      ].join(" ")}
    >
      {children}
      {isSelected ? (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#B8985A] text-[#0B1C3F]"
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
