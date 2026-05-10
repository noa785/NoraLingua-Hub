/*
  seed-extra.ts

  Purpose: seed the two purpose tracks (UNIVERSITY, GENERAL) for
  level B2 that were not part of the main seed. Adds compact but
  pedagogically real content -- 10 lessons (5 reading + 5
  listening) and 4 writing assignments per track, with three
  multiple-choice comprehension questions per lesson.

  Why a separate file rather than appending to seed.ts:
    The main seed has accumulated TypeScript edge cases that we
    do not want to disturb six days from submission. Keeping
    this in its own runner means a failure here cannot wedge the
    main seed, and we can re-run only this file.

  Idempotency:
    Every write goes through upsert with a stable composite or
    natural key. Re-running this script does not duplicate rows.
    The script is safe to run repeatedly while content is being
    iterated.

  How to run:
    npx tsx prisma/seed-extra.ts

  How to verify:
    1. Open Prisma Studio, look at MaterialSet table -- there
       should be two new rows for B2 + UNIVERSITY and
       B2 + GENERAL.
    2. Or sign in as a B2 student and switch purpose to
       University or General; the path should populate.
*/

/* Load env vars from .env.local before anything else, because tsx
   does not pick them up automatically the way Next.js does. */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

/* Construct the client the same way src/lib/prisma.ts does for the
   Next.js app: through the PrismaPg driver adapter pointed at the
   pooled Supabase connection. Prisma 7 requires this pattern; the
   plain `new PrismaClient()` constructor was removed. */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });


/* ---------- types ---------- */

/* Question shape used by both content blocks. We keep it loose
   on purpose: short answer is supported by the schema but we
   are seeding multiple choice only for v1, matching the rest of
   the seeded content. */
type SeedQuestion = {
  prompt:      string;
  explanation: string;
  options:     Array<{ text: string; isCorrect: boolean }>;
};

type SeedLesson = {
  title:            string;
  skill:            "READING" | "LISTENING";
  content:          string;          // article body or audio transcript
  audioUrl:         string | null;   // null for reading, "tts:en-GB" or "tts:en-US" for listening
  estimatedMinutes: number;
  questions:        SeedQuestion[];
};

type SeedWriting = {
  title:    string;
  prompt:   string;
  minWords: number;
  maxWords: number;
};

type SeedTrack = {
  level:              "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  purpose:            "JOB" | "TRAVEL" | "UNIVERSITY" | "IELTS" | "BUSINESS" | "GENERAL";
  setTitle:           string;
  setDescription:     string;
  lessons:            SeedLesson[];
  writingAssignments: SeedWriting[];
};


/* ---------- main runner ---------- */

async function main() {
  console.log("");
  console.log("seed-extra: starting...");
  console.log("");

  for (const track of TRACKS) {
    await seedTrack(track);
  }

  console.log("");
  console.log("seed-extra: done.");
}


/* Seed one (level, purpose) track. Idempotent: every entity
   is upserted on its natural key, so a re-run produces the same
   final state without duplicates. */
async function seedTrack(track: SeedTrack) {
  /* Resolve level + purpose to their reference rows. These are
     seeded by the main seed.ts and are stable; if either is
     missing we abort early with a helpful message. */
  const levelRow = await prisma.level.findUnique({
    where: { key: track.level },
  });
  if (!levelRow) {
    throw new Error(`Level ${track.level} not found. Run the main seed first.`);
  }

  const purposeRow = await prisma.purpose.findUnique({
    where: { key: track.purpose },
  });
  if (!purposeRow) {
    throw new Error(`Purpose ${track.purpose} not found. Run the main seed first.`);
  }

  /* MaterialSet: unique by (levelId, purposeId). */
  const materialSet = await prisma.materialSet.upsert({
    where: {
      levelId_purposeId: {
        levelId:   levelRow.id,
        purposeId: purposeRow.id,
      },
    },
    create: {
      title:       track.setTitle,
      description: track.setDescription,
      levelId:     levelRow.id,
      purposeId:   purposeRow.id,
      isActive:    true,
    },
    update: {
      title:       track.setTitle,
      description: track.setDescription,
    },
  });
  console.log(`  MaterialSet: ${track.level} + ${track.purpose} (${materialSet.id})`);

  /* Lessons + their questions and answers. We treat the
     combination of (materialSetId, title) as the natural key
     for a lesson. Questions are upserted by (lessonId,
     sortOrder); answers by (questionId, sortOrder). */
  for (let i = 0; i < track.lessons.length; i++) {
    const lessonInput = track.lessons[i];
    const sortOrder = i;

    const lesson = await upsertLessonByTitle(materialSet.id, lessonInput, sortOrder);

    for (let qIdx = 0; qIdx < lessonInput.questions.length; qIdx++) {
      const qInput = lessonInput.questions[qIdx];
      const question = await upsertQuestion(lesson.id, qIdx, qInput);

      for (let aIdx = 0; aIdx < qInput.options.length; aIdx++) {
        const aInput = qInput.options[aIdx];
        await upsertAnswer(question.id, aIdx, aInput.text, aInput.isCorrect);
      }
    }
  }
  console.log(`    Lessons seeded: ${track.lessons.length}`);

  /* Writing assignments. Natural key is (materialSetId, title). */
  for (let i = 0; i < track.writingAssignments.length; i++) {
    const wInput = track.writingAssignments[i];
    await upsertWritingAssignment(materialSet.id, i, wInput);
  }
  console.log(`    Writing assignments seeded: ${track.writingAssignments.length}`);
}


/* ---------- upsert helpers (Prisma 7 has no composite-string
   upsert for non-unique keys, so we do find-then-create-or-update
   manually for the natural keys that are not declared unique) ---------- */

async function upsertLessonByTitle(
  materialSetId: string,
  input:         SeedLesson,
  sortOrder:     number,
) {
  const existing = await prisma.lesson.findFirst({
    where: { materialSetId, title: input.title },
  });

  if (existing) {
    return prisma.lesson.update({
      where: { id: existing.id },
      data: {
        skill:            input.skill,
        content:          input.content,
        audioUrl:         input.audioUrl,
        estimatedMinutes: input.estimatedMinutes,
        sortOrder,
        isActive:         true,
      },
    });
  }
  return prisma.lesson.create({
    data: {
      materialSetId,
      title:            input.title,
      skill:            input.skill,
      content:          input.content,
      audioUrl:         input.audioUrl,
      estimatedMinutes: input.estimatedMinutes,
      sortOrder,
      isActive:         true,
    },
  });
}

async function upsertQuestion(lessonId: string, sortOrder: number, input: SeedQuestion) {
  const existing = await prisma.question.findFirst({
    where: { lessonId, sortOrder },
  });
  if (existing) {
    return prisma.question.update({
      where: { id: existing.id },
      data: {
        prompt:      input.prompt,
        explanation: input.explanation,
        type:        "MULTIPLE_CHOICE",
        sortOrder,
      },
    });
  }
  return prisma.question.create({
    data: {
      lessonId,
      prompt:      input.prompt,
      explanation: input.explanation,
      type:        "MULTIPLE_CHOICE",
      sortOrder,
    },
  });
}

async function upsertAnswer(questionId: string, sortOrder: number, text: string, isCorrect: boolean) {
  const existing = await prisma.answer.findFirst({
    where: { questionId, sortOrder },
  });
  if (existing) {
    return prisma.answer.update({
      where: { id: existing.id },
      data:  { text, isCorrect, sortOrder },
    });
  }
  return prisma.answer.create({
    data: { questionId, text, isCorrect, sortOrder },
  });
}

async function upsertWritingAssignment(materialSetId: string, sortOrder: number, input: SeedWriting) {
  const existing = await prisma.writingAssignment.findFirst({
    where: { materialSetId, title: input.title },
  });
  if (existing) {
    return prisma.writingAssignment.update({
      where: { id: existing.id },
      data: {
        prompt:     input.prompt,
        minWords:   input.minWords,
        maxWords:   input.maxWords,
        sortOrder,
        isActive:   true,
        rubricMode: "IELTS",
      },
    });
  }
  return prisma.writingAssignment.create({
    data: {
      materialSetId,
      title:      input.title,
      prompt:     input.prompt,
      minWords:   input.minWords,
      maxWords:   input.maxWords,
      sortOrder,
      isActive:   true,
      rubricMode: "IELTS",
    },
  });
}


/* ---------- track content (defined in this file but in
   separate constants for readability; populated in Chunks 2
   and 3) ---------- */

const TRACK_B2_UNIVERSITY: SeedTrack = {
  level:              "B2",
  purpose:            "UNIVERSITY",
  setTitle:           "B2 -- University Pathway",
  setDescription:     "Upper-intermediate English for academic readiness: lecture comprehension, source-based writing, seminar discussion, and research vocabulary.",

  /* Reading and listening alternate so a learner moving through
     the path encounters both modalities in roughly equal measure.
     Topics escalate from undergraduate-level study skills to
     research-level argumentation. */
  lessons: [

    {
      title:            "Note-taking in lectures",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Effective note-taking is one of the most underrated academic skills. " +
        "Many first-year students arrive at university believing that the goal of a lecture is to record everything the lecturer says. " +
        "In reality, transcription is a poor substitute for understanding. A useful set of notes is selective, structured, and personal. " +
        "It captures the speaker's main argument, the evidence used to support it, and any moments of disagreement or uncertainty.\n\n" +
        "Researchers in cognitive psychology have shown that students who try to write down every word tend to remember less than those who paraphrase. " +
        "The mental effort required to compress an idea into your own words forces deeper processing, and deeper processing leads to stronger long-term memory. " +
        "Two well-known systems formalise this principle: the Cornell method, which divides each page into a cue column, a notes column, and a summary row; " +
        "and mind-mapping, which captures relationships between ideas spatially rather than linearly.\n\n" +
        "Whichever system a student adopts, three habits tend to separate strong note-takers from weak ones. " +
        "First, they review their notes within twenty-four hours, when the lecture is still fresh. " +
        "Second, they leave wide margins for later annotation. " +
        "Third, they treat their notes as a draft, not a finished product, and revise them as their understanding deepens.",
      questions: [
        {
          prompt:      "According to the passage, what is the main weakness of trying to write down everything a lecturer says?",
          explanation: "The passage explicitly states that transcription leads to less retention than paraphrasing because paraphrasing forces deeper cognitive processing.",
          options: [
            { text: "It does not require enough mental effort to support memory.", isCorrect: true },
            { text: "It is physically too tiring to maintain for an entire lecture.",       isCorrect: false },
            { text: "It misses what the lecturer says when they speak too quickly.",        isCorrect: false },
            { text: "It causes the student to fall behind on classwork.",                   isCorrect: false },
          ],
        },
        {
          prompt:      "Which of the following best describes the Cornell method?",
          explanation: "The Cornell method splits the page into a cue column, a notes column, and a summary row.",
          options: [
            { text: "A page divided into a cue column, a notes column, and a summary row.",  isCorrect: true },
            { text: "A spatial diagram showing how ideas relate to each other.",             isCorrect: false },
            { text: "A method of recording the lecturer and reviewing the audio later.",     isCorrect: false },
            { text: "A bullet-point summary written after the lecture has ended.",           isCorrect: false },
          ],
        },
        {
          prompt:      "Which habit is NOT mentioned as a habit of strong note-takers?",
          explanation: "The passage lists reviewing within 24 hours, leaving wide margins, and treating notes as a draft. Sharing with classmates is not mentioned.",
          options: [
            { text: "Sharing notes with classmates after each lecture.",         isCorrect: true },
            { text: "Reviewing notes within twenty-four hours of the lecture.",  isCorrect: false },
            { text: "Leaving wide margins for later annotation.",                isCorrect: false },
            { text: "Treating notes as a draft and revising them later.",        isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Office hours: a student-tutor exchange",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 10,
      content:
        "TUTOR: Come in, Hala. Have a seat. So you wanted to talk about the upcoming essay?\n\n" +
        "STUDENT: Yes. I have read the prompt several times, but I am still not sure what you want from us. The question is so broad.\n\n" +
        "TUTOR: That is a very common reaction, and honestly it is part of the point. At university level we expect you to narrow the question yourself. The prompt is a starting point, not a finished topic.\n\n" +
        "STUDENT: How narrow should I go? If I write only about one country, will that be too small?\n\n" +
        "TUTOR: Not at all. A single, well-chosen case study is usually stronger than a sweeping global survey. What I want to see is depth: a clear argument, evidence from at least three reliable sources, and an awareness of the counter-argument. If you focus on one country, that is fine, as long as you justify the choice.\n\n" +
        "STUDENT: And the word limit, is it strict?\n\n" +
        "TUTOR: It is. Two thousand words, plus or minus ten percent. I will stop reading at twenty-two hundred. Brevity is a skill in itself.\n\n" +
        "STUDENT: One last thing. Can I cite blog posts?\n\n" +
        "TUTOR: Use them to find ideas, but cite the academic source those ideas come from. Blogs are a starting point for your reading, not the end of it.",
      questions: [
        {
          prompt:      "What does the tutor say about the prompt being broad?",
          explanation: "The tutor says it is intentionally broad and that narrowing the question is part of the student's job.",
          options: [
            { text: "Narrowing the question is part of what the student is expected to do.", isCorrect: true },
            { text: "The prompt was written too quickly and should be ignored.",             isCorrect: false },
            { text: "Students should answer every part of it equally.",                      isCorrect: false },
            { text: "The student should ask for a different prompt.",                        isCorrect: false },
          ],
        },
        {
          prompt:      "What is the tutor's view of focusing on a single country?",
          explanation: "The tutor calls a single, well-chosen case study usually stronger than a global survey, provided the choice is justified.",
          options: [
            { text: "It is acceptable and often stronger, if the choice is justified.", isCorrect: true },
            { text: "It is too narrow and should be avoided.",                          isCorrect: false },
            { text: "It is allowed only if the country is European.",                   isCorrect: false },
            { text: "It is required by the assignment.",                                isCorrect: false },
          ],
        },
        {
          prompt:      "What does the tutor say about citing blog posts?",
          explanation: "The tutor allows blogs as a way to find ideas but expects citation of the underlying academic sources.",
          options: [
            { text: "Use them to find ideas, then cite the academic sources behind them.", isCorrect: true },
            { text: "Cite blogs the same way as journal articles.",                        isCorrect: false },
            { text: "Never read blogs while researching.",                                 isCorrect: false },
            { text: "Cite blogs only if the author is a professor.",                       isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Reading academic abstracts",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "An abstract is the front door of an academic paper. In two hundred to three hundred words, it summarises the question, the method, the main findings, and why those findings matter. " +
        "Skilled researchers read abstracts before they read papers, and they often read dozens of abstracts to find one paper worth reading in full.\n\n" +
        "A useful abstract has four moves. " +
        "First, it situates the work in a broader conversation: what is already known, and what is missing. " +
        "Second, it states the specific question or hypothesis the paper investigates. " +
        "Third, it describes the method in enough detail to judge whether the evidence is strong. " +
        "Fourth, it reports the result and points briefly to its implications.\n\n" +
        "Reading abstracts well is a skill in its own right. Beginners often skim them as if they were marketing copy, looking for an attractive claim. " +
        "Experienced readers approach them more critically. They ask whether the method is suitable for the question, whether the sample is large enough, " +
        "and whether the conclusion is supported by the data described. A surprising amount of academic literacy is simply learning to read abstracts with this kind of care.",
      questions: [
        {
          prompt:      "What does the passage suggest is unusual about the way experienced researchers read?",
          explanation: "The passage says they read many abstracts to find one paper worth reading in full, which contrasts with reading every paper end-to-end.",
          options: [
            { text: "They read many abstracts to filter what is worth reading in full.", isCorrect: true },
            { text: "They read papers from the conclusion backwards.",                   isCorrect: false },
            { text: "They read only papers recommended by their supervisor.",            isCorrect: false },
            { text: "They never read papers from outside their own field.",              isCorrect: false },
          ],
        },
        {
          prompt:      "Which of the following is NOT one of the four moves of a useful abstract?",
          explanation: "The four moves listed are: situating the work, stating the question, describing the method, and reporting the result. Listing the authors' qualifications is not mentioned.",
          options: [
            { text: "Listing the authors' professional qualifications.", isCorrect: true },
            { text: "Stating the question or hypothesis investigated.",  isCorrect: false },
            { text: "Describing the method used.",                       isCorrect: false },
            { text: "Reporting the result and its implications.",        isCorrect: false },
          ],
        },
        {
          prompt:      "How does the passage contrast beginner and experienced readers of abstracts?",
          explanation: "Beginners skim for attractive claims; experienced readers ask critical questions about method, sample, and support for the conclusion.",
          options: [
            { text: "Beginners look for attractive claims; experienced readers question method and evidence.", isCorrect: true },
            { text: "Beginners read abstracts faster than experienced readers do.",                            isCorrect: false },
            { text: "Beginners only read abstracts in their own language.",                                    isCorrect: false },
            { text: "Beginners take notes while experienced readers do not.",                                  isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "A seminar discussion on research ethics",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 10,
      content:
        "MODERATOR: Welcome back. Today we are discussing research ethics, specifically the question of informed consent in online studies. Mariam, you wanted to start.\n\n" +
        "MARIAM: Yes. My concern is that the standard consent form was designed for face-to-face research. When studies move online, participants click a checkbox, and we call it consent. I am not convinced that is meaningful consent.\n\n" +
        "MODERATOR: Could you say more about what would be meaningful?\n\n" +
        "MARIAM: A meaningful consent process means the participant actually understands what the study involves, what risks there are, and how their data will be used. A checkbox at the end of a long block of text rarely achieves any of that.\n\n" +
        "TARIQ: I want to push back gently. The same is arguably true of paper consent forms, which participants also rarely read carefully. The problem is not the medium, it is the design.\n\n" +
        "MARIAM: Fair. But online research scales in a way paper research does not. One badly designed consent flow can affect ten thousand people. So the design problem becomes much more urgent.\n\n" +
        "MODERATOR: That is an important point. Let me bring in Yusuf. You have done online research yourself.\n\n" +
        "YUSUF: I have. And I think the strongest fix is layered consent. Show participants a short summary first, with the most important risks. Let them expand sections if they want detail. And test the form with real users to make sure they actually understand it.",
      questions: [
        {
          prompt:      "What is Mariam's main concern about online consent forms?",
          explanation: "Mariam argues that ticking a checkbox after a long block of text does not constitute meaningful consent because participants do not truly understand what they agree to.",
          options: [
            { text: "Participants do not really understand what they are agreeing to.", isCorrect: true },
            { text: "Online forms are technically harder to design.",                   isCorrect: false },
            { text: "Online research is always less ethical than face-to-face.",        isCorrect: false },
            { text: "Online forms are too long to read on a phone.",                    isCorrect: false },
          ],
        },
        {
          prompt:      "How does Tariq respond to Mariam?",
          explanation: "Tariq pushes back by pointing out that paper consent forms have the same problem, locating the issue in design rather than medium.",
          options: [
            { text: "He says the issue is design, not the medium itself.", isCorrect: true },
            { text: "He fully agrees with everything Mariam says.",        isCorrect: false },
            { text: "He thinks online research should be banned.",         isCorrect: false },
            { text: "He says paper consent is always preferable.",         isCorrect: false },
          ],
        },
        {
          prompt:      "What solution does Yusuf propose?",
          explanation: "Yusuf proposes layered consent: a short summary first, expandable details, and user testing of the form.",
          options: [
            { text: "Layered consent with a short summary, expandable details, and user testing.", isCorrect: true },
            { text: "Banning online research entirely.",                                            isCorrect: false },
            { text: "Requiring all consent to be given by phone call.",                             isCorrect: false },
            { text: "Removing consent forms altogether.",                                           isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Citing sources and avoiding plagiarism",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Plagiarism is one of the few academic offences that can end a degree. " +
        "Yet many cases of plagiarism are not the result of dishonesty. " +
        "They come from confusion about what counts as your own thought and what must be attributed to a source.\n\n" +
        "The simplest rule is also the most useful: if an idea, a phrase, or a piece of data did not exist in your head before you read or heard it, attribute it. " +
        "This includes paraphrased ideas, not only direct quotations. Paraphrasing without citation is sometimes called patchwriting, and most universities treat it as plagiarism.\n\n" +
        "Three habits prevent most accidental plagiarism. " +
        "First, take notes that always include the source, even if it feels excessive. A note without a source becomes useless three weeks later. " +
        "Second, distinguish in your notes between direct quotation, paraphrase, and your own commentary. Use different colours or symbols if it helps. " +
        "Third, when you draft, write the citation first and the sentence afterwards. Reversing the usual order trains the habit of attributing thoroughly.\n\n" +
        "Common knowledge, of course, does not need a citation. The fact that the Earth orbits the Sun is common knowledge in any field. " +
        "But what counts as common knowledge varies between disciplines, and when in doubt, cite. An over-cited essay is awkward; an under-cited essay can fail.",
      questions: [
        {
          prompt:      "What does the passage call paraphrasing without citation?",
          explanation: "It introduces the term patchwriting and notes that universities typically treat it as plagiarism.",
          options: [
            { text: "Patchwriting.",      isCorrect: true },
            { text: "Synthesis.",         isCorrect: false },
            { text: "Common knowledge.",  isCorrect: false },
            { text: "Cross-referencing.", isCorrect: false },
          ],
        },
        {
          prompt:      "Which habit is recommended to prevent accidental plagiarism?",
          explanation: "Among other things, the passage advises always including the source in notes, even when it feels excessive.",
          options: [
            { text: "Always include the source in your notes, even when it feels excessive.", isCorrect: true },
            { text: "Avoid quoting any sources directly.",                                    isCorrect: false },
            { text: "Cite only sources that disagree with your argument.",                    isCorrect: false },
            { text: "Memorise the source and quote it later.",                                isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about common knowledge?",
          explanation: "What counts as common knowledge varies between disciplines, and the passage advises citing when in doubt.",
          options: [
            { text: "It varies by discipline; cite when uncertain.", isCorrect: true },
            { text: "It is the same in every field.",                isCorrect: false },
            { text: "It must always be cited regardless.",           isCorrect: false },
            { text: "It refers only to historical dates.",           isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Lecture excerpt: introduction to research methods",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 10,
      content:
        "Good morning. Today I want to introduce the distinction between qualitative and quantitative research, because most of you will encounter both before you graduate.\n\n" +
        "Quantitative research is concerned with measurement. The researcher reduces the world to variables that can be counted, compared, or correlated. " +
        "If we want to know whether a new teaching method improves test scores, the question lends itself naturally to numbers. We collect scores from many students, compare conditions, and use statistics to estimate how confident we should be in our result.\n\n" +
        "Qualitative research, by contrast, is concerned with meaning. Instead of asking how much, the researcher asks how, and why, and what does this experience feel like to the people having it. " +
        "Methods include interviews, ethnographic observation, and close textual analysis. The output is rarely a number; more often it is a careful description, a typology, or a theory grounded in the data.\n\n" +
        "A common misunderstanding among first-year students is that qualitative work is somehow easier or less rigorous because it does not produce statistics. " +
        "The opposite is closer to the truth. Qualitative research demands long fieldwork, careful coding of transcripts, and constant reflection on the researcher's own influence on what is observed. " +
        "Both traditions are demanding. Both are necessary. Which one to use depends entirely on the question you are asking.",
      questions: [
        {
          prompt:      "How does the speaker characterise quantitative research?",
          explanation: "The speaker says it is concerned with measurement and reduces the world to variables that can be counted, compared, or correlated.",
          options: [
            { text: "It is concerned with measurement of variables.", isCorrect: true },
            { text: "It is concerned with the meaning of experience.", isCorrect: false },
            { text: "It is always more reliable than qualitative research.", isCorrect: false },
            { text: "It avoids statistics entirely.", isCorrect: false },
          ],
        },
        {
          prompt:      "What does the speaker say about qualitative research?",
          explanation: "The speaker describes it as asking how, why, and what experiences feel like, using interviews, observation, and textual analysis.",
          options: [
            { text: "It asks questions about meaning, using methods like interviews and observation.", isCorrect: true },
            { text: "It is mostly used in physics and chemistry.",                                     isCorrect: false },
            { text: "It only uses surveys with closed questions.",                                     isCorrect: false },
            { text: "It is always shorter and quicker than quantitative research.",                    isCorrect: false },
          ],
        },
        {
          prompt:      "What misconception about qualitative research does the speaker push back on?",
          explanation: "The speaker pushes back on the idea that qualitative work is easier or less rigorous than quantitative work.",
          options: [
            { text: "That it is easier or less rigorous than quantitative research.", isCorrect: true },
            { text: "That it is impossible to teach to undergraduates.",              isCorrect: false },
            { text: "That it is the only kind of research that matters.",             isCorrect: false },
            { text: "That it produces statistics that cannot be trusted.",            isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Building an argument in academic writing",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Many first-year essays sound thoughtful but have no argument. They survey what others have said, organise it neatly, and stop. " +
        "An argument, by contrast, takes a position. It claims something specific about the topic and uses evidence to defend that claim against alternatives.\n\n" +
        "A defensible argument has three components. " +
        "First, the claim itself must be debatable. The statement that climate change is real is a fact, not an argument. The statement that climate change demands a particular policy response is a claim someone could reasonably disagree with, and is therefore arguable. " +
        "Second, the argument must rest on evidence the reader can check. Cited statistics, named studies, and primary sources are evidence; vague references to what people generally believe are not. " +
        "Third, a strong argument anticipates the strongest counter-argument and responds to it. Ignoring the counter-argument suggests the writer either has not read widely enough or has chosen to write only for readers who already agree.\n\n" +
        "Building this kind of argument takes practice. Writers often complete their first draft only to discover that they have summarised, not argued. The remedy is to look at every paragraph and ask what claim it makes and what evidence it offers. Paragraphs that do neither are usually candidates for deletion.",
      questions: [
        {
          prompt:      "What does the passage say is the difference between a survey and an argument?",
          explanation: "A survey organises what others have said; an argument takes a position and defends it with evidence.",
          options: [
            { text: "A survey organises others' views; an argument defends a position with evidence.", isCorrect: true },
            { text: "A survey is shorter than an argument.",                                            isCorrect: false },
            { text: "A survey uses citations and an argument does not.",                                isCorrect: false },
            { text: "A survey is for undergraduates and an argument is for graduates.",                 isCorrect: false },
          ],
        },
        {
          prompt:      "Which of these is given as an example of a debatable claim?",
          explanation: "The passage contrasts the fact that climate change is real with the debatable claim that climate change demands a particular policy response.",
          options: [
            { text: "Climate change demands a particular policy response.", isCorrect: true },
            { text: "Climate change is real.",                              isCorrect: false },
            { text: "The Earth orbits the Sun.",                            isCorrect: false },
            { text: "Statistics can be misleading.",                        isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage recommend doing with paragraphs that neither make a claim nor offer evidence?",
          explanation: "It says they are usually candidates for deletion.",
          options: [
            { text: "Consider deleting them.",                       isCorrect: true },
            { text: "Move them to the conclusion.",                  isCorrect: false },
            { text: "Mark them with a footnote for the reader.",     isCorrect: false },
            { text: "Expand them with more general background.",     isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Conference talk: a study on student wellbeing",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 10,
      content:
        "Thank you for the introduction. I will spend the next ten minutes summarising findings from our two-year study on undergraduate wellbeing.\n\n" +
        "We followed a cohort of eight hundred students from enrolment through the end of their second year. " +
        "Three measures were collected each semester: a standardised wellbeing index, sleep duration, and academic engagement.\n\n" +
        "The headline finding will not surprise anyone in this room. Wellbeing dropped sharply in the first eight weeks of the first year, recovered partially over the winter break, then stabilised. " +
        "What did surprise us was the size of the second-year drop. Many universities focus their support efforts on first-year students, but our data suggest the second year is when isolation becomes most acute, especially for international students.\n\n" +
        "We also found that sleep duration was the single strongest predictor of next-semester wellbeing, more so than grades or financial status. Students who slept less than six hours a night reported wellbeing scores roughly fifteen percent below the cohort average.\n\n" +
        "We are presenting two recommendations to the university. First, redirect a portion of first-year support funding to the second year. Second, fund a campus-wide sleep literacy programme. The full paper will be available on our project website next month.",
      questions: [
        {
          prompt:      "What was unexpected about the second-year findings?",
          explanation: "The speaker says the size of the second-year wellbeing drop surprised the researchers, especially among international students.",
          options: [
            { text: "Wellbeing dropped sharply again in the second year.", isCorrect: true },
            { text: "Wellbeing improved sharply in the second year.",     isCorrect: false },
            { text: "Second-year students slept more than first-year students.", isCorrect: false },
            { text: "Second-year grades dropped sharply.",                isCorrect: false },
          ],
        },
        {
          prompt:      "Which factor was the strongest predictor of next-semester wellbeing?",
          explanation: "The speaker says sleep duration predicted next-semester wellbeing more strongly than grades or financial status.",
          options: [
            { text: "Sleep duration.",     isCorrect: true },
            { text: "Final examination grades.", isCorrect: false },
            { text: "Financial status.",   isCorrect: false },
            { text: "Number of friends on campus.", isCorrect: false },
          ],
        },
        {
          prompt:      "Which of the following is one of the speaker's recommendations?",
          explanation: "The speaker recommends redirecting some first-year support funding to the second year.",
          options: [
            { text: "Redirect part of first-year support funding to the second year.", isCorrect: true },
            { text: "Reduce the academic workload of all undergraduates.",             isCorrect: false },
            { text: "Recruit more first-year students each year.",                     isCorrect: false },
            { text: "Move all classes online to give students more sleep.",            isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Reading critically: spotting weak claims",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Critical reading is not the same as cynical reading. A cynical reader rejects claims by reflex; a critical reader weighs them. " +
        "The goal is not to dismiss the writer, but to test whether the writer has earned the reader's agreement.\n\n" +
        "There are three patterns that often signal a weak claim. " +
        "First, generalisation from a single case. The fact that one famous CEO did not finish university tells us almost nothing about whether university is worth attending. " +
        "Second, appeal to popularity. The phrase \"most experts agree\" is reassuring but useless without evidence that the experts cited are real and that they actually agree. " +
        "Third, conflation of correlation and causation. If two phenomena rise together, that does not mean one caused the other. They may both be caused by a third factor not mentioned in the article.\n\n" +
        "A useful drill is to read a popular news article on a research topic and underline every claim. Beside each underlined sentence, write what kind of evidence would be needed to verify it. " +
        "Most articles have at least one claim that turns out to be unverifiable, which is itself instructive.",
      questions: [
        {
          prompt:      "How does the passage distinguish critical from cynical reading?",
          explanation: "Cynical readers reject claims by reflex; critical readers weigh them and test whether the writer has earned their agreement.",
          options: [
            { text: "Critical readers weigh claims; cynical readers reject them by reflex.", isCorrect: true },
            { text: "Critical readers always trust the author.",                              isCorrect: false },
            { text: "Cynical readers ask better questions.",                                  isCorrect: false },
            { text: "Critical reading takes longer than cynical reading.",                    isCorrect: false },
          ],
        },
        {
          prompt:      "Which of the following is given as a sign of a weak claim?",
          explanation: "The passage lists generalisation from a single case as one of three patterns.",
          options: [
            { text: "Generalising from one famous example.",        isCorrect: true },
            { text: "Citing peer-reviewed studies in detail.",      isCorrect: false },
            { text: "Acknowledging the counter-argument fairly.",   isCorrect: false },
            { text: "Distinguishing correlation from causation.",   isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage suggest about correlation?",
          explanation: "The passage warns that two things rising together may both be caused by a third factor, so correlation does not imply causation.",
          options: [
            { text: "It does not establish that one thing caused the other.", isCorrect: true },
            { text: "It always proves causation.",                            isCorrect: false },
            { text: "It is irrelevant to academic argument.",                 isCorrect: false },
            { text: "It is more reliable than direct evidence.",              isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Group project meeting",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 10,
      content:
        "AYESHA: Right, we have forty minutes before I have to leave for my next class, so let's keep this focused. Where are we on the project?\n\n" +
        "OMAR: I have done the literature review, but only half of it has been written up. The rest is in notes.\n\n" +
        "AYESHA: That is fine. Can you finish the write-up by Thursday?\n\n" +
        "OMAR: I think so. The harder problem is that I am not sure two of the sources I have used are strong enough. They are technical reports rather than peer-reviewed papers.\n\n" +
        "AYESHA: That is worth checking. We could ask the tutor in tomorrow's drop-in. Lin, where are you with the data?\n\n" +
        "LIN: The dataset arrived three days late, but I have it now. The cleaning is done. Initial analysis is showing the pattern we expected, but with one anomaly that I want to discuss before we draw conclusions.\n\n" +
        "AYESHA: Good. Send me the anomaly tonight and I will have a look. Hassan, the introduction?\n\n" +
        "HASSAN: First draft is done. I am not happy with the framing yet but I would like feedback before I rewrite.\n\n" +
        "AYESHA: Send it round. Three rules though. We give feedback on the argument first, the wording second, and we commit to one round of revision rather than five. Agreed?\n\n" +
        "OMAR, LIN, HASSAN: Agreed.",
      questions: [
        {
          prompt:      "What concern does Omar raise about the literature review?",
          explanation: "Omar says two of his sources are technical reports rather than peer-reviewed papers and is unsure they are strong enough.",
          options: [
            { text: "Two of his sources may not be strong enough.",   isCorrect: true },
            { text: "He cannot find any sources at all.",             isCorrect: false },
            { text: "The sources are in the wrong language.",         isCorrect: false },
            { text: "The sources contradict each other.",             isCorrect: false },
          ],
        },
        {
          prompt:      "What does Lin want to discuss before drawing conclusions?",
          explanation: "Lin wants to discuss an anomaly that appeared in the initial analysis before the team draws conclusions from the data.",
          options: [
            { text: "An anomaly in the initial analysis.", isCorrect: true },
            { text: "The fact that the dataset arrived late.", isCorrect: false },
            { text: "How to write up the methodology.",    isCorrect: false },
            { text: "Whether to scrap the project entirely.", isCorrect: false },
          ],
        },
        {
          prompt:      "What rule does Ayesha set for feedback on Hassan's draft?",
          explanation: "She insists on one round of revision rather than five, and on giving feedback on argument before wording.",
          options: [
            { text: "One round of revision; argument first, wording second.", isCorrect: true },
            { text: "Five rounds of revision until everyone agrees.",         isCorrect: false },
            { text: "Feedback on wording only, not on argument.",             isCorrect: false },
            { text: "Hassan must rewrite without seeing any feedback.",       isCorrect: false },
          ],
        },
      ],
    },

  ],

  /* Four IELTS-style writing prompts. We default rubricMode to
     IELTS for every assignment in the seed-extra runner, but the
     phrasing of these prompts deliberately varies between
     argument essays and discursive essays so the AI grader sees
     the full range it must handle. */
  writingAssignments: [

    {
      title:    "Universities and employment",
      prompt:
        "Some people argue that universities should focus mainly on preparing students for employment. " +
        "Others argue that the purpose of a university is broader, including developing independent thought and citizenship. " +
        "Discuss both views and give your own opinion. Support your argument with reasons and relevant examples.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Online learning at university",
      prompt:
        "Since the pandemic, many universities have continued to offer some courses online. " +
        "Some say this widens access; others say it weakens the quality of education. " +
        "To what extent do you agree or disagree? Justify your position with specific reasons and examples.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Funding scientific research",
      prompt:
        "Governments must decide how to allocate limited public funds for scientific research. " +
        "Some believe research should be directed mainly at solving urgent practical problems, " +
        "while others believe basic research, with no immediate application, deserves equal support. " +
        "Discuss both views and state your own position.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "International students and academic culture",
      prompt:
        "Universities now host increasingly diverse international student populations. " +
        "What are the main benefits of this diversity, and what are the main challenges it creates for both institutions and students? " +
        "In your response, propose two practical measures that universities could take to address one of the challenges you identify.",
      minWords: 250,
      maxWords: 320,
    },

  ],
};

const TRACK_B2_GENERAL: SeedTrack = {
  level:              "B2",
  purpose:            "GENERAL",
  setTitle:           "B2 -- General English",
  setDescription:     "Upper-intermediate English for everyday confidence: news, podcasts, opinion, and natural conversation.",

  /* Reading and listening alternate. Topics drift away from
     academic life: news literacy, podcasts, social media,
     opinion writing, daily conversation. The aim is range, not
     a single thematic thread, because the GENERAL purpose is
     by design the broadest. */
  lessons: [

    {
      title:            "Reading the news critically",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "We read more news than any generation in history, but reading more does not always mean understanding more. " +
        "A useful first habit is to separate the headline from the story underneath. Headlines are written to attract attention; the body of the article is where the actual information lives. " +
        "If you only ever read the headline, you will be poorly informed even if you scroll for hours.\n\n" +
        "A second habit is to look for who is being quoted. A story about a new medication that quotes only the company that makes the medication is a press release, not journalism. " +
        "A story that quotes independent researchers, regulators, and patients is doing more of the work the reader needs.\n\n" +
        "A third habit, less obvious but more powerful, is to notice what is missing. " +
        "Many news stories present a debate as if it had only two sides. Reality is usually more crowded. " +
        "When you find yourself thinking that an issue is straightforward, ask whether the article has actually represented the full range of views, or only the two that produce the most dramatic argument.\n\n" +
        "Critical reading does not require cynicism. It does not require treating every journalist as a liar. It only requires the reader to do part of the work, and to remember that the article is one account of events, not the events themselves.",
      questions: [
        {
          prompt:      "What does the passage say about headlines?",
          explanation: "Headlines are written to attract attention; the actual information is in the body of the article.",
          options: [
            { text: "They are written to attract attention, not to inform fully.", isCorrect: true },
            { text: "They are usually written by a different journalist.",         isCorrect: false },
            { text: "They are the most reliable part of any article.",             isCorrect: false },
            { text: "They are only added in print versions of newspapers.",        isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about a story quoting only one source?",
          explanation: "If a story about a new medication quotes only the company that makes it, the article is closer to a press release than to journalism.",
          options: [
            { text: "It is closer to a press release than to journalism.", isCorrect: true },
            { text: "It is acceptable as long as the company is honest.",  isCorrect: false },
            { text: "It is the most efficient form of news.",              isCorrect: false },
            { text: "It is required by professional ethics.",              isCorrect: false },
          ],
        },
        {
          prompt:      "What attitude does the passage recommend?",
          explanation: "Critical reading does not require cynicism, but the reader should do part of the work and remember the article is one account of events.",
          options: [
            { text: "Critical engagement, but not cynicism toward journalists.", isCorrect: true },
            { text: "Trust in every quoted expert without exception.",           isCorrect: false },
            { text: "Refusal to read news at all.",                              isCorrect: false },
            { text: "Reliance on only one trusted news source.",                 isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Catching up: a phone call between friends",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 9,
      content:
        "JESS: Hey, finally. I have been trying to get hold of you all week.\n\n" +
        "SAM: I know, sorry. Work has been wild and my phone has been on do-not-disturb most of the time. How are you?\n\n" +
        "JESS: I am good, actually. Tired, but good. The new flat is mostly unpacked. I still have one box of books that I have not been brave enough to open.\n\n" +
        "SAM: That is an ominous sentence. What is in the box?\n\n" +
        "JESS: Probably my old course notes. I keep telling myself I might need them.\n\n" +
        "SAM: Be honest, when did you last open them?\n\n" +
        "JESS: Two thousand and eighteen. Before you ask, no, I am not throwing them out yet.\n\n" +
        "SAM: Fair enough. Listen, the reason I have been chasing you. We are putting together a small thing for Mariam's birthday. Saturday, at hers. Nothing fancy. Are you in?\n\n" +
        "JESS: Saturday is good. Do you want me to bring something?\n\n" +
        "SAM: A salad would save the day. None of us volunteered for vegetables and now we have a problem.\n\n" +
        "JESS: Done. What time?\n\n" +
        "SAM: Seven. And do not turn up at seven on the dot, or you will be the only person there.\n\n" +
        "JESS: I learned that lesson a long time ago.",
      questions: [
        {
          prompt:      "Why does Jess say she has not opened the box of books?",
          explanation: "She has not been brave enough to open it, because it probably contains old course notes.",
          options: [
            { text: "She has not been brave enough to open it.", isCorrect: true },
            { text: "She does not own the right tools to open it.", isCorrect: false },
            { text: "She is waiting for Sam to help her open it.",  isCorrect: false },
            { text: "She has lost the box during the move.",        isCorrect: false },
          ],
        },
        {
          prompt:      "Why is Sam calling?",
          explanation: "Sam is organising something for Mariam's birthday on Saturday and wants Jess to come.",
          options: [
            { text: "To invite Jess to a small gathering for Mariam's birthday.", isCorrect: true },
            { text: "To ask Jess for help moving flat.",                          isCorrect: false },
            { text: "To complain about work.",                                    isCorrect: false },
            { text: "To borrow Jess's old course notes.",                         isCorrect: false },
          ],
        },
        {
          prompt:      "What does Sam ask Jess to bring?",
          explanation: "Sam jokes that nobody volunteered for vegetables and asks Jess to bring a salad.",
          options: [
            { text: "A salad.",          isCorrect: true },
            { text: "A birthday cake.",  isCorrect: false },
            { text: "A bottle of wine.", isCorrect: false },
            { text: "Nothing at all.",   isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Streaming and the changing shape of television",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Twenty years ago, television was something you watched at the time the broadcaster decided. " +
        "If you missed an episode, your only option was to wait for the rerun, or borrow a friend's video tape. " +
        "Streaming services have removed that constraint, and in doing so they have changed what it feels like to watch a show.\n\n" +
        "One change is binge-watching. When every episode is available immediately, the audience often consumes a whole season in a weekend. " +
        "Writers have started to design seasons accordingly. Episodes increasingly end on smaller cliffhangers, because the next episode is one click away rather than seven days away. " +
        "Some critics argue this has made television more novelistic. Others argue it has eroded the patience required to enjoy a slow story.\n\n" +
        "A second change is fragmentation. In the broadcast era, a popular show could be watched by tens of millions of people on the same evening, and would dominate conversation the following day. " +
        "Today, with hundreds of streaming services and dozens of new releases each week, two friends are increasingly likely to have completely different watch lists. " +
        "Shared cultural moments still exist, but they are rarer and they spread differently, often through social media clips rather than first-time viewings.",
      questions: [
        {
          prompt:      "What does the passage say about how writers respond to binge-watching?",
          explanation: "Episodes increasingly end on smaller cliffhangers because the next episode is immediately available.",
          options: [
            { text: "Episodes use smaller cliffhangers because the next one is immediately available.", isCorrect: true },
            { text: "Writers have stopped using cliffhangers altogether.",                              isCorrect: false },
            { text: "Episodes are written to be watched out of order.",                                 isCorrect: false },
            { text: "Writers focus only on the season finale.",                                         isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage call \"fragmentation\"?",
          explanation: "It refers to audiences spreading across many services and shows, so two viewers are likely to be watching completely different things.",
          options: [
            { text: "Audiences spreading across many services and shows.", isCorrect: true },
            { text: "Episodes broken into shorter clips for social media.", isCorrect: false },
            { text: "TV shows splitting into two channels per episode.",   isCorrect: false },
            { text: "Streaming services merging into one platform.",       isCorrect: false },
          ],
        },
        {
          prompt:      "What is one effect of fragmentation, according to the passage?",
          explanation: "Shared cultural moments still happen but are rarer, and they spread differently, often through social media clips.",
          options: [
            { text: "Shared cultural moments are rarer and spread differently.", isCorrect: true },
            { text: "All shows now reach the same audience size.",               isCorrect: false },
            { text: "Television advertising has become more profitable.",        isCorrect: false },
            { text: "Streaming services have merged.",                           isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Podcast clip: small habits, big results",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 10,
      content:
        "HOST: Welcome back to Better Tuesdays. My guest today is a behavioural scientist who has spent fifteen years studying habit formation. Thanks for joining us.\n\n" +
        "GUEST: Happy to be here.\n\n" +
        "HOST: I want to start with the question everyone wants the answer to. How long does it actually take to form a habit?\n\n" +
        "GUEST: The honest answer is, it depends. The famous twenty-one days figure comes from a self-help book, not from research. The best evidence we have suggests anywhere from two to eight months, depending on the behaviour and the person.\n\n" +
        "HOST: That is much longer than people expect.\n\n" +
        "GUEST: It is, and I think the disappointment when habits do not stick at three weeks is one reason people give up. If you start something and expect to feel automatic at three weeks, you will think you have failed when you simply have not finished the process.\n\n" +
        "HOST: What helps?\n\n" +
        "GUEST: Three things. First, attach the new habit to something you already do reliably. If you always drink coffee at eight in the morning, doing five minutes of stretching while the kettle boils is far more likely to stick than scheduling a separate stretching session.\n\n" +
        "HOST: That makes sense. What is the second?\n\n" +
        "GUEST: Make it small. Embarrassingly small. The version of you who is tired or busy needs to be able to do the habit without effort. \"Read for an hour\" fails on a tired evening. \"Read one page\" almost never fails.\n\n" +
        "HOST: And the third?\n\n" +
        "GUEST: Track honestly. A simple chart, marked or unmarked. Not because the chart itself is magical, but because honest tracking tells you whether your idea of yourself matches what you actually do.",
      questions: [
        {
          prompt:      "What does the guest say about the twenty-one days figure?",
          explanation: "The guest says that figure comes from a self-help book, not from research, and the actual range is two to eight months.",
          options: [
            { text: "It comes from a self-help book, not from research.",     isCorrect: true },
            { text: "It is well supported by recent studies.",                isCorrect: false },
            { text: "It applies only to physical exercise.",                  isCorrect: false },
            { text: "It is the maximum time any habit can take to form.",     isCorrect: false },
          ],
        },
        {
          prompt:      "What is the guest's first piece of advice?",
          explanation: "Attach the new habit to something you already do reliably, like stretching while the kettle boils.",
          options: [
            { text: "Attach the new habit to an existing reliable routine.", isCorrect: true },
            { text: "Schedule the habit at a fixed time each day.",          isCorrect: false },
            { text: "Tell five friends about your goal.",                    isCorrect: false },
            { text: "Reward yourself with food after each attempt.",         isCorrect: false },
          ],
        },
        {
          prompt:      "Why does the guest recommend honest tracking?",
          explanation: "Honest tracking shows whether your idea of yourself matches what you actually do.",
          options: [
            { text: "It shows whether your self-image matches your behaviour.", isCorrect: true },
            { text: "It is required by all habit-tracking apps.",               isCorrect: false },
            { text: "It is more effective than the habit itself.",              isCorrect: false },
            { text: "It works only when shared on social media.",               isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Why we still write letters",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "Email is faster, cheaper, and easier to send. Yet handwritten letters refuse to disappear. " +
        "People still send them on birthdays, after funerals, and at moments when something needs to be said carefully. " +
        "Why does the slower medium survive?\n\n" +
        "Part of the answer is effort. A handwritten letter takes time, and the recipient knows it. " +
        "If a friend has spent twenty minutes writing to you, the act of writing already says something the words alone could not. " +
        "An email of identical length carries no equivalent signal, because the cost of producing it is so low.\n\n" +
        "A second reason is permanence. Emails are searchable but rarely re-read. Letters are kept in drawers, sometimes for decades, and re-read in moments of difficulty. " +
        "What is preserved this way is not just the words. The handwriting becomes part of the message: the slight tremble at the end of a long sentence, the deliberate care of a signature.\n\n" +
        "There are practical reasons letters are sent less often than they were. Postal services are slower and more expensive than they used to be in many countries. " +
        "But the survival of the form, even at small volume, suggests that some things resist optimisation. A letter is not just slow email. It is a different kind of object, doing a different kind of work.",
      questions: [
        {
          prompt:      "What does the passage suggest the effort of a handwritten letter communicates?",
          explanation: "If a friend has spent twenty minutes writing, the act of writing itself says something the words alone could not.",
          options: [
            { text: "That the writer has invested time, and that this itself is meaningful.", isCorrect: true },
            { text: "That the writer is trying to be old-fashioned.",                          isCorrect: false },
            { text: "That the writer cannot use a computer.",                                  isCorrect: false },
            { text: "That the writer is too busy for a phone call.",                           isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about emails compared with letters?",
          explanation: "Emails are searchable but rarely re-read; letters are kept and re-read for years.",
          options: [
            { text: "Emails are searchable but rarely re-read.", isCorrect: true },
            { text: "Emails are easier to keep for decades.",    isCorrect: false },
            { text: "Emails are always more carefully worded.",  isCorrect: false },
            { text: "Emails carry handwriting information.",     isCorrect: false },
          ],
        },
        {
          prompt:      "What is the passage's overall claim about letters?",
          explanation: "The passage argues a letter is not just slow email; it is a different kind of object doing different work.",
          options: [
            { text: "A letter is a different kind of object, not just a slower email.", isCorrect: true },
            { text: "Letters are objectively superior to all digital communication.",   isCorrect: false },
            { text: "Letters are no longer used by anyone under thirty.",               isCorrect: false },
            { text: "Letters and emails have become functionally identical.",           isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Travel plans: a conversation at the airport",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 9,
      content:
        "PRIYA: Excuse me, is this seat free?\n\n" +
        "DANIEL: It is, please.\n\n" +
        "PRIYA: Thank you. Crowded today.\n\n" +
        "DANIEL: Always like this on Sundays. Where are you flying to?\n\n" +
        "PRIYA: Lisbon. Long weekend with my sister. She has been living there for two years and I have never visited.\n\n" +
        "DANIEL: You will love it. The food alone is worth the trip.\n\n" +
        "PRIYA: That is what she keeps telling me. Have you been?\n\n" +
        "DANIEL: A few times. I work in tourism, so I move around a lot. Today I am heading the other way, to Athens. Conference.\n\n" +
        "PRIYA: Sounds tiring.\n\n" +
        "DANIEL: Honestly, the travel was exciting for the first two years. Now it is a job. I miss home a lot more than I expected to.\n\n" +
        "PRIYA: I imagine you eat very well, though.\n\n" +
        "DANIEL: That part is true. And I have built a strange list of restaurants I cannot wait to return to. There is a tiny place in Lisbon, near the river, that does fish so well I almost did not want to come home.\n\n" +
        "PRIYA: You have to give me the name.\n\n" +
        "DANIEL: I will. One condition. Tell me what you thought of it when you get back.",
      questions: [
        {
          prompt:      "Why is Priya going to Lisbon?",
          explanation: "Priya is going for a long weekend with her sister, who has lived there for two years and whom Priya has never visited there.",
          options: [
            { text: "To visit her sister for a long weekend.", isCorrect: true },
            { text: "For a work conference.",                  isCorrect: false },
            { text: "To move there permanently.",              isCorrect: false },
            { text: "To open a restaurant.",                   isCorrect: false },
          ],
        },
        {
          prompt:      "How does Daniel describe his feelings about constant travel?",
          explanation: "Daniel says it was exciting for two years but is now a job, and that he misses home more than he expected.",
          options: [
            { text: "It was exciting at first, but now feels like a job.", isCorrect: true },
            { text: "He still finds it exciting after many years.",         isCorrect: false },
            { text: "He has never enjoyed travelling at all.",              isCorrect: false },
            { text: "He plans to start travelling more next year.",         isCorrect: false },
          ],
        },
        {
          prompt:      "What does Daniel ask Priya to do in return for the restaurant recommendation?",
          explanation: "He asks her to tell him what she thought of it when she gets back.",
          options: [
            { text: "Tell him what she thought of it when she returns.", isCorrect: true },
            { text: "Bring him a gift from Lisbon.",                     isCorrect: false },
            { text: "Take a photograph of the menu.",                    isCorrect: false },
            { text: "Pay for his next meal there.",                      isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "What makes a good opinion piece?",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "An opinion column is one of the harder forms of writing to do well. It is short, public, and has nowhere to hide. " +
        "Strong examples have three things in common.\n\n" +
        "The first is a clear claim, stated early. A reader who is still trying to guess what the writer believes by the third paragraph has usually stopped reading. " +
        "Good columnists tell you what they think within the first hundred words and use the rest of the column to defend it.\n\n" +
        "The second is generosity to the other side. A column that caricatures its opponents is satisfying for readers who already agree, but it convinces no one else. " +
        "The strongest columns describe the opposing view in a form its supporters would recognise, then explain why they disagree. This is harder, but it is the only kind of disagreement that changes minds.\n\n" +
        "The third is a single example that does most of the work. " +
        "Abstract argument has its place, but readers remember stories. " +
        "A column about housing policy that includes one specific street in one specific city, with names and details, will be remembered long after a column built entirely from statistics is forgotten. " +
        "Statistics matter, but they need a face.",
      questions: [
        {
          prompt:      "According to the passage, when should the writer's claim appear?",
          explanation: "Within the first hundred words; if the reader is still guessing by the third paragraph, they have usually stopped reading.",
          options: [
            { text: "Within the first hundred words.", isCorrect: true },
            { text: "Only at the very end.",           isCorrect: false },
            { text: "Hidden until the final sentence.", isCorrect: false },
            { text: "Restated in every paragraph.",    isCorrect: false },
          ],
        },
        {
          prompt:      "Why does the passage recommend describing the opposing view fairly?",
          explanation: "Caricature satisfies people who already agree but does not convince anyone else; only fair disagreement changes minds.",
          options: [
            { text: "Because only fair disagreement actually changes minds.", isCorrect: true },
            { text: "Because publishers require it by law.",                  isCorrect: false },
            { text: "Because it makes the column shorter.",                   isCorrect: false },
            { text: "Because readers do not like strong opinions.",           isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about statistics?",
          explanation: "Statistics matter but they need a face; one specific example is more memorable than abstract numbers.",
          options: [
            { text: "They matter, but they need a specific example to be memorable.", isCorrect: true },
            { text: "They should be avoided in opinion writing.",                     isCorrect: false },
            { text: "They are always more powerful than stories.",                    isCorrect: false },
            { text: "They are unnecessary if the writer is famous.",                  isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Voice message: thinking out loud",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 9,
      content:
        "Hey, sorry for the long voice note. I was going to text but I thought it would be quicker to just say it.\n\n" +
        "So I have been thinking about the job offer. The money is good, that part is obvious, and the team seems lovely. The bit I keep getting stuck on is the move.\n\n" +
        "Two years ago I would have said yes immediately. New city, new flat, new everything. Now, honestly, the idea of starting over feels a lot heavier. I have built a real life here. The gym I actually go to. The cafe that knows my order. Friends who know my history. None of that is replaceable in three weeks.\n\n" +
        "On the other hand, my mum keeps reminding me that I once said I would regret not living somewhere else for a while. And she is not wrong. The job here is fine, but I have stopped learning. There are days when I feel I am just keeping the seat warm.\n\n" +
        "What I think I want to do is ask them whether the role can be hybrid for the first six months. If they say yes, I will go. If they say no, I will probably still go, but I want to feel like I asked. Anyway, you do not have to answer this immediately. Just wanted to think out loud at someone. Talk soon.",
      questions: [
        {
          prompt:      "What is the speaker hesitating about?",
          explanation: "The speaker is hesitating about whether to accept a job offer that requires moving.",
          options: [
            { text: "Whether to accept a job offer that requires relocating.", isCorrect: true },
            { text: "Whether to break up with a partner.",                     isCorrect: false },
            { text: "Whether to apply for a job at all.",                      isCorrect: false },
            { text: "Whether to go on holiday.",                               isCorrect: false },
          ],
        },
        {
          prompt:      "What does the speaker's mother point out?",
          explanation: "The mother reminds the speaker that they once said they would regret not living somewhere else for a while.",
          options: [
            { text: "That the speaker once said they would regret not living elsewhere.", isCorrect: true },
            { text: "That the speaker should never move away from family.",               isCorrect: false },
            { text: "That the speaker is not earning enough money.",                      isCorrect: false },
            { text: "That the speaker's friends are unreliable.",                         isCorrect: false },
          ],
        },
        {
          prompt:      "What is the speaker's plan?",
          explanation: "The speaker plans to ask whether the role can be hybrid for the first six months, but will probably go either way.",
          options: [
            { text: "Ask for a hybrid arrangement and likely take the job either way.", isCorrect: true },
            { text: "Refuse the job immediately.",                                      isCorrect: false },
            { text: "Wait until the company offers more money.",                        isCorrect: false },
            { text: "Take the job only if a friend joins them.",                        isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "How sleep changes across the week",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "Most adults sleep on a different rhythm during the week than at the weekend. The pattern is so widespread that researchers have given it a name: social jet lag. " +
        "On weekdays, work or school forces an early wake time. On Saturday and Sunday, people sleep later and stay up later. " +
        "By Sunday night, the body is essentially in a different time zone from the one it will need on Monday morning.\n\n" +
        "This matters more than it sounds. Even a one-hour shift in sleep schedule appears in studies as a measurable change in mood, focus, and reaction time. " +
        "A two-hour shift, which is common, can leave people groggy through Monday and Tuesday before stabilising mid-week. " +
        "By the time the body has adjusted, it is Friday again.\n\n" +
        "There is no perfect solution, and demanding rigid sleep on weekends is unrealistic for most people. " +
        "The simplest improvement is to keep the wake time within an hour of the weekday wake time, even if you go to bed later. " +
        "The body's clock is anchored more by morning light than by bedtime. A consistent wake time, plus exposure to outdoor light shortly afterwards, can shrink social jet lag without forcing anyone to give up their Saturday evening.",
      questions: [
        {
          prompt:      "What does the term \"social jet lag\" describe?",
          explanation: "It describes the difference between weekday and weekend sleep schedules that puts the body in a different rhythm by Monday.",
          options: [
            { text: "The mismatch between weekday and weekend sleep schedules.", isCorrect: true },
            { text: "Jet lag from international flights only.",                   isCorrect: false },
            { text: "A mood disorder caused by social media use.",                isCorrect: false },
            { text: "A phenomenon limited to night-shift workers.",               isCorrect: false },
          ],
        },
        {
          prompt:      "How long does the passage say the body takes to adjust?",
          explanation: "By the time the body has adjusted from a weekend shift, it is Friday again.",
          options: [
            { text: "Most of the working week.",         isCorrect: true },
            { text: "A single night of good sleep.",     isCorrect: false },
            { text: "Two full weeks.",                   isCorrect: false },
            { text: "Less than an hour.",                isCorrect: false },
          ],
        },
        {
          prompt:      "What practical fix does the passage recommend?",
          explanation: "Keep the wake time within an hour of the weekday wake time and get morning outdoor light, rather than enforcing rigid bedtimes.",
          options: [
            { text: "Keep wake time consistent and get morning outdoor light.", isCorrect: true },
            { text: "Sleep in much later on the weekend to recover.",            isCorrect: false },
            { text: "Take long naps every afternoon.",                           isCorrect: false },
            { text: "Use sleep medication on Sunday night.",                     isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Cooking lesson over video call",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 10,
      content:
        "TEACHER: Right, can everyone see my pan? Wave if you can.\n\n" +
        "STUDENT: I can see it but the camera keeps focusing on the wall behind you.\n\n" +
        "TEACHER: One second. Better?\n\n" +
        "STUDENT: Much better.\n\n" +
        "TEACHER: Good. So today is one-pot chicken with lemon and herbs. The whole point is that everything cooks together, in one pan, and the only washing-up is the pan and a chopping board. If you have peeled and chopped your onion already, that is most of the work done.\n\n" +
        "STUDENT: I have. Mine is in pieces that are too big though.\n\n" +
        "TEACHER: Honestly, it does not matter for this dish. The onion will collapse during the cooking. The bigger ones just take a minute longer. Now turn the pan to medium and add the oil. While that is heating, get the chicken thighs out and pat them dry with kitchen paper. The drier they are, the better they brown.\n\n" +
        "STUDENT: Skin side first?\n\n" +
        "TEACHER: Skin side first. Do not move them. They will release from the pan when they are ready, around four minutes. If they stick when you try to lift them, leave them another minute. The pan will tell you.\n\n" +
        "STUDENT: That is reassuring. I always think I have done something wrong.\n\n" +
        "TEACHER: Most cooking mistakes are actually impatience. You learn to wait, you have already learned half of it.",
      questions: [
        {
          prompt:      "What does the teacher say about the size of the onion pieces?",
          explanation: "It does not matter for this dish; the onion will collapse during cooking, and bigger pieces only take a minute longer.",
          options: [
            { text: "It does not matter; the onion will collapse anyway.", isCorrect: true },
            { text: "Pieces must be exactly the same size.",               isCorrect: false },
            { text: "Larger pieces ruin the dish.",                        isCorrect: false },
            { text: "Smaller pieces should be removed before cooking.",    isCorrect: false },
          ],
        },
        {
          prompt:      "Why should the chicken be patted dry?",
          explanation: "The drier the chicken, the better it browns in the pan.",
          options: [
            { text: "It browns better when it is dry.",        isCorrect: true },
            { text: "It cooks faster when it is dry.",         isCorrect: false },
            { text: "It is safer when it is dry.",             isCorrect: false },
            { text: "It absorbs more lemon when it is dry.",   isCorrect: false },
          ],
        },
        {
          prompt:      "What does the teacher mean by \"the pan will tell you\"?",
          explanation: "The chicken will release from the pan when it is ready; if it sticks when lifted, it needs more time.",
          options: [
            { text: "The chicken will release from the pan when it is ready.", isCorrect: true },
            { text: "The pan should be tapped to make a sound.",               isCorrect: false },
            { text: "The pan changes colour when food is done.",               isCorrect: false },
            { text: "The pan must be replaced before cooking.",                isCorrect: false },
          ],
        },
      ],
    },

  ],

  /* Four IELTS-style writing prompts. The themes are deliberately
     everyday rather than academic, matching the GENERAL track's
     scope. The rubric remains IELTS, so prompts mix discursive
     and personal-opinion shapes the way IELTS task 2 does. */
  writingAssignments: [

    {
      title:    "Working from home",
      prompt:
        "Many companies now allow employees to work from home for at least part of the week. " +
        "Some people see this as a significant improvement to working life, while others worry it weakens teams and isolates individuals. " +
        "Discuss both views and give your own opinion, supporting your argument with reasons and examples.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Living in a city versus the countryside",
      prompt:
        "Some people prefer the energy and convenience of city life. Others believe a quieter life in the countryside or in smaller towns offers a healthier and more meaningful daily experience. " +
        "Compare the two ways of living and explain which you would choose, and why. Use specific examples from your own observation or experience.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "The role of social media in friendships",
      prompt:
        "Social media has changed the way friends keep in touch, share news, and resolve disagreements. " +
        "Has this change been positive, negative, or both? Justify your answer with concrete examples and discuss whether you think the effect on friendships will be different ten years from now.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Lifelong learning",
      prompt:
        "Some people argue that adults should keep learning new skills throughout their working lives, while others believe formal education ends after school or university and the rest is simply work experience. " +
        "Which view do you find more convincing? Support your answer with reasoned argument and at least one specific example from a field you know well.",
      minWords: 250,
      maxWords: 320,
    },

  ],
};

const TRACK_B2_JOB: SeedTrack = {
  level:              "B2",
  purpose:            "JOB",
  setTitle:           "B2 -- Job English",
  setDescription:     "Upper-intermediate English for the workplace: emails, meetings, performance feedback, interviews, and professional networking.",

  /* Workplace English at B2: confident enough for meetings,
     interviews, and written communication. Topics escalate from
     daily routine emails to harder situations like performance
     reviews and salary discussions. */
  lessons: [

    {
      title:            "Writing professional emails",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "A professional email is read in two seconds before it is read in detail. " +
        "The subject line and the first sentence decide whether the recipient opens it now, marks it for later, or ignores it altogether. " +
        "Writers who treat the email as one continuous block of text often discover that their main request is buried halfway down the page, where no busy reader will find it.\n\n" +
        "Strong professional emails follow a predictable shape. " +
        "The subject line states the topic and, where possible, the action requested. " +
        "Compare \"Question\" with \"Approval needed: Q3 budget revision by Friday.\" " +
        "The first sentence repeats the action in plain language. " +
        "The middle gives the reader the context needed to act. " +
        "The closing line confirms next steps and timing.\n\n" +
        "Two habits separate writers who get fast replies from those who do not. " +
        "First, they put the request before the explanation. Many writers feel rude doing this, but readers find it considerate, because it lets them decide quickly whether the message needs their attention. " +
        "Second, they re-read the email before sending and remove anything that does not move the request forward. " +
        "A short email is not a curt email. It is a respectful one.",
      questions: [
        {
          prompt:      "Why does the passage recommend putting the request before the explanation?",
          explanation: "The passage says readers find it considerate because it lets them decide quickly whether the message needs their attention.",
          options: [
            { text: "It lets the reader decide quickly whether to act on the email.", isCorrect: true },
            { text: "It is required by company etiquette rules.",                     isCorrect: false },
            { text: "It makes the email shorter overall.",                            isCorrect: false },
            { text: "It avoids the need for a subject line.",                         isCorrect: false },
          ],
        },
        {
          prompt:      "Which of the following is given as a stronger subject line?",
          explanation: "The passage contrasts \"Question\" with the more specific \"Approval needed: Q3 budget revision by Friday.\"",
          options: [
            { text: "Approval needed: Q3 budget revision by Friday.", isCorrect: true },
            { text: "Question.",                                       isCorrect: false },
            { text: "Hello from accounting.",                          isCorrect: false },
            { text: "Important.",                                      isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about email length?",
          explanation: "The passage says a short email is not curt; it is respectful of the reader's time.",
          options: [
            { text: "A short email is respectful of the reader's time.", isCorrect: true },
            { text: "Long emails always show more effort.",              isCorrect: false },
            { text: "All emails should be exactly one paragraph.",       isCorrect: false },
            { text: "Email length does not affect response time.",       isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "A weekly team standup",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 9,
      content:
        "MANAGER: Right, quick standup. Five minutes. Let us go round the table. Layla, where are you?\n\n" +
        "LAYLA: Two things in flight. The customer report goes out tomorrow morning. The data is clean, the draft is with Hassan for review. Second, I am still waiting on legal feedback for the new contract template.\n\n" +
        "MANAGER: How long has legal had it?\n\n" +
        "LAYLA: Eight working days.\n\n" +
        "MANAGER: That is too long. I will follow up after this meeting. Hassan?\n\n" +
        "HASSAN: I am almost finished reviewing Layla's report. I will send comments by lunch. Aside from that, I am preparing the slides for Thursday's client call. The structure is done, I am polishing the language.\n\n" +
        "MANAGER: Send me the deck tonight if you can. I would like to look at it before Thursday morning. Yusuf?\n\n" +
        "YUSUF: I am blocked. The vendor has not confirmed the delivery date for the equipment, and I cannot finalise the project plan until they do. I have chased twice this week.\n\n" +
        "MANAGER: Send me the contact name. I will escalate. Anyone else have something the rest of the team should know?\n\n" +
        "LAYLA: Just a heads-up that I will be away on Friday. I have moved my deliverables earlier in the week.\n\n" +
        "MANAGER: Thanks. Right, let us all get back to work.",
      questions: [
        {
          prompt:      "Why is Layla still waiting on legal feedback?",
          explanation: "Legal has had the contract template for eight working days and has not responded.",
          options: [
            { text: "Legal has had it for eight working days without responding.", isCorrect: true },
            { text: "Layla has not sent the document to legal yet.",               isCorrect: false },
            { text: "Legal rejected the document.",                                isCorrect: false },
            { text: "Layla forgot to follow up.",                                  isCorrect: false },
          ],
        },
        {
          prompt:      "What is Yusuf blocked on?",
          explanation: "Yusuf cannot finalise the project plan until the vendor confirms the equipment delivery date.",
          options: [
            { text: "The vendor has not confirmed the equipment delivery date.", isCorrect: true },
            { text: "The manager has not approved his project plan.",            isCorrect: false },
            { text: "He is waiting for Hassan's review.",                        isCorrect: false },
            { text: "He has run out of budget.",                                 isCorrect: false },
          ],
        },
        {
          prompt:      "What does Layla announce at the end of the meeting?",
          explanation: "Layla announces she will be away on Friday and has moved her deliverables earlier in the week.",
          options: [
            { text: "She will be away on Friday and has moved her deliverables earlier.", isCorrect: true },
            { text: "She has been promoted.",                                              isCorrect: false },
            { text: "She is leaving the company.",                                         isCorrect: false },
            { text: "She needs help with the customer report.",                            isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Performance reviews: the language of feedback",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 12,
      content:
        "Performance reviews are stressful even in companies that handle them well. " +
        "Part of the stress is linguistic: the reviewer is using language to describe behaviour they want changed, while trying not to damage the relationship. " +
        "Reviews that go poorly often come down to specific word choices, not the underlying feedback.\n\n" +
        "The most common error is talking about the person rather than the work. " +
        "\"You are not detail-oriented\" is hard to act on, and it sounds like a verdict on the employee's character. " +
        "\"The last three reports contained calculation errors\" is the same feedback expressed about the work, with evidence the employee can investigate. " +
        "The first sentence invites defensiveness. The second invites a conversation.\n\n" +
        "A second pattern is the use of vague intensifiers. " +
        "\"You need to be more proactive\" is meaningless without an example of what proactive looks like in this role. " +
        "Effective reviewers describe the gap concretely: \"In the last quarter, two of your projects missed milestones because risks were flagged in the final week rather than at the start.\"\n\n" +
        "A third habit is to balance feedback over time, not within a single sentence. " +
        "Sandwiching criticism between two compliments has become a cliche, and most employees recognise the pattern immediately. " +
        "Honest, specific feedback delivered respectfully is more useful than a structurally balanced one that nobody believes.",
      questions: [
        {
          prompt:      "Why is \"You are not detail-oriented\" considered a poor feedback statement?",
          explanation: "It sounds like a verdict on the employee's character and is hard to act on.",
          options: [
            { text: "It sounds like a verdict on character and is hard to act on.", isCorrect: true },
            { text: "It uses too many technical words.",                            isCorrect: false },
            { text: "It is too long for a review.",                                 isCorrect: false },
            { text: "It is grammatically incorrect.",                               isCorrect: false },
          ],
        },
        {
          prompt:      "Which is given as a stronger reformulation?",
          explanation: "The passage gives \"The last three reports contained calculation errors\" as a stronger version because it focuses on the work and provides evidence.",
          options: [
            { text: "The last three reports contained calculation errors.", isCorrect: true },
            { text: "You are not detail-oriented.",                          isCorrect: false },
            { text: "You need to be more proactive.",                        isCorrect: false },
            { text: "You should improve.",                                   isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage say about the feedback sandwich?",
          explanation: "Most employees recognise the pattern immediately, and honest specific feedback is more useful than structurally balanced feedback nobody believes.",
          options: [
            { text: "Most employees recognise it, and honest feedback is more useful.", isCorrect: true },
            { text: "It is the most effective feedback strategy ever invented.",        isCorrect: false },
            { text: "It only works in technical fields.",                                isCorrect: false },
            { text: "It must always be used in performance reviews.",                    isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Job interview: the unexpected question",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 10,
      content:
        "INTERVIEWER: Thanks for that. Last question, and it is a less standard one. Can you tell me about a time you changed your mind about something important at work?\n\n" +
        "CANDIDATE: That is a good question. Let me think for a moment.\n\n" +
        "INTERVIEWER: Take your time.\n\n" +
        "CANDIDATE: Two years ago, I was running a small product team and I was strongly opposed to introducing weekly demos. I thought they would slow us down, and that the team would resent the overhead. The lead designer pushed for them anyway. I disagreed but I let her run a four-week trial.\n\n" +
        "INTERVIEWER: And what happened?\n\n" +
        "CANDIDATE: She was right and I was wrong. The demos surfaced disagreements between engineering and design two weeks earlier than they would have otherwise. We were able to adjust before we had built anything wrong. I had been so focused on the cost of the meetings that I had not considered the cost of finding mistakes late.\n\n" +
        "INTERVIEWER: How did you handle it once you realised?\n\n" +
        "CANDIDATE: I thanked her in front of the team and asked her to lead the demos going forward. I have been honestly more careful since then about how strongly I push back when someone closer to the work has a strong instinct.\n\n" +
        "INTERVIEWER: Thank you. That was a thoughtful answer. We will be in touch by the end of the week.",
      questions: [
        {
          prompt:      "What had the candidate originally been opposed to?",
          explanation: "The candidate had been strongly opposed to introducing weekly demos.",
          options: [
            { text: "Introducing weekly demos.",         isCorrect: true },
            { text: "Hiring a new lead designer.",       isCorrect: false },
            { text: "Working from home.",                isCorrect: false },
            { text: "Sharing the team's roadmap.",       isCorrect: false },
          ],
        },
        {
          prompt:      "Why did the candidate change their mind?",
          explanation: "The demos surfaced engineering-design disagreements two weeks earlier, and the candidate realised they had underestimated the cost of finding mistakes late.",
          options: [
            { text: "The demos exposed problems earlier than the alternative would have.", isCorrect: true },
            { text: "The team threatened to quit.",                                         isCorrect: false },
            { text: "The CEO ordered the change.",                                          isCorrect: false },
            { text: "The candidate read a book on the topic.",                              isCorrect: false },
          ],
        },
        {
          prompt:      "What did the candidate do after realising they were wrong?",
          explanation: "The candidate thanked the lead designer publicly and asked her to lead the demos going forward.",
          options: [
            { text: "Thanked the designer publicly and asked her to lead the demos.", isCorrect: true },
            { text: "Quietly switched to demos without acknowledging the designer.",  isCorrect: false },
            { text: "Reassigned the designer to a different team.",                   isCorrect: false },
            { text: "Wrote a blog post about the experience.",                        isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Negotiating salary without burning bridges",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "Salary discussions are the conversations many otherwise confident professionals dread most. " +
        "The fear is rarely about money itself. It is about damaging the relationship with the person who has just made you an offer.\n\n" +
        "Three principles tend to separate effective negotiators from anxious ones. " +
        "First, they treat the conversation as collaborative rather than adversarial. " +
        "The phrase \"can we discuss\" outperforms \"I demand\" almost every time. The hiring manager wants you to say yes; making it easier for them to do that is in your interest, not theirs.\n\n" +
        "Second, effective negotiators come prepared with a number rooted in research, not a wish. " +
        "Public salary surveys for the role and region are widely available, and a candidate who can say \"based on the data I have seen, the median for this role in this city is X\" is much harder to dismiss than one who simply hopes for more.\n\n" +
        "Third, they negotiate the entire package, not just base salary. " +
        "Bonus structures, vacation days, professional development budgets, and remote work arrangements are often easier for an employer to flex than headline salary, " +
        "and a thoughtful candidate can sometimes win more total value by trading across these dimensions than by pushing only one of them.\n\n" +
        "What unites these three principles is restraint. The most effective negotiators never make the conversation feel like a fight, because a fight has a winner and a loser, and even winning damages the relationship the candidate is about to enter.",
      questions: [
        {
          prompt:      "How does the passage describe effective negotiators' framing of salary discussions?",
          explanation: "They treat the conversation as collaborative rather than adversarial.",
          options: [
            { text: "Collaborative rather than adversarial.", isCorrect: true },
            { text: "Confrontational and direct.",            isCorrect: false },
            { text: "Casual and informal.",                   isCorrect: false },
            { text: "Strictly transactional.",                isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage recommend about salary expectations?",
          explanation: "Come prepared with a number rooted in public salary survey research, not a wish.",
          options: [
            { text: "Base your number on public salary research for the role and region.", isCorrect: true },
            { text: "Always ask for double the offer.",                                     isCorrect: false },
            { text: "Avoid mentioning numbers at all.",                                     isCorrect: false },
            { text: "Refuse the first offer regardless.",                                   isCorrect: false },
          ],
        },
        {
          prompt:      "Why does the passage suggest negotiating the whole package?",
          explanation: "Other dimensions like bonus, vacation, development budget, and remote work are often easier for the employer to flex than base salary.",
          options: [
            { text: "Other dimensions are often easier for the employer to flex.", isCorrect: true },
            { text: "Base salary is irrelevant in modern jobs.",                   isCorrect: false },
            { text: "Bonuses always pay more than salary.",                        isCorrect: false },
            { text: "Companies dislike candidates who care about salary.",         isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Phone call: declining a project request",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 9,
      content:
        "FARAH: Hi Marcus, thanks for taking the call.\n\n" +
        "MARCUS: Of course. I assume this is about the request I sent over yesterday.\n\n" +
        "FARAH: It is. I have looked at it carefully and I want to be honest with you upfront: I do not think we can take it on right now.\n\n" +
        "MARCUS: I appreciate the directness. Can I ask why?\n\n" +
        "FARAH: Two reasons. The timeline you have proposed is six weeks, and we have two committed projects ending around week eight. To deliver yours well, I would need to pull engineers off existing work, and I have already promised those teams stability through the end of the quarter.\n\n" +
        "MARCUS: That is fair. What is the second reason?\n\n" +
        "FARAH: Honestly, I do not think we are the right fit for this work. The expertise you need is heavier on the data side than on engineering. I think Adila's team would do a stronger job, and they have capacity. I can introduce you if it is helpful.\n\n" +
        "MARCUS: That would be very helpful. I appreciate you not just saying yes when the answer should be no.\n\n" +
        "FARAH: It would have hurt both of us in three months. Let me send the introduction this afternoon.\n\n" +
        "MARCUS: Thanks, Farah.",
      questions: [
        {
          prompt:      "What is the first reason Farah declines the project?",
          explanation: "She has two committed projects ending around week eight and has promised teams stability through the end of the quarter.",
          options: [
            { text: "Her teams already have committed work and she has promised stability.", isCorrect: true },
            { text: "She does not like Marcus.",                                              isCorrect: false },
            { text: "The project budget is too small.",                                       isCorrect: false },
            { text: "She is leaving the company.",                                            isCorrect: false },
          ],
        },
        {
          prompt:      "What is the second reason?",
          explanation: "The expertise needed is heavier on the data side, and Adila's team would be a better fit.",
          options: [
            { text: "Her team is not the right fit; the work is more data-heavy.",   isCorrect: true },
            { text: "The project deadline is too far in the future.",                isCorrect: false },
            { text: "She has never managed external requests before.",               isCorrect: false },
            { text: "Marcus has not provided enough information.",                   isCorrect: false },
          ],
        },
        {
          prompt:      "What does Farah offer to do?",
          explanation: "She offers to introduce Marcus to Adila's team, who would be a better fit.",
          options: [
            { text: "Introduce Marcus to a team that is a better fit.", isCorrect: true },
            { text: "Take the project on at half the proposed budget.", isCorrect: false },
            { text: "Defer the project until next year.",                isCorrect: false },
            { text: "Hire new engineers immediately.",                   isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Networking events: making them less awkward",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "Few professional rituals are dreaded more than the networking event. " +
        "A room full of strangers, a name tag, and the implicit pressure to leave with useful contacts. " +
        "Most people approach the situation hoping to survive it; the small minority who enjoy networking events have usually adopted a different mental model.\n\n" +
        "The first shift is to stop trying to meet many people and start trying to have one good conversation. " +
        "Networking metrics that count business cards collected reward the wrong behaviour. " +
        "A genuine fifteen-minute conversation with one person who remembers you the next day is worth more than ten exchanges of cards that go nowhere.\n\n" +
        "The second shift is preparation. " +
        "Before any event of importance, write down two things you would like to learn from people in the room and one thing you can offer. " +
        "The questions you have prepared will keep you in the conversation when small talk runs out, and the offer will give you a way to be useful that is not just a request.\n\n" +
        "The third shift is the follow-up. " +
        "Most professional networking value is created in the forty-eight hours after the event, not during it. " +
        "A short email referencing something specific the other person said converts a fleeting impression into something the recipient is likely to remember.",
      questions: [
        {
          prompt:      "What is the first mental shift the passage recommends?",
          explanation: "Stop trying to meet many people; aim for one good conversation instead.",
          options: [
            { text: "Aim for one good conversation rather than many shallow ones.", isCorrect: true },
            { text: "Collect as many business cards as possible.",                  isCorrect: false },
            { text: "Avoid talking to anyone unfamiliar.",                          isCorrect: false },
            { text: "Stay for the full event regardless of fatigue.",               isCorrect: false },
          ],
        },
        {
          prompt:      "What does the passage suggest preparing in advance?",
          explanation: "Two things to learn from people in the room and one thing to offer.",
          options: [
            { text: "Two things to learn and one thing to offer.", isCorrect: true },
            { text: "A scripted introduction memorised by heart.", isCorrect: false },
            { text: "A list of every attendee's job title.",       isCorrect: false },
            { text: "A short presentation about your career.",     isCorrect: false },
          ],
        },
        {
          prompt:      "When does the passage say most networking value is created?",
          explanation: "In the forty-eight hours after the event, not during it.",
          options: [
            { text: "In the forty-eight hours after the event.", isCorrect: true },
            { text: "In the first ten minutes of the event.",    isCorrect: false },
            { text: "Several months later.",                     isCorrect: false },
            { text: "During the formal speeches at the event.",  isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Voicemail from a recruiter",
      skill:            "LISTENING",
      audioUrl:         "tts:en-GB",
      estimatedMinutes: 8,
      content:
        "Hi, this is Priya from Henderson Talent. I am calling regarding a senior product role at a fintech company based in Riyadh. The hiring manager came across your profile and asked me to reach out.\n\n" +
        "Quick summary so you have it before we speak. The company is a Series B startup, around eighty people, profitable for the last six months. The role would report directly to the head of product and would lead a team of four. " +
        "The package is competitive: base in the upper range for the market, performance bonus, and full remote optional after the first three months on site.\n\n" +
        "Two reasons I am specifically interested in your background. First, you have shipped financial products before, which matters for this team because the regulatory environment is non-trivial. " +
        "Second, your last two roles have been in growing teams, and you have managed product managers, not just engineers. The hiring manager specifically asked for that.\n\n" +
        "If you are open to a conversation, please call me back at the number on your screen. I would be looking to do a thirty-minute introductory chat next week, and if it is a fit, fast-track from there. There is no harm in talking, and I am happy to share more detail before you commit to anything formal. Look forward to hearing from you.",
      questions: [
        {
          prompt:      "What stage and size is the company described in the message?",
          explanation: "A Series B startup of about eighty people, profitable for the last six months.",
          options: [
            { text: "Series B, around eighty people, recently profitable.", isCorrect: true },
            { text: "A pre-seed startup of five people.",                   isCorrect: false },
            { text: "A multinational with thousands of employees.",         isCorrect: false },
            { text: "A government-owned company.",                          isCorrect: false },
          ],
        },
        {
          prompt:      "Which two aspects of the candidate's background does the recruiter highlight?",
          explanation: "Shipped financial products before, and has managed product managers in growing teams.",
          options: [
            { text: "Shipped financial products and managed product managers.", isCorrect: true },
            { text: "Speaks four languages and lives in Riyadh.",                isCorrect: false },
            { text: "Worked at a competitor and has a finance degree.",          isCorrect: false },
            { text: "Has founded two startups previously.",                      isCorrect: false },
          ],
        },
        {
          prompt:      "What is the recruiter proposing as a next step?",
          explanation: "A thirty-minute introductory call next week, with the option to fast-track if it is a fit.",
          options: [
            { text: "A thirty-minute introductory call next week.", isCorrect: true },
            { text: "An immediate formal interview tomorrow.",      isCorrect: false },
            { text: "A signed offer within forty-eight hours.",     isCorrect: false },
            { text: "Visiting the office unannounced.",             isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Saying no without saying no",
      skill:            "READING",
      audioUrl:         null,
      estimatedMinutes: 11,
      content:
        "One of the more delicate skills in professional life is declining a request from someone with more authority than you, while protecting the relationship and your own credibility. " +
        "A flat refusal is sometimes the right answer, but more often the situation calls for a less binary response.\n\n" +
        "The first technique is to redirect the request rather than reject it. " +
        "Instead of \"I cannot take that on,\" a stronger reply is often \"I can take that on, but I would have to deprioritise X. Which would you like me to do?\" " +
        "This makes the trade-off visible and shifts the decision back to the person who has the authority to make it. " +
        "If they choose to keep X, the new request goes away without you having said no. If they choose the new work, you have a clean mandate.\n\n" +
        "The second technique is to ask for time. " +
        "\"Can I come back to you tomorrow with a sense of what is realistic?\" turns a same-meeting refusal into a thoughtful response, and frequently the requester reconsiders the urgency once they reflect on it without you in the room.\n\n" +
        "The third technique, useful for repeated low-value requests, is to make the cost visible. " +
        "Tracking the time spent on a particular kind of work for two weeks and presenting it back to your manager often achieves what direct objection cannot.\n\n" +
        "Behind these techniques is one underlying idea: in most workplaces, the goal is not to refuse work but to ensure that the decisions about what gets done are being made by the people who should be making them.",
      questions: [
        {
          prompt:      "What does the passage describe as the first technique for declining a request?",
          explanation: "Redirect the request rather than reject it; make the trade-off visible by naming what would be deprioritised.",
          options: [
            { text: "Make the trade-off visible by naming what would be deprioritised.", isCorrect: true },
            { text: "Refuse outright as soon as the request is made.",                   isCorrect: false },
            { text: "Pretend not to have heard the request.",                            isCorrect: false },
            { text: "Tell the requester to ask someone else.",                           isCorrect: false },
          ],
        },
        {
          prompt:      "What does the second technique involve?",
          explanation: "Asking for time to come back with a realistic answer, which often leads the requester to reconsider on their own.",
          options: [
            { text: "Asking for time so the requester can reconsider too.", isCorrect: true },
            { text: "Promising to do the work and then forgetting it.",     isCorrect: false },
            { text: "Quoting policy at length.",                            isCorrect: false },
            { text: "Bringing in a third party to make the decision.",      isCorrect: false },
          ],
        },
        {
          prompt:      "What underlying idea does the passage offer about declining work?",
          explanation: "The goal is to ensure decisions about what gets done are made by the people who should be making them.",
          options: [
            { text: "Decisions about work should be made by the right decision-makers.", isCorrect: true },
            { text: "The goal is always to refuse extra work.",                          isCorrect: false },
            { text: "Junior staff should never decline anything.",                       isCorrect: false },
            { text: "Difficult requests should be ignored.",                             isCorrect: false },
          ],
        },
      ],
    },

    {
      title:            "Coffee chat with a future colleague",
      skill:            "LISTENING",
      audioUrl:         "tts:en-US",
      estimatedMinutes: 9,
      content:
        "REEM: Thanks for making time. I know you are slammed before the launch.\n\n" +
        "ALEX: Honestly, I needed thirty minutes away from my desk. So you are joining the data team in two weeks?\n\n" +
        "REEM: That is the plan. I wanted to ask you the awkward questions that nobody answers truthfully in interviews.\n\n" +
        "ALEX: Smart. Fire away.\n\n" +
        "REEM: Where do new joiners struggle in the first three months?\n\n" +
        "ALEX: Good one. The honest answer is the documentation. We have a lot of internal tools and not all of them are well documented. Most new joiners hit a frustrating week around week three when they realise the gap. The fix is to ask early and ask publicly. Do not try to figure it out alone.\n\n" +
        "REEM: Useful. What about the team itself?\n\n" +
        "ALEX: We are mostly senior, mostly direct. Nobody will personally attack you, but feedback comes fast and unsoftened. If you are used to lots of preamble, it can feel abrupt at first. After a month it becomes a feature, not a bug.\n\n" +
        "REEM: Last question. What would you have done differently in your first year?\n\n" +
        "ALEX: Two things. I would have raised concerns about timelines earlier rather than burning weekends. And I would have been more deliberate about getting to know people outside my immediate team. The data team is great, but the work depends on relationships across the company.",
      questions: [
        {
          prompt:      "Where does Alex say new joiners struggle most?",
          explanation: "With the documentation, particularly around internal tools that are not all well documented.",
          options: [
            { text: "Internal tools are not all well documented.",  isCorrect: true },
            { text: "The hours are too long for new joiners.",      isCorrect: false },
            { text: "There is too much office politics.",            isCorrect: false },
            { text: "The pay is below market.",                     isCorrect: false },
          ],
        },
        {
          prompt:      "How does Alex describe the team's feedback culture?",
          explanation: "Mostly senior, mostly direct; feedback comes fast and unsoftened, but is not personal.",
          options: [
            { text: "Direct and unsoftened, but not personal.",       isCorrect: true },
            { text: "Indirect, with feedback rarely given openly.",   isCorrect: false },
            { text: "Hostile and personal at times.",                 isCorrect: false },
            { text: "Entirely positive with no critical feedback.",   isCorrect: false },
          ],
        },
        {
          prompt:      "What would Alex have done differently in their first year?",
          explanation: "Raised timeline concerns earlier instead of burning weekends, and built relationships outside the immediate team.",
          options: [
            { text: "Raised timeline concerns earlier and built broader relationships.", isCorrect: true },
            { text: "Asked for a promotion sooner.",                                     isCorrect: false },
            { text: "Worked from a different office.",                                   isCorrect: false },
            { text: "Refused the role entirely.",                                        isCorrect: false },
          ],
        },
      ],
    },

  ],

  /* Four IELTS-style writing prompts on workplace themes. */
  writingAssignments: [

    {
      title:    "Remote work and team culture",
      prompt:
        "Many companies now operate fully or partly remotely. " +
        "Some leaders argue that remote work has made teams more productive and given employees better quality of life. " +
        "Others worry that remote work weakens team culture, makes mentoring harder, and isolates new joiners. " +
        "Discuss both views and give your own opinion, with reasons and examples drawn from working life.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "When AI tools enter the workplace",
      prompt:
        "Generative AI tools are now widely used at work, from drafting emails to generating code. " +
        "What are the main benefits of these tools, and what are the main risks they introduce for employers and employees? " +
        "Conclude by recommending one specific way an organisation could responsibly integrate AI into the working day.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Are open-plan offices worth it?",
      prompt:
        "Open-plan offices were once celebrated as a way to encourage collaboration. " +
        "More recent research suggests they reduce focused work and increase stress. " +
        "Should companies continue investing in open-plan layouts, or move toward private offices and quiet zones? " +
        "Argue for one position and acknowledge the strongest counter-argument.",
      minWords: 250,
      maxWords: 320,
    },

    {
      title:    "Career changes in mid-life",
      prompt:
        "It is increasingly common for professionals in their thirties and forties to change career direction completely. " +
        "What factors should someone weigh before making such a change, and what are the main risks they should be prepared to manage? " +
        "Use a specific example, real or imagined, to illustrate your argument.",
      minWords: 250,
      maxWords: 320,
    },

  ],
};


const TRACKS: SeedTrack[] = [TRACK_B2_UNIVERSITY, TRACK_B2_GENERAL, TRACK_B2_JOB];


/* ---------- runner boilerplate ---------- */

main()
  .catch((e) => {
    console.error("seed-extra failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });