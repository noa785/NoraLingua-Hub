import Anthropic from "@anthropic-ai/sdk";

import type { CefrLevel, PurposeKey } from "@/generated/prisma";


/*
  Claude API client for AI-powered writing grading.

  This module is the single integration point for the Anthropic
  API. Centralising it means every grader call shares the same
  client setup, system prompt construction, retry policy, and
  JSON parsing. The system prompt is the most important variable
  in output quality, so keeping it in one file makes tuning safe.

  Per-level grading.
    Each learner declares their CEFR level (A1 to C2) during
    onboarding. The grader uses that level to adjust expectations
    and to set a band ceiling so grading stays honest. An A1
    student writing perfect simple English should score around
    3 to 3.5 (excellent for A1), not band 9, because band 9 is
    reserved for near-native sophistication. Capping the maximum
    reasonable band per declared level prevents inflation and
    keeps the score informative.

    Level-aware grading also affects what the AI critiques.
    For an A1 learner we accept "I go shop yesterday" with a
    note rather than red ink. For a C1 learner the same phrase
    is a serious error. Same student, same writing, but a
    different developmental lens.

  Per-purpose framing.
    Each learner also declared a purpose (Job, IELTS, Travel,
    Business, University, General). The grader weights criteria
    appropriately. An IELTS learner gets strict examiner-style
    feedback on Task Response and Coherence/Cohesion. A Job
    learner gets professional tone and business vocabulary
    weighted more heavily.

  Why ask Claude to return JSON?
    Structured output is parseable in code without regex, and
    the UI needs distinct fields (band scores, per-criterion
    feedback, inline annotations, rewrite). Claude is consistent
    at returning JSON when the system prompt makes the schema
    explicit and the principles say "return ONLY JSON".

  Retry logic.
    Despite our best instructions, Claude occasionally wraps
    JSON in markdown fences or adds a preamble like "Here is
    the result:". The first attempt strips fences and parses;
    if that fails we retry once with a stricter reminder. Two
    attempts in series add 5 to 10 seconds of latency in the
    worst case but turn most "API hiccup" failures into
    successes. After two parse failures we throw a helpful
    error so submitWriting can persist the ungraded submission
    and tell the student to come back.
*/


let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in the environment.");
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}


/* Public types. Kept identical to the original module so callers
   do not need to change their imports or shapes. */

export type RubricMode = "IELTS" | "EMAIL" | "POSTCARD" | "GENERAL";

export type AnnotationType = "grammar" | "vocab" | "content";

export type Annotation = {
  text:    string;
  type:    AnnotationType;
  comment: string;
};

export type CriterionResult = {
  name:       string;
  score:      number;
  feedback:   string;
  evidence?:  string;
};

export type GradeResult = {
  rubricMode:  RubricMode;
  bandOverall: number;
  criteria:    [CriterionResult, CriterionResult, CriterionResult, CriterionResult];
  annotations: Annotation[];
  rewrite: {
    title:       string;
    text:        string;
    explanation: string;
  };
  summary: string;
};


/* Public function. Now accepts userLevel and userPurpose so the
   prompt can adapt expectations and band ceiling to the learner. */

export async function gradeWriting(input: {
  prompt:      string;
  text:        string;
  wordCount:   number;
  rubricMode:  RubricMode;
  userLevel:   CefrLevel | null;
  userPurpose: PurposeKey | null;
}): Promise<GradeResult> {
  const client = getClient();

  /* Default to B1 + General if the user has not yet declared a
     level or purpose. Should not happen in practice because
     onboarding gates the writing flow, but defensive defaults
     make this function safer to call from anywhere. */
  const level   = input.userLevel   ?? "B1";
  const purpose = input.userPurpose ?? "GENERAL";

  const systemPrompt = buildSystemPrompt({
    rubricMode: input.rubricMode,
    level,
    purpose,
  });
  const userMessage  = buildUserMessage(input);

  /* Two-attempt loop. First attempt uses the standard prompt;
     second attempt adds a stricter JSON-only reminder if the
     first response could not be parsed. */
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {

    const finalSystem = attempt === 1
      ? systemPrompt
      : systemPrompt + "\n\nIMPORTANT: Your previous response could not be parsed. Return ONLY the JSON object. No markdown fences. No preamble. No closing remarks. Begin your response with { and end it with }.";

    try {
      const response = await client.messages.create({
        model:      "claude-sonnet-4-5",
        max_tokens: 4000,
        system:     finalSystem,
        messages: [
          { role: "user", content: userMessage },
        ],
      });

      const block = response.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") {
        throw new Error("Claude returned no text content.");
      }

      const cleaned = stripMarkdownFences(block.text);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = parseErr;
        /* If this is the first attempt, fall through and retry.
           If this is the second attempt, the outer throw at the
           bottom of the function will report the failure. */
        continue;
      }

      return validateAndCoerce(parsed, input.rubricMode);

    } catch (err) {
      /* Non-parse errors (network, validation, missing field) on
         attempt 1 also trigger a retry, in case the model
         returned a malformed criteria array or the like. */
      lastError = err;
      continue;
    }
  }

  /* Both attempts failed. Throw with the last error so callers
     can surface it. */
  throw new Error(
    "Claude grading failed after 2 attempts: " +
    (lastError instanceof Error ? lastError.message : String(lastError))
  );
}


/* System prompt construction.

   The prompt is built in layers so each piece is independently
   reasoned about: rubric (which 4 criteria), level (expectations
   + band ceiling), purpose (what to weight extra), and the fixed
   schema/principles section that does not change. */

function buildSystemPrompt(input: {
  rubricMode: RubricMode;
  level:      CefrLevel;
  purpose:    PurposeKey;
}): string {

  const criteriaLabel = criterionLabelsFor(input.rubricMode);
  const levelGuidance = levelGuidanceFor(input.level);
  const purposeFraming = purposeFramingFor(input.purpose);

  return `You are an expert English writing examiner with experience teaching adult learners across CEFR levels A1 to C2.

You will receive a writing prompt and a student's response. Your job is to:
  1. Grade the response using the rubric below.
  2. Return per-criterion feedback.
  3. Mark inline issues in the student's text (annotations).
  4. Produce a model rewrite at Band 9 quality preserving the student's meaning.

LEARNER PROFILE:
  Declared CEFR level: ${input.level}
  Learning purpose:    ${input.purpose}

LEVEL-SPECIFIC GUIDANCE FOR ${input.level}:
${levelGuidance}

PURPOSE-SPECIFIC FRAMING FOR ${input.purpose}:
${purposeFraming}

RUBRIC: ${describeRubric(input.rubricMode)}

The four criteria for this rubric, in order, are:
  1. ${criteriaLabel[0]}
  2. ${criteriaLabel[1]}
  3. ${criteriaLabel[2]}
  4. ${criteriaLabel[3]}

SCORING SCALE:
  All scores are on the IELTS 0 to 9 band scale, half-bands allowed.
  9 is expert / near-native. 6 is competent. 4 is limited.

  CRITICAL band ceiling for this learner: do NOT score above ${bandCeilingFor(input.level)} for the overall band, regardless of how strong the writing looks. A learner who has declared themselves at ${input.level} would not realistically produce work above this ceiling. If their writing genuinely exceeds the ceiling, score them at the ceiling and include in the summary that they appear to be performing above their declared level.

ANNOTATIONS:
  For each notable issue in the student's text, return one entry in the annotations array. The "text" field MUST be an exact verbatim copy of the phrase from the student's response (we use it for string matching to highlight it on the page). Pick contiguous phrases of 1 to 8 words each.
  Three types are allowed:
    - "grammar"  : grammatical errors -- subject-verb, tense, agreement, articles, prepositions, word forms
    - "vocab"    : word choice issues -- wrong word, awkward register, repetition, weak collocation
    - "content"  : content / structure issues -- unclear claim, missing example, irrelevant detail, weak topic sentence
  Aim for 5 to 12 annotations total for typical responses (more for longer texts, fewer for shorter ones). Do NOT annotate the same phrase twice.
  At lower levels (A1, A2) prioritise content and vocab annotations and only flag grammar errors that block meaning.
  At higher levels (B2, C1, C2) be precise about grammar, register, and lexical choice.

OUTPUT FORMAT: You must return ONLY a JSON object matching this exact shape, with no markdown, no preamble, no closing remarks:

{
  "summary": "1 to 2 sentence overall narrative for the top of the result page. Tone should match the learner's level: encouraging at A1/A2, balanced at B1/B2, exacting at C1/C2.",
  "bandOverall": 6.5,
  "criteria": [
    {
      "name": "${criteriaLabel[0]}",
      "score": 6.0,
      "feedback": "2 to 4 sentences with SPECIFIC examples from the student's text. Reference exact phrases or sentences they wrote.",
      "evidence": "optional short direct quote from the student's text, max 15 words"
    },
    { "name": "${criteriaLabel[1]}", "score": 6.5, "feedback": "...", "evidence": "..." },
    { "name": "${criteriaLabel[2]}", "score": 6.0, "feedback": "...", "evidence": "..." },
    { "name": "${criteriaLabel[3]}", "score": 7.0, "feedback": "...", "evidence": "..." }
  ],
  "annotations": [
    { "text": "exact phrase copied verbatim", "type": "grammar", "comment": "Why this is wrong, in one short sentence." },
    { "text": "another phrase", "type": "vocab", "comment": "..." },
    { "text": "another phrase", "type": "content", "comment": "..." }
  ],
  "rewrite": {
    "title": "Band 9 rewrite",
    "text": "Your rewritten version of the student's response, preserving their original ideas and viewpoint but demonstrating Band 9 features: precise vocabulary, varied sentence structures, accurate grammar, sophisticated linking, and clear progression. Same approximate word count as the original. The rewrite always demonstrates Band 9 quality regardless of the student's declared level so the learner has an aspirational target to learn from.",
    "explanation": "1 to 2 sentences explaining the most important things this rewrite did differently."
  }
}

PRINCIPLES:
- Be specific. Generic feedback like "use more variety" is forbidden. Reference the student's actual phrases.
- Be encouraging but honest. Never demoralise. Highlight what worked before what did not.
- Adjust your tone to the learner's level: warmer and simpler at A1/A2, professional at B1/B2, exacting at C1/C2.
- The rewrite must keep the student's content and viewpoint. Do not invent new arguments.
- Round bandOverall to the nearest 0.5.
- Annotation "text" values MUST appear verbatim in the student's response.
- Return ONLY the JSON object. No other text.`;
}


/* Per-level guidance text injected into the system prompt. Each
   block describes what to expect, what to praise, and what to
   critique for a learner at that level. */

function levelGuidanceFor(level: CefrLevel): string {
  switch (level) {
    case "A1":
      return `  Beginner. Expect single sentences and very simple connections. Praise any successful communication of a basic idea. Forgive most grammar errors -- focus only on errors that block meaning. The learner is just starting out; emphasise what they got right and pick at most one or two grammar points to address. Vocabulary should be drawn from everyday topics. Do not expect paragraphs.`;
    case "A2":
      return `  Elementary. Expect short connected sentences. Common tense errors in past or future are acceptable. Praise: simple sequencing words ("first", "then", "after that"), correct present-tense use, recognisable everyday vocabulary. Critique gently: very rough word order, missing articles in obvious places, lack of basic punctuation.`;
    case "B1":
      return `  Intermediate. Expect coherent paragraphs with topic sentences. The learner should handle present and past tenses consistently. Praise: clear topic sentences, basic linking words ("however", "for example", "in addition"), recognisable register. Critique: weak organization, run-on sentences, vocabulary that is too simple for the topic, inconsistent tense use across paragraphs.`;
    case "B2":
      return `  Upper-intermediate. Expect supported arguments with examples. The learner should produce complex sentences with relative clauses and conditionals. Praise: varied sentence structures, accurate use of complex tenses, natural collocations. Critique: register slips (too casual or too formal for the task), repetitive vocabulary, weak transitions between paragraphs, content that does not fully address the prompt.`;
    case "C1":
      return `  Advanced. Expect natural English with some sophistication. The learner should switch register, use idiomatic phrasing, and structure arguments persuasively. Praise: nuance, hedging language, well-judged register choices, sophisticated vocabulary used accurately. Critique: subtle word-choice errors, occasional unnatural collocations, over-reliance on simple sentence patterns, unclear stance.`;
    case "C2":
      return `  Mastery. Treat this learner as near-native. Apply examiner-grade rigor. Praise: precision, sophistication, natural rhythm, control of register. Critique: any departure from native-like phrasing, suboptimal word choice, missed opportunities for elegance or concision. The bar is high.`;
    default:
      return `  Default to B1 expectations. Expect coherent paragraphs and consistent tense use.`;
  }
}


/* Soft band ceilings keep grading honest relative to the learner's
   declared level. A learner who declared A1 will not be scored
   above 3.5 even if their writing looks excellent, because that
   level of writing would mean they self-classified incorrectly --
   the right action is to flag the mismatch in the summary so an
   admin can encourage them to retake onboarding at a higher level. */

function bandCeilingFor(level: CefrLevel): number {
  switch (level) {
    case "A1": return 3.5;
    case "A2": return 4.5;
    case "B1": return 6.0;
    case "B2": return 7.0;
    case "C1": return 8.0;
    case "C2": return 9.0;
    default:   return 6.0;
  }
}


/* Purpose framing tells the AI what to weight extra. Each purpose
   is one short paragraph; we keep it minimal so the level guidance
   above remains the dominant influence on grading. */

function purposeFramingFor(purpose: PurposeKey): string {
  switch (purpose) {
    case "IELTS":
      return `  This learner is preparing for the IELTS exam. Apply official IELTS Academic Writing band descriptors strictly across all four criteria. Be the kind of examiner they would meet on test day: fair but exacting. Reference IELTS-style language in your feedback ("Task Response", "lexical resource", etc).`;
    case "JOB":
      return `  This learner is improving English for workplace use. Weight professional tone, clarity of purpose, and business-appropriate vocabulary more heavily. Slips into casual register or unclear requests are particularly important to flag. Praise effective politeness markers and well-structured asks.`;
    case "BUSINESS":
      return `  This learner is improving English for business contexts (proposals, reports, presentations). Weight formal register, precise terminology, and clear logical structure heavily. Praise clear executive-style summaries; critique vague claims, jargon misuse, or weak transitions.`;
    case "TRAVEL":
      return `  This learner is improving English for travel use. Weight practical communication, clarity in common scenarios (hotels, restaurants, directions, emergencies), and recognisable everyday vocabulary. Less emphasis on formal register; more emphasis on intelligibility and politeness.`;
    case "UNIVERSITY":
      return `  This learner is improving English for academic study. Weight academic register, clear thesis statements, paragraph structure with topic sentences, and accurate use of citation language. Praise clear argumentation; critique informal phrasing, unsupported claims, or missing topic sentences.`;
    case "GENERAL":
    default:
      return `  This learner is improving general English. Balance content, structure, vocabulary, and grammar equally. Reward natural everyday communication and clear self-expression.`;
  }
}


function describeRubric(mode: RubricMode): string {
  switch (mode) {
    case "IELTS":
      return "IELTS Academic Writing rubric. Apply the official band descriptors strictly.";
    case "EMAIL":
      return "Workplace email evaluation. Focus on professional appropriateness, tone, and clarity rather than academic register.";
    case "POSTCARD":
      return "Informal personal correspondence. Reward warmth, voice, and completeness rather than formal complexity.";
    case "GENERAL":
    default:
      return "General English writing evaluation. Balance content, structure, vocabulary, and grammar equally.";
  }
}


function criterionLabelsFor(mode: RubricMode): [string, string, string, string] {
  switch (mode) {
    case "IELTS":
      return ["Task Response", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"];
    case "EMAIL":
      return ["Tone and Register", "Clarity and Purpose", "Vocabulary", "Grammar"];
    case "POSTCARD":
      return ["Voice and Warmth", "Completeness of Content", "Vocabulary", "Grammar"];
    case "GENERAL":
    default:
      return ["Content", "Structure", "Vocabulary", "Grammar"];
  }
}


function buildUserMessage(input: { prompt: string; text: string; wordCount: number }): string {
  return `WRITING PROMPT:
${input.prompt}

STUDENT'S RESPONSE (${input.wordCount} words):
${input.text}

Now grade this response and return the JSON described in your instructions.`;
}


/* Strip optional markdown code fences that Claude sometimes wraps
   around JSON despite instructions. Idempotent. */

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}


/* Validation. Same logic as before -- coerces the parsed object
   into a GradeResult, throwing if any required field is missing. */

function validateAndCoerce(raw: unknown, mode: RubricMode): GradeResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Claude response is not an object.");
  }
  const obj = raw as Record<string, unknown>;

  const summary = typeof obj.summary === "string" ? obj.summary : "";
  const bandOverall = typeof obj.bandOverall === "number" ? obj.bandOverall : 0;

  if (!Array.isArray(obj.criteria) || obj.criteria.length !== 4) {
    throw new Error("Claude response is missing 4 criteria.");
  }

  const criteria = obj.criteria.map((c: unknown, idx: number): CriterionResult => {
    if (!c || typeof c !== "object") {
      throw new Error("Criterion " + (idx + 1) + " is not an object.");
    }
    const co = c as Record<string, unknown>;
    return {
      name:     typeof co.name     === "string" ? co.name     : "Criterion " + (idx + 1),
      score:    typeof co.score    === "number" ? co.score    : 0,
      feedback: typeof co.feedback === "string" ? co.feedback : "",
      evidence: typeof co.evidence === "string" ? co.evidence : undefined,
    };
  }) as [CriterionResult, CriterionResult, CriterionResult, CriterionResult];

  const annotations: Annotation[] = [];
  if (Array.isArray(obj.annotations)) {
    for (const a of obj.annotations) {
      if (!a || typeof a !== "object") continue;
      const ao = a as Record<string, unknown>;
      const text    = typeof ao.text    === "string" ? ao.text    : "";
      const typeRaw = typeof ao.type    === "string" ? ao.type    : "";
      const comment = typeof ao.comment === "string" ? ao.comment : "";
      const type: AnnotationType =
        typeRaw === "grammar" ? "grammar" :
        typeRaw === "vocab"   ? "vocab"   :
        typeRaw === "content" ? "content" : "grammar";
      if (text.length > 0) annotations.push({ text, type, comment });
    }
  }

  if (!obj.rewrite || typeof obj.rewrite !== "object") {
    throw new Error("Claude response is missing rewrite block.");
  }
  const rw = obj.rewrite as Record<string, unknown>;
  const rewrite = {
    title:       typeof rw.title       === "string" ? rw.title       : "Band 9 rewrite",
    text:        typeof rw.text        === "string" ? rw.text        : "",
    explanation: typeof rw.explanation === "string" ? rw.explanation : "",
  };

  return {
    rubricMode: mode,
    bandOverall,
    criteria,
    annotations,
    rewrite,
    summary,
  };
}