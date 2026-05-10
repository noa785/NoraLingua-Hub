/*
  Database seed -- expanded edition.

  What this seeds:
    - Levels (A1 through C2) and Purposes (JOB, TRAVEL, etc.)
    - 3 MaterialSets to demonstrate the platform's range:
        1. B1 + Job        (the most common adult learner profile)
        2. B2 + IELTS      (exam preparation, academic English)
        3. A2 + Travel     (beginner, practical everyday English)
    - 5 lessons per MaterialSet (15 lessons total): a mix of
      reading and listening exercises with expanding difficulty.
    - About 50 multiple-choice questions with seeded correct answers
    - 2 writing assignments per MaterialSet (6 total)

  Why expanded from the original 3 lessons per set?
    Three lessons demonstrated the architecture but felt thin in the
    UI. With five lessons each path now reads as a real curriculum,
    not a teaser. Each set follows a "warm-up, core, challenge"
    arc so a learner senses progression as they go.

  Why two writing assignments instead of one?
    A single prompt is easy to skip. Two prompts of different shape
    -- one short, one longer -- give the learner a sense of choice
    and prevent the writing flow from feeling like a single
    pass-or-fail exercise.

  Why upserts and a wipe of prior content?
    Re-running this seed is safe and idempotent. The Level and
    Purpose tables stay (their CEFR keys are stable). The
    MaterialSets, Lessons, Questions, Answers, and Writing
    Assignments are wiped first and re-created from scratch so
    seed-time edits actually land instead of stacking.

  How to run:
    npx prisma db seed
*/

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";
import type { CefrLevel, PurposeKey, SkillType, QuestionType } from "@/generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });


// REFERENCE DATA -- these almost never change

const LEVELS: Array<{
  key: CefrLevel;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  { key: "A1", name: "Beginner",            description: "Introduce yourself and use simple words and phrases.",         sortOrder: 1 },
  { key: "A2", name: "Elementary",          description: "Handle short conversations on familiar topics.",                sortOrder: 2 },
  { key: "B1", name: "Intermediate",        description: "Describe experiences, opinions, and plans clearly.",            sortOrder: 3 },
  { key: "B2", name: "Upper-Intermediate",  description: "Interact with fluency on a wide range of topics.",              sortOrder: 4 },
  { key: "C1", name: "Advanced",            description: "Express ideas precisely in academic and professional contexts.", sortOrder: 5 },
  { key: "C2", name: "Mastery",             description: "Communicate at a near-native level with subtle nuance.",         sortOrder: 6 },
];

const PURPOSES: Array<{
  key: PurposeKey;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  { key: "JOB",        name: "Job",        description: "Workplace communication, emails, meetings.",          sortOrder: 1 },
  { key: "TRAVEL",     name: "Travel",     description: "Practical English for trips and everyday situations.", sortOrder: 2 },
  { key: "UNIVERSITY", name: "University", description: "Academic English for lectures, essays, and discussion.", sortOrder: 3 },
  { key: "IELTS",      name: "IELTS",      description: "Targeted preparation for the IELTS exam.",             sortOrder: 4 },
  { key: "BUSINESS",   name: "Business",   description: "Professional English for client and partner contexts.", sortOrder: 5 },
  { key: "GENERAL",    name: "General",    description: "Well-rounded English across all everyday situations.",  sortOrder: 6 },
];


/* ============================================================
   MATERIAL SET 1 -- B1 + JOB
   Theme: workplace communication. Lessons progress from basic
   email structure to soft skills like delivering bad news.
   ============================================================ */

const MS1_LESSONS = [
  {
    title: "Writing a clear professional email",
    skill: "READING" as SkillType,
    estimatedMinutes: 12,
    sortOrder: 1,
    audioUrl: null,
    content: `A professional email has four parts that almost never change: a clear subject line, a polite greeting, a focused body, and a sign-off.

The subject line is the single most important sentence in your email. Most people read it before they decide whether to open the message at all. A good subject line tells the reader exactly what is inside in five to eight words. "Question about Friday meeting" is a good subject line. "Hello" is not.

The greeting depends on how well you know the person. "Dear Mr. Khan" is formal and safe for a first email. "Hi Sarah" is friendly and appropriate once you have written to each other a few times. Avoid "Hey" in professional emails unless you are very close colleagues.

The body should answer one question: why are you writing? Get to the point in the first sentence or two. If you need to provide background, give the request first and the background second. Most readers scan the first line and the last line; everything in between is read only if those two lines are interesting.

A polite sign-off ends the email cleanly. "Best regards" works almost everywhere. "Thanks" is a little less formal but completely acceptable. "Cheers" is informal and works only with close colleagues.

One more rule, and it is the most important one: read the email out loud before you send it. Your eyes will skip mistakes that your ears catch immediately. A thirty-second read-out-loud has saved countless professionals from sending an email with a missing word, the wrong name, or a tone that sounds harsher than they meant.`,
    questions: [
      { prompt: "According to the article, what is the most important part of a professional email?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The article opens by saying the subject line is the single most important sentence -- most people decide whether to open the email based on it alone.", answers: [
        { text: "The greeting", isCorrect: false }, { text: "The subject line", isCorrect: true }, { text: "The sign-off", isCorrect: false }, { text: "The body", isCorrect: false },
      ]},
      { prompt: 'Which subject line does the article describe as "good"?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "The article gives this exact example to illustrate a five-to-eight-word subject line that tells the reader what is inside.", answers: [
        { text: "Hello", isCorrect: false }, { text: "Important update", isCorrect: false }, { text: "Question about Friday meeting", isCorrect: true }, { text: "Read this please", isCorrect: false },
      ]},
      { prompt: 'When is "Hi Sarah" appropriate as a greeting?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "The article says Hi-style greetings work once you and the recipient have written to each other a few times -- they are friendly but assume some prior contact.", answers: [
        { text: "On a first email to someone you have never met", isCorrect: false }, { text: "Once you have written to each other a few times", isCorrect: true }, { text: "Only if Sarah is your manager", isCorrect: false }, { text: "Never in a professional email", isCorrect: false },
      ]},
      { prompt: "What does the article recommend doing before sending an email?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "The final rule, called \"the most important one\" by the article, is to read the email out loud. Your ears catch mistakes your eyes skip.", answers: [
        { text: "Send it to a colleague to review first", isCorrect: false }, { text: "Read it out loud", isCorrect: true }, { text: "Wait one hour before sending", isCorrect: false }, { text: "Use spell-check three times", isCorrect: false },
      ]},
      { prompt: 'Which sign-off does the article describe as informal?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "The article specifically calls Cheers informal and notes it only works with close colleagues. Best regards, Thanks, and Sincerely are all listed as broadly acceptable.", answers: [
        { text: "Best regards", isCorrect: false }, { text: "Thanks", isCorrect: false }, { text: "Cheers", isCorrect: true }, { text: "Sincerely", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Scheduling meetings without sounding pushy",
    skill: "READING" as SkillType,
    estimatedMinutes: 10,
    sortOrder: 2,
    audioUrl: null,
    content: `Scheduling a meeting in English requires a balance: you want to be clear about what you need, but you do not want to sound like you are giving orders. The trick is to use questions and offers instead of demands.

Compare these two requests. "Send me times for Tuesday." That is a demand. It tells the reader what to do, with no room for them to push back. Now compare it to "Could you let me know what times work for you on Tuesday?" That is a question. It assumes the reader has constraints of their own and gives them space to suggest alternatives.

The same principle applies when you propose times yourself. "We will meet at 3 PM Tuesday" is a statement that allows no discussion. "Would 3 PM Tuesday work for you, or is another time better?" is an offer that invites a response.

When you need to reschedule, lead with the apology, not the new time. "I am sorry, but I need to move our Tuesday call. Would Wednesday afternoon work?" is much warmer than "Move our call to Wednesday afternoon." The apology shows you understand you are causing inconvenience.

Three small phrases will rescue almost any scheduling email. "Would it work to..." is gentler than "Can we..." or "Let us...". "I appreciate your flexibility" is a small thank-you that goes a long way. "Whichever works best for you" hands control back to the reader, which is generous and almost always appreciated.

These habits feel slow at first, especially if your native language uses more direct register. Trust that the small extra words pay off. Colleagues remember whether you sound respectful, even on busy days.`,
    questions: [
      { prompt: "What is the main difference the article draws between a demand and a question?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The article frames the contrast as: a demand removes choice, a question gives the reader space to suggest alternatives. Length and politeness are not the core difference.", answers: [
        { text: "A question is longer than a demand", isCorrect: false }, { text: "A question gives the reader room to push back; a demand does not", isCorrect: true }, { text: "A demand is more polite than a question", isCorrect: false }, { text: "A question is only used by managers; a demand is used by employees", isCorrect: false },
      ]},
      { prompt: "When you need to reschedule, what does the article say to lead with?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Lead with the apology. The article gives this exact phrasing as the example of warm rescheduling: \"I am sorry, but I need to move our Tuesday call. Would Wednesday afternoon work?\"", answers: [
        { text: "The new time you want", isCorrect: false }, { text: "The reason for the change", isCorrect: false }, { text: "An apology", isCorrect: true }, { text: "A request for confirmation", isCorrect: false },
      ]},
      { prompt: 'Which phrase does the article say is "gentler" than "Can we..."?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Would it work to is the gentler alternative the article highlights -- it assumes the reader has constraints of their own.", answers: [
        { text: "We will...", isCorrect: false }, { text: "Would it work to...", isCorrect: true }, { text: "I need...", isCorrect: false }, { text: "Send me...", isCorrect: false },
      ]},
      { prompt: 'What does the phrase "Whichever works best for you" do, according to the article?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "It hands control back to the reader. The article praises this as generous and almost always appreciated.", answers: [
        { text: "It saves time by reducing back-and-forth", isCorrect: false }, { text: "It hands control back to the reader", isCorrect: true }, { text: "It signals that the meeting is optional", isCorrect: false }, { text: "It avoids committing you to any specific time", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Listening: a five-minute one-on-one with your manager",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 8,
    sortOrder: 3,
    audioUrl: "tts:en-GB",
    content: `Manager: Good morning, Sarah. Thanks for making time. How are you doing this week?

Sarah: Good morning. I am doing well, thanks. A bit tired -- the kids had a busy weekend -- but otherwise good.

Manager: Glad to hear it. Let me start by checking in. How are things going with the Q3 report?

Sarah: The report is mostly on track. The data section is finished and I have a draft of the executive summary. The only piece outstanding is the regional comparison, which I am still waiting on numbers for from Marcus.

Manager: Good. I want to raise one thing, and I want to be direct about it. The first draft was due last Friday and we are now Wednesday. What happened there?

Sarah: That is fair. I underestimated how long the data clean-up would take. Marcus delivered his first cut of the regional numbers on Thursday, which left no time to integrate them before Friday. I should have flagged it earlier in the week instead of trying to catch up.

Manager: I appreciate you taking ownership rather than pointing fingers. For next time, can we agree that if you see a deadline slipping, you tell me by midweek? I would much rather adjust expectations early than read about a missed deadline on Friday.

Sarah: Yes, that is a fair ask. I will set a Wednesday checkpoint for myself on every reporting deadline going forward.

Manager: Perfect. Anything you need from me to make this week smooth?

Sarah: A nudge to Marcus on the regional numbers would help. He is responsive but he has a lot on.

Manager: I will email him this afternoon. Talk to you Friday.`,
    questions: [
      { prompt: "How does the manager open the conversation?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The manager asks \"How are you doing this week?\" before raising any work topic -- a personal check-in.", answers: [
        { text: "By asking about progress on the project", isCorrect: false }, { text: "By checking in on personal context", isCorrect: true }, { text: "By raising the missed deadline immediately", isCorrect: false }, { text: "By assigning a new task", isCorrect: false },
      ]},
      { prompt: "What does Sarah avoid doing when explaining the missed deadline?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "She names the actual cause and takes ownership rather than blaming Marcus or making excuses. The manager explicitly thanks her for not pointing fingers.", answers: [
        { text: "Asking for help", isCorrect: false }, { text: "Making excuses", isCorrect: true }, { text: "Suggesting a deadline", isCorrect: false }, { text: "Apologizing", isCorrect: false },
      ]},
      { prompt: "What agreement does the manager propose for next time?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "The manager asks Sarah to flag slipping deadlines by midweek -- a Wednesday warning instead of a Friday surprise.", answers: [
        { text: "Sarah should ask Marcus for help earlier", isCorrect: false }, { text: "If a deadline is slipping, tell the manager by midweek", isCorrect: true }, { text: "Submit drafts every Wednesday going forward", isCorrect: false }, { text: "Reduce the scope of the Q3 report", isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 4 */
  {
    title: "Delivering bad news at work without panic",
    skill: "READING" as SkillType,
    estimatedMinutes: 11,
    sortOrder: 4,
    audioUrl: null,
    content: `Sometimes you have to write an email no one wants to send. A project is delayed. A budget is rejected. A teammate has to deliver a number that did not hit target. The temptation in these moments is to bury the news, soften it with so many qualifiers that the reader cannot tell what you actually mean. Resist that temptation.

The strongest pattern for delivering bad news in English follows three steps: lead with context, state the news plainly, and close with the path forward.

Step one -- context. One or two sentences that set up the situation. "We had committed to a launch date of October 15. We have been tracking velocity weekly to that date." Context is not an excuse; it is a reminder of what was agreed.

Step two -- the news. State it directly, in one sentence, in the active voice. "We will not hit October 15." Not "There may be some concerns about whether October 15 remains feasible." Not "We are seeing some signals that suggest..." Just the news.

Step three -- the path forward. This is where most writers fall short. The reader of bad news is not asking "what happened" -- they are asking "what now?" Answer that question with three things: a new date, the reason you can trust the new date, and what you need from the reader to make it happen.

Avoid two common traps. First, do not over-apologize. One sincere line is enough. Repeated apology makes the writer sound more guilty than the situation calls for and shifts the reader from problem-solving mode to comforting mode. Second, do not blame people by name. Even if a missed dependency is the real cause, name the dependency, not the person. "We could not start until the data was delivered" is fine; "Marcus delivered the data late" is not.

Bad news handled well builds credibility. Bad news handled poorly costs you more than the missed date itself.`,
    questions: [
      { prompt: "What is the three-step pattern the article recommends for delivering bad news?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The article spells out three steps: context, the news itself, and the path forward.", answers: [
        { text: "Apologize, explain, promise", isCorrect: false }, { text: "Context, news, path forward", isCorrect: true }, { text: "Background, blame, solution", isCorrect: false }, { text: "Greeting, problem, sign-off", isCorrect: false },
      ]},
      { prompt: 'Which sentence is the article\'s example of the news stated directly?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: '"We will not hit October 15" is the direct example. The other options are exactly the kinds of soft, hedged constructions the article tells you to avoid.', answers: [
        { text: "There may be some concerns about whether October 15 remains feasible", isCorrect: false }, { text: "We will not hit October 15", isCorrect: true }, { text: "We are seeing some signals that suggest delays", isCorrect: false }, { text: "Various factors are affecting our timeline", isCorrect: false },
      ]},
      { prompt: "According to the article, what is the reader of bad news really asking?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'The article makes this contrast explicit: not "what happened" but "what now?" -- which is why the path forward matters most.', answers: [
        { text: "Why did this happen?", isCorrect: false }, { text: "Whose fault is it?", isCorrect: false }, { text: "What now?", isCorrect: true }, { text: "How serious is the damage?", isCorrect: false },
      ]},
      { prompt: "What does the article say about over-apologizing?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "Repeated apology makes the writer sound more guilty than the situation calls for, and shifts the reader from problem-solving into comforting the writer.", answers: [
        { text: "It is always appropriate when delivering bad news", isCorrect: false }, { text: "It makes the writer sound more guilty than the situation calls for", isCorrect: true }, { text: "It is required in formal English", isCorrect: false }, { text: "It works only when the news is very bad", isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 5 */
  {
    title: "Listening: a project status standup",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 7,
    sortOrder: 5,
    audioUrl: "tts:en-US",
    content: `Lead: Good morning everyone. Quick standup. Three questions as usual: what did you do yesterday, what are you doing today, anything blocking you. Priya, do you want to start?

Priya: Sure. Yesterday I finished the API integration tests -- all green. Today I am pairing with Marcus on the cache layer. Nothing blocking.

Marcus: Yesterday I closed two bugs from the queue. Today, like Priya said, we are working on the cache. One blocker -- the staging environment was down twice yesterday. If it goes down again I will need help from infrastructure.

Lead: Noted. I will give Sam at infra a heads-up after this call. Karim, you?

Karim: Yesterday I drafted the security review document. Today I want to send it for sign-off. One thing I would like input on: the data retention section. I am not sure whether we need ninety or one hundred and eighty days. Could someone with compliance background review it before I send?

Lead: I can review it today. Send it to me right after this call. Last one -- Maya?

Maya: Yesterday I worked on the new dashboard wireframes. Today I am refining them based on the feedback from yesterday's design critique. No blockers, but I will probably need product input by end of week to finalize the metrics shown.

Lead: Got it. Maya, please put a calendar hold on Karen for Friday morning. Anything else from anyone? No? Good standup, team. Talk tomorrow.`,
    questions: [
      { prompt: "What three questions does the lead ask each team member?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The lead opens by spelling out the standup format: yesterday, today, blockers.", answers: [
        { text: "What is the priority, what is the deadline, who is helping", isCorrect: false }, { text: "What did you do yesterday, what are you doing today, anything blocking you", isCorrect: true }, { text: "What worked, what failed, what is next", isCorrect: false }, { text: "What is your status, what do you need, when will you finish", isCorrect: false },
      ]},
      { prompt: "What blocker does Marcus raise?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Marcus mentions the staging environment was down twice yesterday and that he will need infrastructure help if it happens again.", answers: [
        { text: "He cannot find the cache documentation", isCorrect: false }, { text: "The staging environment was down twice yesterday", isCorrect: true }, { text: "He needs Priya to finish her tests first", isCorrect: false }, { text: "He has too many bugs in his queue", isCorrect: false },
      ]},
      { prompt: "What does Karim ask for help with?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Karim asks for compliance review on the data retention section -- specifically whether to use ninety or one hundred and eighty days.", answers: [
        { text: "Compliance review on the data retention section", isCorrect: true }, { text: "Help drafting the security review document", isCorrect: false }, { text: "Sign-off from product on his timeline", isCorrect: false }, { text: "Pairing time with Marcus on the cache", isCorrect: false },
      ]},
    ],
  },
];


/* ============================================================
   MATERIAL SET 2 -- B2 + IELTS
   Theme: IELTS preparation. Mix of Task 1 graphs, Task 2 essay
   technique, academic register, and listening skills.
   ============================================================ */

const MS2_LESSONS = [
  {
    title: "IELTS Task 1: describing trends in a line graph",
    skill: "READING" as SkillType,
    estimatedMinutes: 15,
    sortOrder: 1,
    audioUrl: null,
    content: `Task 1 of the IELTS Academic Writing test asks you to describe a chart, graph, or process in 150 words within 20 minutes. Most candidates lose points not because their English is poor but because they do not know the specific vocabulary the examiner is looking for.

When describing a line graph, you have three jobs. First, give an overview. Second, describe the most significant trends. Third, support those trends with specific data points. You do not need to describe every single number; you need to describe the most important shape of the graph.

The vocabulary of trends is small but precise. Things can rise, increase, climb, surge, or rocket. They can fall, decline, drop, plunge, or plummet. They can fluctuate, level off, plateau, or remain stable. The verbs you choose signal speed and severity. "Rocketed" tells the reader the change was sudden and dramatic. "Climbed steadily" tells them the change was gradual and consistent.

Adverbs sharpen the picture further. A figure can rise sharply, dramatically, significantly, gradually, or slightly. The combination of verb plus adverb gives you precise control over how the change feels. "Rose slightly" and "rocketed" describe two completely different stories.

Time markers connect your sentences. "Between 2010 and 2015" anchors a period. "From 2015 onwards" signals a turning point. "Throughout the decade" suggests something continuous. Without these markers your description reads as a list of facts; with them, it reads as a narrative.

The single most common mistake is describing every data point in order. Examiners do not want a list. They want analysis: the highest point, the lowest point, the biggest change, and the overall direction. If your description sounds like you are reading numbers from a table, rewrite it.`,
    questions: [
      { prompt: "How many minutes does the article say candidates have for Task 1?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Task 1 has a 20-minute time limit. The article states this in the opening paragraph alongside the 150-word minimum.", answers: [
        { text: "10 minutes", isCorrect: false }, { text: "15 minutes", isCorrect: false }, { text: "20 minutes", isCorrect: true }, { text: "30 minutes", isCorrect: false },
      ]},
      { prompt: 'According to the article, what does the verb "rocketed" tell the reader?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'The article uses "rocketed" specifically as the example for sudden and dramatic change. "Climbed steadily" carries the opposite meaning.', answers: [
        { text: "The change was small but consistent", isCorrect: false }, { text: "The change was sudden and dramatic", isCorrect: true }, { text: "The change reversed direction halfway", isCorrect: false }, { text: "The change was at the lowest point of the graph", isCorrect: false },
      ]},
      { prompt: 'What is the "single most common mistake" the article identifies?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Describing every data point in order. The article calls this the single most common mistake because examiners want analysis, not a list.", answers: [
        { text: "Using too few adverbs", isCorrect: false }, { text: "Writing fewer than 150 words", isCorrect: false }, { text: "Describing every data point in order", isCorrect: true }, { text: "Missing the overview sentence", isCorrect: false },
      ]},
      { prompt: 'Which time marker suggests something continuous?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'Throughout the decade implies continuous duration. The other markers anchor specific periods or turning points but not continuity.', answers: [
        { text: "Between 2010 and 2015", isCorrect: false }, { text: "From 2015 onwards", isCorrect: false }, { text: "Throughout the decade", isCorrect: true }, { text: "By the end of 2020", isCorrect: false },
      ]},
      { prompt: "What does the article say examiners want, instead of a list of facts?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "The article specifies four things examiners want: highest point, lowest point, biggest change, and overall direction -- collectively framed as analysis.", answers: [
        { text: "More vocabulary variety", isCorrect: false }, { text: "Analysis: highest point, lowest point, biggest change", isCorrect: true }, { text: "Personal opinions about the data", isCorrect: false }, { text: "Predictions about future trends", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Academic register: hedging your claims",
    skill: "READING" as SkillType,
    estimatedMinutes: 12,
    sortOrder: 2,
    audioUrl: null,
    content: `In academic English, the strength of a claim is almost as important as the claim itself. A writer who says "this proves X" without evidence sounds amateur. A writer who says "this suggests X may be the case in some contexts" sounds like a researcher. The difference is hedging.

Hedging is the use of words and phrases that soften a claim. It signals to the reader that you are aware of the limits of your evidence. Hedging does not mean you are unsure of yourself; it means you are honest about what your evidence can and cannot support.

The most common hedging tools are modal verbs: may, might, could, would. "X causes Y" is a strong claim. "X may cause Y" is a hedged claim that admits other explanations exist. The modal verb does most of the work.

A second tool is the adverb of probability: possibly, probably, perhaps, likely. "It is likely that X" is more cautious than "X". A third tool is the verb of attribution: suggests, indicates, implies, points to. "The data suggests X" is more cautious than "The data shows X".

Over-hedging is also a mistake. A sentence with three hedges in it reads as nervous and undermines confidence. "It may possibly be likely that X could perhaps be true" is a parody, not a sentence. One or two hedges per claim is usually enough.

IELTS examiners reward appropriate hedging in Task 2 essays. A candidate who writes "All children should learn to code" sounds dogmatic; one who writes "Most children would benefit from learning to code" sounds reasonable. The difference is one word, and it can be the difference between a 6 and a 7.`,
    questions: [
      { prompt: "What does the article say hedging signals to the reader?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The article makes this distinction explicit: hedging is not about uncertainty in yourself, it is honesty about your evidence.", answers: [
        { text: "That the writer is unsure of themselves", isCorrect: false }, { text: "That the writer is aware of the limits of their evidence", isCorrect: true }, { text: "That the writer needs more research", isCorrect: false }, { text: "That the claim is wrong", isCorrect: false },
      ]},
      { prompt: "Which of these is described as a modal verb used for hedging?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'May is one of four modal verbs the article lists for hedging: may, might, could, would. Likely is an adverb; suggests is a verb of attribution; therefore is neither.', answers: [
        { text: "Likely", isCorrect: false }, { text: "Suggests", isCorrect: false }, { text: "May", isCorrect: true }, { text: "Therefore", isCorrect: false },
      ]},
      { prompt: "What problem does the article identify with over-hedging?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "It reads as nervous and undermines confidence. The example sentence with three stacked hedges is given as a parody.", answers: [
        { text: "It uses too few words", isCorrect: false }, { text: "It reads as nervous and undermines confidence", isCorrect: true }, { text: "It is forbidden in academic writing", isCorrect: false }, { text: "It is impossible to translate to other languages", isCorrect: false },
      ]},
      { prompt: "How many hedges per claim does the article say is usually enough?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "One or two. The article specifically warns that more than that begins to sound nervous.", answers: [
        { text: "None", isCorrect: false }, { text: "One or two", isCorrect: true }, { text: "Three to four", isCorrect: false }, { text: "As many as possible", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Listening: an academic lecture excerpt",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 10,
    sortOrder: 3,
    audioUrl: "tts:en-GB",
    content: `Today I want to introduce three concepts that any student of urban planning needs to understand. These are not just textbook definitions; they shape how people experience the cities they live in. The three concepts are density, walkability, and zoning.

First, density. Density is the number of people per square kilometre. High-density cities, like Tokyo or Hong Kong, have many people living in a small area. This may sound unpleasant, but high density actually enables many of the features people love about great cities: shops within walking distance, frequent public transit, and lively street life. Tokyo, for example, has over 6,000 people per square kilometre in its central wards. That density is what makes its trains run every two minutes.

Second, walkability. Walkability is the degree to which a neighbourhood encourages walking instead of driving. It is not the same as density. A walkable neighbourhood has shops, schools, parks, and homes mixed together within fifteen minutes on foot. Compare central Paris, which is highly walkable, with Houston, Texas, which is dense in some areas but designed almost entirely for cars. Walkability is about how the streets are arranged; density is about how many people are there.

Third, and perhaps the most powerful tool planners have, is zoning. Zoning laws specify what can be built where. A residential zone allows homes but not factories. A commercial zone allows shops and offices. Some critics argue that strict zoning, especially in the United States, is the single biggest cause of unaffordable housing because it makes density and walkability illegal in most neighbourhoods.

In contrast to most North American cities, European cities tend to have more flexible zoning, which is one reason their neighbourhoods feel more mixed and lively. We will return to this point next week when we look at the case of Barcelona.`,
    questions: [
      { prompt: "How many key concepts does the lecturer introduce?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Three: density, walkability, and zoning. The lecturer states the count explicitly in the opening sentence.", answers: [
        { text: "Two", isCorrect: false }, { text: "Three", isCorrect: true }, { text: "Four", isCorrect: false }, { text: "Five", isCorrect: false },
      ]},
      { prompt: "What does the lecturer use to support each concept?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "An example from a real city: Tokyo for density, Paris vs Houston for walkability, the United States for zoning.", answers: [
        { text: "A statistical study", isCorrect: false }, { text: "An example from a real city", isCorrect: true }, { text: "A definition from a textbook", isCorrect: false }, { text: "A historical anecdote", isCorrect: false },
      ]},
      { prompt: 'Which is described as a "signposting" word?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: '"First" is a signposting word -- it tells the listener where they are in the structure. The other options are content nouns, not signposting.', answers: [
        { text: "Density", isCorrect: false }, { text: "Walkability", isCorrect: false }, { text: "First", isCorrect: true }, { text: "Zoning", isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 4 */
  {
    title: "IELTS Task 2: structuring an opinion essay",
    skill: "READING" as SkillType,
    estimatedMinutes: 14,
    sortOrder: 4,
    audioUrl: null,
    content: `Task 2 is the longer and more heavily weighted half of the IELTS Writing test. You have 40 minutes to produce an essay of at least 250 words on a given topic. Most candidates can write this much; the question is whether they can write it well, and that depends almost entirely on structure.

A high-scoring Task 2 essay almost always follows the same five-paragraph shape. Paragraph one is the introduction. Paragraph two and three are the body, each developing one idea. Paragraph four is a counterargument or qualification. Paragraph five is the conclusion. This is not a creative exercise. The structure is the point.

The introduction has two jobs: paraphrase the question, then state your position. Do not waste sentences telling the examiner that the topic is "important nowadays" or "controversial". Get to your thesis. A good introduction is three sentences: paraphrase, thesis, brief preview of how you will support it.

Each body paragraph follows the PEEL pattern: Point, Evidence, Explain, Link. State your point in the first sentence. Provide evidence -- a study, an example, a piece of reasoning. Explain why this evidence supports your point. End with a sentence that links back to the thesis. Examiners are explicitly trained to look for this structure, so writing in any other shape costs you points.

The counterargument paragraph is what separates a band 6 essay from a band 7. A weak essay only argues for its own side. A strong essay acknowledges the strongest opposing view, then explains why your position still holds despite that view. This signals critical thinking, which is what the descriptors reward.

The conclusion, finally, must restate the thesis in different words and add no new ideas. New ideas in a conclusion are the most common single mistake in IELTS Task 2. Save them for the body paragraphs.`,
    questions: [
      { prompt: "How many minutes do candidates have for Task 2?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Task 2 has a 40-minute limit, and the essay must be at least 250 words.", answers: [
        { text: "20 minutes", isCorrect: false }, { text: "30 minutes", isCorrect: false }, { text: "40 minutes", isCorrect: true }, { text: "60 minutes", isCorrect: false },
      ]},
      { prompt: "What does the PEEL pattern stand for?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Point, Evidence, Explain, Link. The article highlights this as the structure each body paragraph should follow.", answers: [
        { text: "Plan, Edit, Examine, Learn", isCorrect: false }, { text: "Point, Evidence, Explain, Link", isCorrect: true }, { text: "Premise, Example, Elaborate, List", isCorrect: false }, { text: "Position, Evaluate, Express, Lead", isCorrect: false },
      ]},
      { prompt: "What does the article say separates a band 6 essay from a band 7?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrect: 3, sortOrder: 3, explanation: "The counterargument paragraph. Acknowledging the strongest opposing view and explaining why your position still holds is what signals critical thinking to examiners.", answers: [
        { text: "Using more sophisticated vocabulary", isCorrect: false }, { text: "Writing more than 350 words", isCorrect: false }, { text: "Including a counterargument paragraph", isCorrect: true }, { text: "Adding multiple thesis statements", isCorrect: false },
      ]},
      { prompt: "What is the most common single mistake in Task 2 conclusions?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "Adding new ideas in the conclusion. The article is explicit: new ideas should be saved for body paragraphs.", answers: [
        { text: "Restating the thesis", isCorrect: false }, { text: "Being too short", isCorrect: false }, { text: "Adding new ideas", isCorrect: true }, { text: "Using the same words as the introduction", isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 5 */
  {
    title: "Listening: a debate-style classroom discussion",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 9,
    sortOrder: 5,
    audioUrl: "tts:en-GB",
    content: `Tutor: Right, let us pick up where we left off. The question on the table is whether universities should require all undergraduates to study at least one humanities subject. Amir, you were arguing for the requirement. Could you summarize your position?

Amir: Yes. My main point is that humanities teach a kind of thinking that is not taught anywhere else in the curriculum. A computer science student who has never read a novel and never written an essay about ethics graduates with technical skills but no framework for thinking about what those skills are for. A requirement of even one humanities course addresses that gap.

Tutor: Hannah, you were taking the opposing view.

Hannah: I do not deny that humanities teach valuable thinking. My objection is to the requirement specifically. If we believe humanities are valuable, the case for them should be made strongly enough that students choose them voluntarily. Compulsory humanities courses tend to produce resentful students who do the minimum to pass and learn nothing.

Tutor: That is a real critique. Amir, how would you respond?

Amir: I would push back on the assumption that all students will resent it. In my experience the most rewarding courses I took were the ones outside my field that I would never have chosen on my own. A requirement is sometimes the only thing that gets students past their own narrow assumptions about what matters.

Hannah: But you are extrapolating from your own experience. The data on compulsory courses, particularly in North American universities, suggests very mixed outcomes.

Tutor: Both of you are making good arguments. Hannah, can you point to specific studies you have in mind?

Hannah: I can. There was a piece by Arum and Roksa in 2011 looking at outcomes in general education programs that...`,
    questions: [
      { prompt: "What is the topic of the debate?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The tutor states it directly: whether universities should require all undergraduates to study at least one humanities subject.", answers: [
        { text: "Whether universities are too expensive", isCorrect: false }, { text: "Whether undergraduates should be required to study a humanities subject", isCorrect: true }, { text: "Whether computer science is a valuable degree", isCorrect: false }, { text: "Whether students should choose their own courses", isCorrect: false },
      ]},
      { prompt: "What is Hannah's main objection?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Her objection is to the requirement specifically, not to humanities themselves. She argues that compulsion produces resentful students rather than engaged ones.", answers: [
        { text: "Humanities are not valuable", isCorrect: false }, { text: "Humanities take time away from technical subjects", isCorrect: false }, { text: "Compulsory courses produce resentful students", isCorrect: true }, { text: "Humanities are too expensive to teach", isCorrect: false },
      ]},
      { prompt: "What does Hannah challenge in Amir's response?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "She points out he is extrapolating from his own experience, and notes that data on compulsory courses suggests mixed outcomes.", answers: [
        { text: "His use of technical vocabulary", isCorrect: false }, { text: "That he is extrapolating from his own experience", isCorrect: true }, { text: "That he has not read enough humanities", isCorrect: false }, { text: "That he is being too aggressive", isCorrect: false },
      ]},
    ],
  },
];


/* ============================================================
   MATERIAL SET 3 -- A2 + TRAVEL
   Theme: practical English for travel. Lessons cover airports,
   hotels, restaurants, asking for directions, emergencies.
   ============================================================ */

const MS3_LESSONS = [
  {
    title: "At the airport: check-in and security",
    skill: "READING" as SkillType,
    estimatedMinutes: 8,
    sortOrder: 1,
    audioUrl: null,
    content: `When you arrive at the airport, the first place you go is the check-in desk. The airline staff will say "Good morning. May I have your passport, please?" You give them your passport. They will ask "Are you checking any bags?" You can say "Yes, one bag" or "No, only carry-on."

After check-in you go to security. At security, you must take off your shoes, your belt, and your jacket. You put your laptop and any liquids in a separate tray. The officer may say "Step through, please" and ask you to walk through a metal detector. If the machine beeps, do not worry. The officer will say "Could you raise your arms?" and check you with a small device.

After security you find your gate. The gate number is on your boarding pass. The boarding pass also shows your seat number and your boarding time. Boarding time is usually thirty minutes before the flight leaves. Listen for announcements like "Now boarding rows 20 to 35" or "Final call for flight BA 234 to London."

Useful phrases:
- "Where is gate 42?"
- "Is the flight on time?"
- "Where can I find a water fountain?"
- "Excuse me, is this the line for security?"

If you do not understand the officer or staff member, it is fine to say "Sorry, could you repeat that?" or "Sorry, could you speak more slowly?" Almost everyone is patient with travelers who are polite.`,
    questions: [
      { prompt: "What is the first place you go when you arrive at the airport?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The check-in desk is the first stop. After that comes security, then the gate.", answers: [
        { text: "The gate", isCorrect: false }, { text: "The check-in desk", isCorrect: true }, { text: "Security", isCorrect: false }, { text: "The boarding area", isCorrect: false },
      ]},
      { prompt: "What does the article say you must take off at security?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Shoes, belt, and jacket. The article also mentions putting laptops and liquids in a separate tray.", answers: [
        { text: "Your passport", isCorrect: false }, { text: "Your shoes, belt, and jacket", isCorrect: true }, { text: "Your watch and glasses", isCorrect: false }, { text: "Nothing", isCorrect: false },
      ]},
      { prompt: "How long before the flight leaves does boarding usually start?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "About 30 minutes before departure. The article mentions this as the typical boarding time shown on the boarding pass.", answers: [
        { text: "10 minutes", isCorrect: false }, { text: "30 minutes", isCorrect: true }, { text: "1 hour", isCorrect: false }, { text: "2 hours", isCorrect: false },
      ]},
      { prompt: 'According to the article, what should you say if you do not understand?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'The article suggests "Sorry, could you repeat that?" or "Sorry, could you speak more slowly?" Polite travelers usually get patient responses.', answers: [
        { text: '"What?" or "Huh?"', isCorrect: false }, { text: '"Sorry, could you repeat that?" or "Speak more slowly, please"', isCorrect: true }, { text: 'Nothing -- just walk away', isCorrect: false }, { text: '"I do not speak English"', isCorrect: false },
      ]},
    ],
  },
  {
    title: "Checking into a hotel",
    skill: "READING" as SkillType,
    estimatedMinutes: 7,
    sortOrder: 2,
    audioUrl: null,
    content: `When you arrive at the hotel, you go to the front desk, also called the reception. The receptionist will say "Welcome. Do you have a reservation?" You answer "Yes, my name is..." and give your full name.

The receptionist will ask for your passport or ID card. They will also ask for a credit card "for incidentals". Incidentals are extra charges, like the mini-bar in your room or breakfast in the restaurant. Your credit card is held for these but usually not charged unless you use those services.

The receptionist will give you a key card and tell you your room number. They will also tell you the floor. "Your room is 412 on the fourth floor. The elevators are on your right." You should also ask about breakfast: "What time is breakfast?" "Where is breakfast served?"

If you have a problem in your room, call the front desk. The phone in the room has a button labeled "0" or "Reception". Common problems and what to say:
- The wifi does not work: "I cannot connect to the wifi. Could you help me?"
- The room is too cold: "Could I have an extra blanket, please?"
- The shower has no hot water: "I have no hot water in the shower."

When you check out, you say "I would like to check out, please." The receptionist will ask "Did you use the mini-bar?" Be honest. If you used something, the cost is added to your final bill. The receptionist will email you a receipt or print one for you.`,
    questions: [
      { prompt: "What is another name for the front desk?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The reception. The article uses both terms in the opening sentence.", answers: [
        { text: "The lobby", isCorrect: false }, { text: "The reception", isCorrect: true }, { text: "The concierge", isCorrect: false }, { text: "The bellhop", isCorrect: false },
      ]},
      { prompt: 'What does the article say "incidentals" means?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Incidentals are extra charges -- examples in the article are the mini-bar and breakfast. The credit card is held for these but only charged if you use them.", answers: [
        { text: "The cost of the room itself", isCorrect: false }, { text: "Extra charges, like the mini-bar or breakfast", isCorrect: true }, { text: "An extra service fee", isCorrect: false }, { text: "The price of room service", isCorrect: false },
      ]},
      { prompt: 'Which phrase does the article suggest if your shower has no hot water?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'The article gives this exact phrasing: "I have no hot water in the shower." It is direct and specific.', answers: [
        { text: '"The shower is broken"', isCorrect: false }, { text: '"I have no hot water in the shower"', isCorrect: true }, { text: '"Send a plumber, please"', isCorrect: false }, { text: '"My room is cold"', isCorrect: false },
      ]},
      { prompt: "What button on the room phone connects you to the front desk?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'The button is labeled "0" or "Reception". Most hotel phones use one of these two markers.', answers: [
        { text: '"1" or "Manager"', isCorrect: false }, { text: '"0" or "Reception"', isCorrect: true }, { text: '"9" or "Outside line"', isCorrect: false }, { text: '"#" or "Help"', isCorrect: false },
      ]},
    ],
  },
  {
    title: "Listening: ordering food in a restaurant",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 6,
    sortOrder: 3,
    audioUrl: "tts:en-US",
    content: `Waiter: Good evening. Welcome to Bella Vita. Have you been with us before?

Customer: No, this is my first time. It looks lovely.

Waiter: Thank you. Can I get you something to drink while you look at the menu?

Customer: Yes, please. A glass of sparkling water with lemon.

Waiter: Of course. I will bring that right away. Take your time with the menu.

Customer: Actually, could you tell me about the soup of the day? It says "chef's choice."

Waiter: Tonight it is a roasted tomato and basil soup with a swirl of olive oil. It is very popular -- I would recommend it.

Customer: Wonderful. I will have the soup as a starter. And for the main course, I am looking at the sea bass. Could you tell me how it is prepared?

Waiter: The sea bass is grilled and served with seasonal vegetables and a lemon butter sauce. It comes with potatoes on the side.

Customer: Perfect. I will have the soup, then the sea bass.

Waiter: Excellent choice. The soup is six pounds fifty, and the sea bass is twenty-two pounds. Anything else?

Customer: Not for now. Thank you.

Waiter: I will put your order in. Your sparkling water will be here in just a moment.`,
    questions: [
      { prompt: "What does the customer order in total?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Sparkling water, soup as a starter, and sea bass as the main course -- that is one drink, one starter, and one main.", answers: [
        { text: "A starter and a drink", isCorrect: false }, { text: "A starter, a main course, and a drink", isCorrect: true }, { text: "Just a main course", isCorrect: false }, { text: "A starter, a main course, a drink, and dessert", isCorrect: false },
      ]},
      { prompt: "What does the waiter recommend?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'The soup of the day -- specifically the roasted tomato and basil. The waiter says "I would recommend it."', answers: [
        { text: "The soup of the day", isCorrect: true }, { text: "The fish", isCorrect: false }, { text: "The chef's special", isCorrect: false }, { text: "The wine list", isCorrect: false },
      ]},
      { prompt: "What does the waiter explain?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "How the sea bass is prepared. The waiter explains it is grilled, with seasonal vegetables, lemon butter sauce, and potatoes.", answers: [
        { text: "The wine list", isCorrect: false }, { text: "One item on the menu", isCorrect: true }, { text: "The opening hours", isCorrect: false }, { text: "The dessert menu", isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 4 */
  {
    title: "Asking for directions on the street",
    skill: "READING" as SkillType,
    estimatedMinutes: 7,
    sortOrder: 4,
    audioUrl: null,
    content: `Even with a phone full of maps, knowing how to ask for directions in English is an essential travel skill. The phone might be dead, the signal might be poor, or you might be looking for something the map does not show clearly.

The polite opening is "Excuse me." Always start with this. Then ask the question directly: "Could you help me find the train station?" or "Do you know where the museum is?" or simply "How do I get to Central Park?"

The answer will use a small set of phrases. "Go straight" means continue in the direction you are facing. "Turn left" or "turn right" change your direction at a corner. "Take the second left" means walk past the first turn on your left and take the next one. "It is on the corner of First Street and Main" tells you exactly where to look.

Distance is described in time or in blocks. "It is about five minutes on foot" gives you walking time. "It is two blocks away" tells you how many street crossings. In some cities the speaker may say "It is two streets up" or "across from the park."

If the directions are complicated, do not be afraid to ask for them again. A good phrase is: "Sorry, could you say that one more time? I want to make sure I got it." Most people are happy to repeat themselves.

Two phrases worth memorizing for emergencies: "I am lost" if you are confused about where you are, and "Where is the nearest..." (followed by what you need: pharmacy, taxi, restroom, police station). These phrases work even if the rest of your English is shaky.`,
    questions: [
      { prompt: 'What is the polite phrase to start with when asking strangers for directions?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: '"Excuse me" is the universal polite opener for getting a stranger\'s attention. The article says to "always start with this."', answers: [
        { text: "Hi there", isCorrect: false }, { text: "Excuse me", isCorrect: true }, { text: "Hello", isCorrect: false }, { text: "Sorry to bother you, but I really need to know", isCorrect: false },
      ]},
      { prompt: 'What does "Take the second left" mean?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'It means walk past the first turn on your left and take the next one. The article explains this exact phrase.', answers: [
        { text: "Turn left twice in a row", isCorrect: false }, { text: "Walk past the first turn on your left and take the next one", isCorrect: true }, { text: "Look for the second street and turn around", isCorrect: false }, { text: "The second street on the right", isCorrect: false },
      ]},
      { prompt: 'How is distance described in the article?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "In time (minutes on foot) or in blocks (number of street crossings). Both are common ways to describe distance.", answers: [
        { text: "Only in metres", isCorrect: false }, { text: "Only in number of streets", isCorrect: false }, { text: "In time on foot or in blocks", isCorrect: true }, { text: "In kilometres", isCorrect: false },
      ]},
      { prompt: 'Which phrase does the article suggest for emergencies if you are confused about where you are?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: '"I am lost" is the article\'s recommended emergency phrase -- it works even if the rest of your English is shaky.', answers: [
        { text: '"I do not know this city"', isCorrect: false }, { text: '"I am lost"', isCorrect: true }, { text: '"Help me please"', isCorrect: false }, { text: '"Where am I?"', isCorrect: false },
      ]},
    ],
  },
  /* NEW LESSON 5 */
  {
    title: "Listening: an emergency at the pharmacy",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 6,
    sortOrder: 5,
    audioUrl: "tts:en-US",
    content: `Customer: Excuse me, I need some help. I think I am having an allergic reaction.

Pharmacist: OK, take a breath. Tell me what is happening.

Customer: My face is itchy and I have red spots on my arms. I ate something at lunch -- I am not sure what was in it.

Pharmacist: Have you had any reaction like this before?

Customer: Once, a few years ago. I think it was peanuts.

Pharmacist: Are you having trouble breathing?

Customer: No, just itching and the spots. But it is getting worse.

Pharmacist: Right. This sounds like a mild allergic reaction. I am going to give you an antihistamine -- this is a tablet you can take right away. It should help in about thirty minutes. If your breathing becomes difficult, or your tongue or throat starts to swell, you must go to the hospital immediately. Do you understand?

Customer: Yes, I understand. The hospital if breathing changes.

Pharmacist: Exactly. Are you traveling alone? Is anyone with you?

Customer: My friend is at the hotel. She is just two blocks away.

Pharmacist: Good. After you take this, go back to your friend. Do not be alone for the next two hours. If anything changes, call the emergency number or go straight to the hospital. The nearest hospital is St. Mary's, ten minutes by taxi from here.

Customer: Thank you. How much is the medicine?

Pharmacist: Eight pounds. Pay at the counter.`,
    questions: [
      { prompt: "What symptoms is the customer experiencing?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Itchy face and red spots on the arms. The customer is not having trouble breathing yet, which the pharmacist confirms.", answers: [
        { text: "A high fever and chills", isCorrect: false }, { text: "An itchy face and red spots on the arms", isCorrect: true }, { text: "Difficulty breathing and chest pain", isCorrect: false }, { text: "A headache and nausea", isCorrect: false },
      ]},
      { prompt: "What does the pharmacist say to do if breathing becomes difficult?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'The pharmacist is explicit: go to the hospital immediately if breathing changes or the tongue or throat starts to swell.', answers: [
        { text: "Take another tablet", isCorrect: false }, { text: "Go to the hospital immediately", isCorrect: true }, { text: "Wait it out at home", isCorrect: false }, { text: "Call the pharmacy back", isCorrect: false },
      ]},
      { prompt: "Why does the pharmacist tell the customer not to be alone for two hours?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "In case the reaction worsens. Having someone nearby means help is available if breathing changes or the customer needs to get to the hospital fast.", answers: [
        { text: "Because the medicine has side effects", isCorrect: false }, { text: "Because the friend has to pay for the medicine", isCorrect: false }, { text: "In case the reaction worsens and they need help", isCorrect: true }, { text: "Because the pharmacy is closing", isCorrect: false },
      ]},
    ],
  },
];



/* ============================================================
   MATERIAL SET 4 -- B2 + BUSINESS
   Theme: professional English for client and partner contexts.
   Lessons cover negotiation, presentation, professional emails,
   and listening to high-stakes business conversations.
   ============================================================ */

const MS4_LESSONS = [
  {
    title: "The language of negotiation",
    skill: "READING" as SkillType,
    estimatedMinutes: 14,
    sortOrder: 1,
    audioUrl: null,
    content: `Negotiation in English follows a quiet pattern that most native speakers learn through experience rather than instruction. The pattern is simple: you signal flexibility before you make a request, and you protect the relationship even when the answer is no.

Compare two ways of asking for a discount. The first is direct: "We need ten percent off, or we will go to your competitor." The second is layered: "We are very keen to move forward with you, but the budget is tight at our end. Would there be any flexibility on price?" Both communicate the same need, but the second leaves room for a yes that does not feel like surrender. Skilled negotiators rarely use ultimatums in opening exchanges.

The key phrases of professional negotiation cluster into three groups. The first group hedges your position so you can move later: "We were thinking somewhere in the region of...", "I might be able to..." and "Subject to confirmation by my team..." all give you room to adjust without losing credibility. The second group protects the relationship: "I appreciate the position you are in", "I understand this is not straightforward", and "Whatever we agree, I want it to work for both sides." The third group closes deals without sounding pushy: "Where does that leave us?", "Can we meet halfway here?", and "What would it take to make this work?"

A common mistake is to over-apologise when refusing. "I am so, so sorry, but unfortunately we cannot possibly do that price" sounds weaker than "That price would be difficult for us, but here is what I could offer instead." The second version refuses cleanly and pivots to a constructive next step, which is what experienced negotiators always look for.

When the conversation reaches an impasse, silence is a powerful tool. Many junior negotiators rush to fill awkward pauses with concessions. The more experienced approach is to wait. If you have made a reasonable offer, let it sit. The other side will often move first.

Finally, always confirm what was agreed in writing within an hour of the call. Memory shifts, and a quick email that says "To confirm, we agreed on a discount of seven percent in exchange for a twenty-four-month commitment" prevents misunderstandings that would otherwise become disputes weeks later.`,
    questions: [
      { prompt: "According to the article, what do skilled negotiators rarely use in opening exchanges?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The article explicitly says skilled negotiators rarely use ultimatums in opening exchanges. The first example in the article is given as the version to avoid.", answers: [
        { text: "Hedging language", isCorrect: false }, { text: "Ultimatums", isCorrect: true }, { text: "Written confirmation", isCorrect: false }, { text: "Direct questions", isCorrect: false },
      ]},
      { prompt: 'Which phrase belongs to the group that "hedges your position so you can move later"?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'The article groups phrases like "We were thinking somewhere in the region of..." as hedges that leave room to adjust. The other options belong to relationship-protection or closing groups.', answers: [
        { text: "I appreciate the position you are in", isCorrect: false }, { text: "Where does that leave us?", isCorrect: false }, { text: "We were thinking somewhere in the region of...", isCorrect: true }, { text: "Can we meet halfway here?", isCorrect: false },
      ]},
      { prompt: "Why does the article warn against over-apologising when refusing?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'The article shows that excessive apology ("I am so, so sorry, but unfortunately we cannot possibly...") sounds weaker than a clean refusal followed by a constructive alternative.', answers: [
        { text: "It is rude to apologise repeatedly", isCorrect: false }, { text: "It sounds weaker than a clean refusal with an alternative", isCorrect: true }, { text: "It wastes the other side's time", isCorrect: false }, { text: "It signals that you are willing to reverse your position", isCorrect: false },
      ]},
      { prompt: "What does the article identify as a powerful tool when conversation reaches an impasse?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'Silence is named explicitly as a powerful tool. The article warns that junior negotiators rush to fill pauses with concessions, while experienced ones let a reasonable offer sit.', answers: [
        { text: "Repeating your position", isCorrect: false }, { text: "Suggesting a break", isCorrect: false }, { text: "Silence", isCorrect: true }, { text: "Bringing in a senior colleague", isCorrect: false },
      ]},
      { prompt: "What does the article recommend doing within an hour of a negotiation call?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "The closing recommendation is to confirm what was agreed in writing within an hour. The article gives an example email that prevents later disputes.", answers: [
        { text: "Calling the other side back to clarify", isCorrect: false }, { text: "Sending a written confirmation of what was agreed", isCorrect: true }, { text: "Briefing your manager on the outcome", isCorrect: false }, { text: "Drafting a formal contract", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Presenting an idea to executives",
    skill: "READING" as SkillType,
    estimatedMinutes: 12,
    sortOrder: 2,
    audioUrl: null,
    content: `Presenting to executives is different from presenting to peers. Executives have ten minutes for what your team had an hour to discuss. The structure that works for them is the inverted pyramid: the conclusion first, the evidence second, the detail last.

Open with the recommendation, not the background. "I am recommending we shift twenty percent of the engineering budget to mobile next quarter" is a strong opening line. "Today I want to talk about how mobile usage has been growing for some time and what that might mean for us in the coming period" is a weak one. The first sentence tells the reader what to do; the second one wanders.

After the recommendation, give the three reasons that support it. Three is the magic number for executive memory. One reason feels thin, two feels balanced but unremarkable, four starts to feel padded. Each reason should fit in a single sentence: "Mobile traffic now exceeds desktop by two-to-one. Conversion on mobile is half what it should be. Three of our top five competitors have shipped major mobile updates this year." Three sentences, three reasons, no slide needed.

Anticipate the question every executive will ask: what is the cost, what is the risk, and what happens if we do nothing? If you do not answer these without being asked, your audience will fill the silence with their own assumptions, which are usually worse than the truth. Build a slide titled "Risks and trade-offs" that lists the two or three things that could go wrong and how you would mitigate them. Confidence is not pretending nothing could fail; it is showing you have thought about what might.

Close with a clear ask. Vague closes ("Let me know what you think") force the executive to decide what to do next. Specific closes ("I would like to bring an updated proposal to next week's meeting with detailed staffing numbers") make it easy to say yes. The best closes are also low-risk for the executive: a small commitment now that opens the door to a bigger decision later.

One last warning: never read your slides. If your slide says "Mobile traffic exceeds desktop two-to-one", do not read those words aloud. Talk around the data point, give a story or example that brings it to life. Slides are visual aids, not scripts.`,
    questions: [
      { prompt: "What structure does the article recommend for presentations to executives?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "The inverted pyramid: conclusion first, evidence second, detail last. The article contrasts this with the more leisurely structure that works for peer audiences.", answers: [
        { text: "Background, problem, solution", isCorrect: false }, { text: "Inverted pyramid: conclusion, evidence, detail", isCorrect: true }, { text: "Story, lesson, action", isCorrect: false }, { text: "Question, answer, recap", isCorrect: false },
      ]},
      { prompt: "How many reasons does the article say to give in support of a recommendation?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "Three. The article explains: one reason feels thin, two feels balanced but unremarkable, four starts to feel padded.", answers: [
        { text: "Two", isCorrect: false }, { text: "Three", isCorrect: true }, { text: "Four or five", isCorrect: false }, { text: "As many as you can fit", isCorrect: false },
      ]},
      { prompt: "What three questions does the article say every executive will ask?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Cost, risk, and what happens if we do nothing. The article warns that if you do not answer these proactively, the audience will fill the silence with their own assumptions.", answers: [
        { text: "Who, what, when", isCorrect: false }, { text: "How long, how much, how confident", isCorrect: false }, { text: "Cost, risk, and what happens if we do nothing", isCorrect: true }, { text: "Why now, why us, why this approach", isCorrect: false },
      ]},
      { prompt: 'According to the article, what is wrong with closing a presentation with "Let me know what you think"?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "It forces the executive to decide what to do next. The article calls this a vague close and contrasts it with specific closes that make a yes easy.", answers: [
        { text: "It sounds informal", isCorrect: false }, { text: "It forces the executive to decide what to do next", isCorrect: true }, { text: "It does not invite questions", isCorrect: false }, { text: "It is grammatically incorrect", isCorrect: false },
      ]},
      { prompt: "What does the article warn against doing with slides during a presentation?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "Never read your slides aloud word-for-word. The article advises talking around the data point with stories or examples that bring it to life.", answers: [
        { text: "Using too many of them", isCorrect: false }, { text: "Reading them word-for-word", isCorrect: true }, { text: "Showing them on a small screen", isCorrect: false }, { text: "Including charts", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Writing professional emails that get replies",
    skill: "READING" as SkillType,
    estimatedMinutes: 11,
    sortOrder: 3,
    audioUrl: null,
    content: `A senior partner at a consulting firm once told a junior colleague: "If your email needs to be read twice, you have written it badly." Professional emails compete with hundreds of others for the same five seconds of attention. The ones that get answered share three qualities: they are scannable, they are specific, and they make the next action obvious.

Scannable emails use short paragraphs of two or three sentences. They put any list of items as actual bullet points, not as a comma-separated string buried in prose. They use bold sparingly, but they do use it, especially for deadlines and the names of attached documents. A reader who has thirty seconds for your email should be able to extract the three things they need to know without reading every word.

Specific emails replace vague phrases with concrete ones. "Soon" becomes "by Thursday afternoon". "The team" becomes "Sarah and Marco". "More information" becomes "the Q3 revenue figures and the updated project plan". Vagueness invites delay because it gives the reader an excuse to put the email aside until they have the time to figure out what is being asked.

The third quality, making the next action obvious, is the one most emails miss. End every email that needs a response with a single, specific request: "Could you confirm by Wednesday whether you can attend?" or "Please reply with the contract version you would like us to use." If your email contains three different requests, list them as three numbered items, not as a flowing paragraph that hides the third request behind the first two.

Two specific phrases save replies that otherwise would not happen. "I appreciate this is a busy week" gives the reader permission to delay without ignoring you. "If I do not hear back by Friday, I will assume you are happy for me to proceed with option A" gives the reader the option of silence as a yes, which is sometimes faster than typing a reply.

Finally, leave seventy-five percent of your emails unsent until the next morning. Late-night emails read more emotionally than they were meant to, and a colleague who is trying to switch off does not appreciate seeing your name in their inbox at midnight. Professional polish is partly a question of timing.`,
    questions: [
      { prompt: 'What three qualities, according to the article, do emails that get replies share?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'Scannable, specific, and they make the next action obvious. The article structures the rest of its argument around these three qualities.', answers: [
        { text: "Short, polite, and detailed", isCorrect: false }, { text: "Scannable, specific, and they make the next action obvious", isCorrect: true }, { text: "Friendly, professional, and confidential", isCorrect: false }, { text: "Direct, formal, and well-formatted", isCorrect: false },
      ]},
      { prompt: 'According to the article, why is "Soon" a problem in professional emails?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'The article uses "soon" as the example of vagueness that invites delay -- it gives the reader an excuse to put the email aside.', answers: [
        { text: "It is too informal", isCorrect: false }, { text: "It gives the reader an excuse to delay", isCorrect: true }, { text: "It implies pressure", isCorrect: false }, { text: "It is grammatically incorrect", isCorrect: false },
      ]},
      { prompt: 'What does the article suggest doing with three different requests in one email?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "List them as three numbered items, not as a flowing paragraph. The article warns that prose can hide the third request behind the first two.", answers: [
        { text: "Send three separate emails", isCorrect: false }, { text: "Combine them into one paragraph for brevity", isCorrect: false }, { text: "List them as three numbered items", isCorrect: true }, { text: "Mention only the most urgent one", isCorrect: false },
      ]},
      { prompt: 'What does the phrase "If I do not hear back by Friday, I will assume you are happy for me to proceed with option A" achieve?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "It gives the reader the option of silence as a yes -- sometimes faster than typing a reply, as the article notes.", answers: [
        { text: "It pressures the reader to respond before Friday", isCorrect: false }, { text: "It gives the reader the option of silence as a yes", isCorrect: true }, { text: "It avoids committing you to option A", isCorrect: false }, { text: "It signals you are about to give up on the conversation", isCorrect: false },
      ]},
      { prompt: "What advice does the article give about late-night emails?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "Leave seventy-five percent of them unsent until the next morning. The article notes that late-night emails read more emotionally than they were meant to, and disturb colleagues who are trying to switch off.", answers: [
        { text: "Send them early so they appear urgent", isCorrect: false }, { text: "Leave most of them unsent until the next morning", isCorrect: true }, { text: "Mark them as low-priority", isCorrect: false }, { text: "Always include an apology for the late hour", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: a contract negotiation call",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 9,
    sortOrder: 4,
    audioUrl: null,
    content: `Two professionals on a video call. Maya is from a software vendor; Robert is the procurement lead at a buyer firm. They are negotiating a one-year licence renewal.

MAYA: Robert, thanks for making the time. I know you are juggling a lot this quarter.

ROBERT: No problem, Maya. Look, before we go through the proposal, I want to be upfront. The number you sent is about fifteen percent above what our finance team has approved.

MAYA: Right. I appreciate you saying that directly. Can I ask: is the gap mostly the licence cost, or is it the support package on top?

ROBERT: It is mostly the licence side. The support package looks fair. But we are being asked to find savings everywhere this year, and your renewal is one of the bigger line items.

MAYA: Understood. Look, I cannot move the headline price by fifteen percent on its own. But there might be ways to find that gap together. Would you have any flexibility on the contract length? If we went to twenty-four months instead of twelve, that would let me unlock a different pricing tier.

ROBERT: I might be able to. I would need to take that to my CFO, but a longer commitment is something he has signalled he is comfortable with for tools the engineering team genuinely uses. Could you put together two options for me, one at twelve months and one at twenty-four, so we can compare?

MAYA: Yes, of course. I will have those over to you by Wednesday. One more thing -- if we go with the twenty-four-month option, I can also include the new analytics module at no extra cost for the first year. That would normally be twelve thousand on top.

ROBERT: That is helpful. The analytics piece has actually been on our wishlist. Send the two options over and I will come back to you by Friday with where we stand.

MAYA: Sounds good. Thanks, Robert. Whatever we agree, I want it to work for both sides.`,
    questions: [
      { prompt: "How is the gap between the proposal and Robert's approved budget described?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'Robert says the number is "about fifteen percent above" what finance has approved. He raises the gap upfront before discussing the proposal.', answers: [
        { text: "About five percent above the approved budget", isCorrect: false }, { text: "About fifteen percent above the approved budget", isCorrect: true }, { text: "Below what finance had approved", isCorrect: false }, { text: "Exactly at the approved budget", isCorrect: false },
      ]},
      { prompt: "What does Maya offer to do in exchange for a longer contract?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "She offers to unlock a different pricing tier. She also adds the analytics module at no extra cost as a sweetener for the twenty-four-month option.", answers: [
        { text: "Drop the support package", isCorrect: false }, { text: "Unlock a different pricing tier", isCorrect: true }, { text: "Bring in a senior account manager", isCorrect: false }, { text: "Wait for the CFO's approval", isCorrect: false },
      ]},
      { prompt: "What deliverable does Maya commit to by Wednesday?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Two options: one at twelve months and one at twenty-four months, so Robert can compare. Robert says he will respond by Friday.", answers: [
        { text: "A new draft contract", isCorrect: false }, { text: "Two pricing options for different contract lengths", isCorrect: true }, { text: "A discount approval from her manager", isCorrect: false }, { text: "A demo of the analytics module", isCorrect: false },
      ]},
      { prompt: 'Which phrase does Maya use to protect the relationship at the end of the call?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: '"Whatever we agree, I want it to work for both sides" is the relationship-protective close. It signals she is not pushing a one-sided outcome.', answers: [
        { text: "Whatever we agree, I want it to work for both sides", isCorrect: true }, { text: "Trust me on this one", isCorrect: false }, { text: "We need to close this by Friday", isCorrect: false }, { text: "I cannot go any lower than this", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: an internal earnings briefing",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 10,
    sortOrder: 5,
    audioUrl: null,
    content: `An internal call between a finance director, James, and a sales lead, Aisha. They are reviewing the quarter ahead of the earnings call to investors.

JAMES: Aisha, I have the draft numbers. Before I send them up to the CFO, I wanted to walk you through what they show and check the narrative with you.

AISHA: Please do. What are we looking at?

JAMES: Top-line growth came in at nine percent year-on-year, which is below the twelve we guided to in March. North America was the drag. Europe and Asia both beat their targets, but North America landed at four percent against an eight percent plan.

AISHA: That tracks. We had two accounts in North America push their renewals into next quarter. Both are confirmed; they just slipped on the calendar.

JAMES: That is helpful context. I will note that in the speaker notes for the CFO. The other concern is gross margin. We came in at sixty-one percent against a sixty-three percent target. Cloud infrastructure costs went up more than we modelled.

AISHA: Yes. We agreed to absorb that for the existing customer base rather than pass it on as a price increase mid-contract. That was a sales decision, but it was the right one.

JAMES: I agree. We will frame that as a deliberate retention investment. The market will accept that explanation if we show evidence the customer churn rate stayed flat.

AISHA: Churn was actually slightly down quarter-on-quarter. I will pull the exact number for the slide.

JAMES: Perfect. One more thing -- the analyst expectations for next quarter. Are you comfortable with the twelve to fourteen percent growth range?

AISHA: I am comfortable with twelve. Fourteen would require both delayed renewals to close and a strong start in Asia. I would rather under-promise and beat the number than guide high and miss again.

JAMES: Wise. Let us go out at twelve to thirteen. Send me the churn figure by end of day and I will integrate it into the deck.`,
    questions: [
      { prompt: "What was the year-on-year top-line growth for the quarter?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "James says nine percent. The company had guided to twelve, so this is a miss against guidance.", answers: [
        { text: "Twelve percent", isCorrect: false }, { text: "Nine percent", isCorrect: true }, { text: "Four percent", isCorrect: false }, { text: "Sixty-one percent", isCorrect: false },
      ]},
      { prompt: "What region was the main drag on revenue?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "North America landed at four percent against an eight percent plan. Europe and Asia beat their targets.", answers: [
        { text: "Europe", isCorrect: false }, { text: "Asia", isCorrect: false }, { text: "North America", isCorrect: true }, { text: "All three regions equally", isCorrect: false },
      ]},
      { prompt: "Why did gross margin come in below target?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Cloud infrastructure costs went up more than was modelled, and sales chose to absorb the cost rather than pass it on to existing customers.", answers: [
        { text: "Cloud infrastructure costs were higher than modelled", isCorrect: true }, { text: "Sales discounts increased", isCorrect: false }, { text: "Headcount grew unexpectedly", isCorrect: false }, { text: "Currency exchange rates worked against the company", isCorrect: false },
      ]},
      { prompt: "Why does Aisha want to guide twelve rather than fourteen percent for next quarter?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "She prefers to under-promise and beat the number rather than guide high and miss again. Fourteen would require both delayed renewals to close and a strong Asia start.", answers: [
        { text: "She is not confident the team can deliver more than twelve", isCorrect: false }, { text: "She wants to under-promise and beat the number rather than miss again", isCorrect: true }, { text: "Investors prefer lower numbers", isCorrect: false }, { text: "Twelve is the maximum the CFO will accept", isCorrect: false },
      ]},
      { prompt: "How do James and Aisha plan to frame the gross margin miss?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'They will frame it as a deliberate retention investment, supported by evidence that customer churn stayed flat -- which Aisha confirms was actually slightly down.', answers: [
        { text: "As a one-time accounting change", isCorrect: false }, { text: "As a deliberate retention investment, supported by flat churn", isCorrect: true }, { text: "As an industry-wide cost trend they could not avoid", isCorrect: false }, { text: "They will avoid mentioning it in the briefing", isCorrect: false },
      ]},
    ],
  },
];


const MS4_WRITING = [
  {
    title: "Pitch email to a prospective client",
    prompt: `Write an email to a prospective client introducing your company's services. The client is the head of operations at a mid-sized logistics company you met briefly at a conference last month. Your goal is to secure a thirty-minute discovery call.

Your email should:
- Reference where you met
- Briefly explain what your company does (one sentence)
- Suggest two specific times for a call next week
- End with a clear, low-pressure ask

Keep your email professional but warm. Aim for 150-200 words. Use the language of negotiation and email writing covered in the lessons -- specific, scannable, and with an obvious next action.`,
    minWords: 120,
    maxWords: 250,
    rubricMode: "EMAIL" as RubricMode,
    sortOrder: 1,
  },
  {
    title: "Project status update to leadership",
    prompt: `Write a project status update email to your VP of Engineering. Your project is two weeks behind schedule because of a vendor dependency, but the team has identified a workaround that recovers one week. You need approval to spend an additional fifteen thousand dollars on contractor hours to recover the second week.

Your email should:
- Open with the recommendation, not the background
- Give three reasons supporting the spend
- Address the obvious risks
- Close with a specific ask

Aim for 200-275 words. The VP has ten minutes for this email -- make it scannable, specific, and decision-ready. Use the inverted pyramid structure from the executive presentation lesson.`,
    minWords: 175,
    maxWords: 325,
    rubricMode: "EMAIL" as RubricMode,
    sortOrder: 2,
  },
];


/* ============================================================
   MATERIAL SET 5 -- A2 + JOB
   Theme: workplace English for early-career or new-arrival
   workers. Language is kept simple: short sentences, common
   verbs, lots of present tense. Lessons cover the everyday
   moments that A2 learners struggle with most: introducing
   themselves, asking for help, and basic phone calls.
   ============================================================ */

const MS5_LESSONS = [
  {
    title: "Introducing yourself at a new job",
    skill: "READING" as SkillType,
    estimatedMinutes: 9,
    sortOrder: 1,
    audioUrl: null,
    content: `On your first day at a new job, you will meet many new people. You do not need to remember every name. You only need to make a good first impression.

A good introduction has three parts. First, you say your name. Second, you say what your job is. Third, you say something friendly. For example: "Hi, I am Layla. I am the new accountant. It is nice to meet you."

You do not need to say a lot. Two or three sentences is enough. If you say too much on the first day, people will forget what you said.

When someone introduces themselves to you, listen carefully to their name. Then say it back. "Hi, John. Nice to meet you." This helps you remember the name. It also makes the other person feel you are paying attention.

If you forget a name later, do not panic. You can say: "I am sorry, I have met so many people today. Can you tell me your name again?" Most people understand. The first day at a new job is busy, and everyone has been the new person before.

Some questions are common on the first day. People will ask you: "Where are you from?" or "Is this your first job here?" or "How are you finding it so far?" You can prepare short answers for these questions before your first day. A short answer is better than a long one. Save the longer answers for later, when you know the person better.

One last tip. At lunch on the first day, do not eat alone if you can avoid it. Ask a colleague where they usually go for lunch. Many work friendships start in the lunch room.`,
    questions: [
      { prompt: "How many parts does a good introduction have, according to the article?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'Three parts: your name, your job, and something friendly. The article gives the example: "Hi, I am Layla. I am the new accountant. It is nice to meet you."', answers: [
        { text: "Two parts", isCorrect: false }, { text: "Three parts", isCorrect: true }, { text: "Four parts", isCorrect: false }, { text: "Five parts", isCorrect: false },
      ]},
      { prompt: "What does the article say to do when someone tells you their name?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'Say their name back. The article gives the example "Hi, John. Nice to meet you" and explains this helps you remember and shows you are paying attention.', answers: [
        { text: "Write it down on paper", isCorrect: false }, { text: "Say their name back", isCorrect: true }, { text: "Ask them to spell it", isCorrect: false }, { text: "Smile and say nothing", isCorrect: false },
      ]},
      { prompt: "If you forget a name, what does the article suggest you can say?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'The article gives this exact phrase: "I am sorry, I have met so many people today. Can you tell me your name again?" It also says that most people understand because everyone has been the new person before.', answers: [
        { text: "I am bad with names", isCorrect: false }, { text: "I will remember next time", isCorrect: false }, { text: "Can you tell me your name again?", isCorrect: true }, { text: "Just smile and walk away", isCorrect: false },
      ]},
      { prompt: "Why does the article suggest preparing short answers before your first day?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "Because short answers are better than long ones on the first day. The article says you can save longer answers for later, when you know the person better.", answers: [
        { text: "Short answers are easier to translate", isCorrect: false }, { text: "Short answers are better on the first day", isCorrect: true }, { text: "Long answers sound rude in English", isCorrect: false }, { text: "Your manager will give you a script", isCorrect: false },
      ]},
      { prompt: "What lunch advice does the article give for the first day?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: "Do not eat alone if you can avoid it. The article suggests asking a colleague where they usually go for lunch and notes that many work friendships start in the lunch room.", answers: [
        { text: "Eat at your desk to save time", isCorrect: false }, { text: "Bring food from home for the first week", isCorrect: false }, { text: "Try not to eat alone", isCorrect: true }, { text: "Always go to the most expensive restaurant", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Asking for help when you do not understand",
    skill: "READING" as SkillType,
    estimatedMinutes: 8,
    sortOrder: 2,
    audioUrl: null,
    content: `Asking for help at work is normal. New colleagues do it. Old colleagues do it. Even your manager does it. The mistake is not asking. The mistake is staying quiet and doing the work wrong.

There is one important rule: ask early. If your manager gives you a task on Monday morning and you do not understand it, ask before lunch. Do not wait until Friday afternoon. By Friday, your manager has moved on to other things, and your task may already be late.

Here are three useful sentences. Practice them so they come naturally.

The first sentence is for when you do not understand at all. "I am sorry, I do not understand. Can you explain again, please?" This is polite and clear. It is much better than nodding and pretending you understand.

The second sentence is for when you understand part of the task but not all of it. "I understand the first part, but I am not sure about the second part. Can you show me?" This shows you are listening. It also makes the conversation shorter, because your colleague does not need to repeat the part you already know.

The third sentence is for when you have tried something and it is not working. "I tried to do this, but it did not work. Can you check what I did?" This is a strong sentence. It shows you tried. It is not lazy to ask after you have tried.

Some people are afraid to ask because they do not want to look stupid. But asking is not stupid. Doing the work wrong because you did not ask is more of a problem. A good colleague would rather answer your question for two minutes than fix your mistake for two hours.

One more tip. After your colleague helps you, say "thank you" clearly. A simple "Thank you, that really helps" goes a long way.`,
    questions: [
      { prompt: "What is the most important rule about asking for help, according to the article?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'Ask early. The article says if your manager gives you a task on Monday morning, ask before lunch -- not on Friday afternoon.', answers: [
        { text: "Ask only your manager, not other colleagues", isCorrect: false }, { text: "Ask early", isCorrect: true }, { text: "Ask in writing, not in person", isCorrect: false }, { text: "Ask only at the end of the week", isCorrect: false },
      ]},
      { prompt: 'Which sentence is for when you do not understand at all?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: '"I am sorry, I do not understand. Can you explain again, please?" The article gives this as the first useful sentence and calls it polite and clear.', answers: [
        { text: "I tried to do this, but it did not work.", isCorrect: false }, { text: "I am sorry, I do not understand. Can you explain again, please?", isCorrect: true }, { text: "I understand the first part, but I am not sure about the second part.", isCorrect: false }, { text: "Can you do this for me?", isCorrect: false },
      ]},
      { prompt: 'According to the article, what is the benefit of saying "I understand the first part, but I am not sure about the second part"?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "It makes the conversation shorter because your colleague does not need to repeat the part you already know. It also shows you are listening.", answers: [
        { text: "It makes you sound more intelligent", isCorrect: false }, { text: "It avoids embarrassment", isCorrect: false }, { text: "It makes the conversation shorter", isCorrect: true }, { text: "It is more polite than asking from the start", isCorrect: false },
      ]},
      { prompt: "Why does the article say doing the work wrong is more of a problem than asking?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'The article puts it directly: "A good colleague would rather answer your question for two minutes than fix your mistake for two hours."', answers: [
        { text: "Because mistakes make managers angry", isCorrect: false }, { text: "Because a two-minute answer is better than a two-hour fix", isCorrect: true }, { text: "Because you might lose your job", isCorrect: false }, { text: "Because it makes others look bad", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Requesting time off from work",
    skill: "READING" as SkillType,
    estimatedMinutes: 9,
    sortOrder: 3,
    audioUrl: null,
    content: `At some point, you will need time off from work. Maybe for a holiday. Maybe for a doctor visit. Maybe for a family event. The good news is that asking for time off is simple if you follow a clear pattern.

The most important thing is to ask early. If you want one day off, ask one or two weeks before. If you want a full week off, ask one or two months before. This gives your manager time to plan. It also shows that you respect the team.

Most companies have rules about how to ask. Some companies use a system on the computer. Some companies want a written email. Some companies allow you to ask in person and then confirm by email. On your first week at a new job, ask a colleague what the system is. They will know.

If you write an email, the structure is simple. State what you need, when you need it, and why if it is appropriate. For a normal holiday, you do not have to give a reason. For an unexpected day off, a short reason is helpful.

Here is an example email:

"Hi Sarah,
I would like to request time off from Monday the 15th to Friday the 19th of June. This is for a family holiday. Please let me know if this works.
Thank you,
Layla"

Notice the email is short. It is polite. It gives all the dates. It says why, but only briefly.

One important detail: do not book your flights or hotels until your manager has said yes. Sometimes the dates do not work for the team, and you may need to change. If you have already paid for the trip, this becomes a problem.

After your manager approves the dates, send a short thank-you reply. "Thank you, Sarah. I will set up an out-of-office email before I go." This last sentence is important. It tells your manager you are thinking about how to cover your work while you are away.`,
    questions: [
      { prompt: "How early does the article suggest asking for one full week off?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "One or two months before. The article distinguishes between one or two weeks for a single day off, and one or two months for a full week.", answers: [
        { text: "One or two weeks before", isCorrect: false }, { text: "One or two months before", isCorrect: true }, { text: "Three days before", isCorrect: false }, { text: "On the day", isCorrect: false },
      ]},
      { prompt: "According to the article, when do you have to give a reason for time off?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "For an unexpected day off, a short reason is helpful. For a normal holiday, you do not have to give a reason.", answers: [
        { text: "Always", isCorrect: false }, { text: "Never", isCorrect: false }, { text: "For unexpected time off, a short reason is helpful", isCorrect: true }, { text: "Only when your manager asks", isCorrect: false },
      ]},
      { prompt: "What does the article warn against doing before your manager approves?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Do not book flights or hotels until your manager has said yes. The article notes that sometimes the dates do not work and you may need to change.", answers: [
        { text: "Tell your colleagues", isCorrect: false }, { text: "Book flights or hotels", isCorrect: true }, { text: "Set up an out-of-office email", isCorrect: false }, { text: "Apply for a passport", isCorrect: false },
      ]},
      { prompt: 'Why does the article suggest mentioning the out-of-office email in your thank-you reply?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "It tells your manager you are thinking about how to cover your work while you are away.", answers: [
        { text: "It is a legal requirement", isCorrect: false }, { text: "It tells your manager you are thinking about coverage while away", isCorrect: true }, { text: "It is required by HR rules", isCorrect: false }, { text: "It avoids paying for the time off", isCorrect: false },
      ]},
      { prompt: 'In the example email, what does Layla include as a reason for the time off?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'A family holiday. The article shows this as the kind of brief reason that is helpful but not required.', answers: [
        { text: "Doctor appointment", isCorrect: false }, { text: "Family holiday", isCorrect: true }, { text: "Personal study", isCorrect: false }, { text: "She does not give a reason", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: a quick team meeting",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 8,
    sortOrder: 4,
    audioUrl: null,
    content: `A short team meeting on a Monday morning. Three people: Maya is the manager, Tomas and Aisha work on her team.

MAYA: Good morning, everyone. Quick standup. I just need updates on what you are working on this week. Tomas, you start.

TOMAS: Good morning. This week I am finishing the customer report from last week. I should be done by Wednesday. After that, I will start on the new project for the sales team.

MAYA: Great. The sales team is asking when you can start. Can you tell them Thursday?

TOMAS: Yes, Thursday is fine.

MAYA: Perfect. Aisha, your turn.

AISHA: Hi everyone. I am still working on the data review. There is more data than I expected. I do not think I will finish this week. Maybe by next Tuesday.

MAYA: Okay, that is fine. Do you need help?

AISHA: I think I am okay alone. But thank you.

MAYA: All right. If anything changes, let me know. I would rather know early.

AISHA: Of course.

MAYA: One more thing. The office will be closed next Friday for a public holiday. So please plan your work for Monday to Thursday. If you need to take Thursday off, we can connect to long weekend.

TOMAS: Oh good, I will take Thursday off then.

AISHA: Same for me.

MAYA: Great. Can you both send me the request by Wednesday so I can confirm? Thank you, everyone. Have a good week.`,
    questions: [
      { prompt: "When will Tomas finish the customer report?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Wednesday. He says he should be done by Wednesday and will start the sales project after that.", answers: [
        { text: "Monday", isCorrect: false }, { text: "Tuesday", isCorrect: false }, { text: "Wednesday", isCorrect: true }, { text: "Friday", isCorrect: false },
      ]},
      { prompt: "Why is Aisha's data review taking longer than expected?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'There is more data than she expected. She thinks she will finish by next Tuesday rather than this week.', answers: [
        { text: "She is sick", isCorrect: false }, { text: "There is more data than expected", isCorrect: true }, { text: "She lost some files", isCorrect: false }, { text: "Her computer is broken", isCorrect: false },
      ]},
      { prompt: "Does Aisha want help with the data review?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'No -- she says she thinks she is okay alone but thanks Maya for asking.', answers: [
        { text: "Yes, she wants help", isCorrect: false }, { text: "No, she is okay alone", isCorrect: true }, { text: "Only if Tomas is free", isCorrect: false }, { text: "Only on Friday", isCorrect: false },
      ]},
      { prompt: "Why is the office closed next Friday?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'A public holiday. Maya tells the team to plan their work for Monday to Thursday because of it.', answers: [
        { text: "A public holiday", isCorrect: true }, { text: "An office repair", isCorrect: false }, { text: "A team training day", isCorrect: false }, { text: "An IT system update", isCorrect: false },
      ]},
      { prompt: "What does Maya ask Tomas and Aisha to send her by Wednesday?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'A request for Thursday off, so she can confirm the long weekend.', answers: [
        { text: "Their final reports", isCorrect: false }, { text: "Their time-off request for Thursday", isCorrect: true }, { text: "A list of meetings for next week", isCorrect: false }, { text: "An update on the sales project", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: a phone call from a colleague",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 7,
    sortOrder: 5,
    audioUrl: null,
    content: `A short phone call. Layla works in the office. Her colleague Marco is calling from a client visit outside.

LAYLA: Hello, this is Layla speaking.

MARCO: Hi Layla, it is Marco. I am at the client office now. I have a small problem. Are you free for two minutes?

LAYLA: Yes, of course. What is happening?

MARCO: I forgot to bring the printed contract. It is on my desk. Can you check if it is there?

LAYLA: Yes, hold on. I am walking to your desk now. Okay, I am here. I see two papers. One is the contract. The other one is a meeting note.

MARCO: Perfect. Can you take a photo of the contract and send it to my phone? The client just needs to see the numbers, not the original. I can show them the photo.

LAYLA: Yes, no problem. Which page do they need?

MARCO: All four pages, please.

LAYLA: Okay. I will send them now. Anything else?

MARCO: One more thing. The meeting is going longer than I thought. I will not be back to the office until five. If anyone calls for me, can you take a message?

LAYLA: Yes, of course. Five o'clock, no problem. I will write down any messages.

MARCO: Thank you, Layla. You really helped me. I will buy you coffee tomorrow.

LAYLA: That is not necessary, but thank you. Good luck with the meeting.

MARCO: Thanks. Bye.`,
    questions: [
      { prompt: "What does Marco need from his desk?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'The printed contract. He forgot to bring it to the client meeting.', answers: [
        { text: "His phone charger", isCorrect: false }, { text: "The printed contract", isCorrect: true }, { text: "His laptop", isCorrect: false }, { text: "A meeting note", isCorrect: false },
      ]},
      { prompt: "What does Layla see on Marco's desk?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'Two papers: the contract and a meeting note. She tells Marco both items are there.', answers: [
        { text: "Only the contract", isCorrect: false }, { text: "Two papers: the contract and a meeting note", isCorrect: true }, { text: "Three different files", isCorrect: false }, { text: "Nothing", isCorrect: false },
      ]},
      { prompt: "How many pages of the contract does Marco need?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'All four pages. Marco asks Layla to take photos of all four.', answers: [
        { text: "Just the first page", isCorrect: false }, { text: "Two pages", isCorrect: false }, { text: "All four pages", isCorrect: true }, { text: "Only the page with signatures", isCorrect: false },
      ]},
      { prompt: "When will Marco be back at the office?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'Five o\'clock. The meeting is going longer than he thought.', answers: [
        { text: "Three o'clock", isCorrect: false }, { text: "Four o'clock", isCorrect: false }, { text: "Five o'clock", isCorrect: true }, { text: "He will not return today", isCorrect: false },
      ]},
    ],
  },
];


const MS5_WRITING = [
  {
    title: "Email asking for time off",
    prompt: `Write a short email to your manager (Sarah) asking for two days off next month. The dates are Monday the 14th and Tuesday the 15th. The reason is a family wedding.

Your email should:
- Greet your manager
- Ask for the time off
- Give the dates clearly
- Give a short reason
- Thank your manager and end politely

Aim for 60-100 words. Keep your sentences simple. Use the structure from the time-off lesson.`,
    minWords: 50,
    maxWords: 130,
    rubricMode: "EMAIL" as RubricMode,
    sortOrder: 1,
  },
  {
    title: "Voicemail message script",
    prompt: `Write a short voicemail script (something you would say if you called a colleague and they did not answer). You are calling your colleague Daniel about a meeting tomorrow at 10 AM. You need to ask if he can come thirty minutes early to prepare.

Your message should:
- Say who is calling
- Say why you are calling
- Give the question clearly
- Ask Daniel to call you back

Aim for 50-80 words. Keep it simple and clear -- the listener will hear it once and may not be able to replay it.`,
    minWords: 40,
    maxWords: 110,
    rubricMode: "GENERAL" as RubricMode,
    sortOrder: 2,
  },
];


/* ============================================================
   MATERIAL SET 6 -- B1 + TRAVEL
   Theme: practical English for intermediate travellers. Beyond
   the basics of A2 travel: the lessons cover what to do when
   things go wrong, how to ask for recommendations, and how to
   navigate situations that need negotiation rather than just
   transactional language.
   ============================================================ */

const MS6_LESSONS = [
  {
    title: "Booking accommodation that matches what you need",
    skill: "READING" as SkillType,
    estimatedMinutes: 11,
    sortOrder: 1,
    audioUrl: null,
    content: `Every hotel website tells you the same things: how many stars, how many beds, how many breakfast items in the buffet. What they do not tell you is whether the hotel is right for the kind of trip you are taking. That gap is what experienced travellers learn to fill in for themselves.

The first question to answer is what your trip actually needs. A weekend in a city for sightseeing is different from a week of business meetings, which is different again from a quiet break with family. A hotel that is perfect for one of these can be wrong for another. A central hotel near the museums is great for a tourist but may be too noisy for a family with young children. A modern business hotel near the airport is convenient for meetings but a long way from anywhere interesting if you are visiting on holiday.

Read the recent reviews, not the old ones. Reviews from three years ago tell you about a different hotel. Look for reviews from the last six months, especially ones that describe a trip similar to yours. A review by a family of four who stayed for five days will be more useful to you than a review by a single business traveller who stayed for one night, if your trip is closer to the first.

Pay attention to what reviewers complain about, not just what they praise. Most hotels will get praised for being clean and friendly. The complaints are where you learn the real story. Repeated complaints about thin walls, weak Wi-Fi, or rude staff at the front desk are warning signs. One angry review can be ignored. Five complaints about the same thing usually means the problem is real.

Pictures lie. Hotel photographers are paid to make a small room look spacious. Look at the room measurements in square meters if they are listed. A room that is fifteen square meters is small. Twenty-five is normal. Thirty-five is generous. Numbers do not lie the way photos do.

Finally, contact the hotel directly before you book if you have specific needs. If you need a quiet floor, ask. If you need a late check-out, ask. Hotels can usually accommodate small requests if they know in advance, and the email exchange tells you something about their service quality before you even arrive.`,
    questions: [
      { prompt: "According to the article, what is the first question to ask when booking accommodation?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'What your trip actually needs. The article says different trips suit different hotels and lists three contrasting examples: city sightseeing, business meetings, and family breaks.', answers: [
        { text: "How many stars the hotel has", isCorrect: false }, { text: "What your trip actually needs", isCorrect: true }, { text: "Whether the hotel has free breakfast", isCorrect: false }, { text: "What other tourists recommend on social media", isCorrect: false },
      ]},
      { prompt: "How recent should the reviews you read ideally be?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: "From the last six months. Reviews from three years ago tell you about a different hotel.", answers: [
        { text: "From the last week", isCorrect: false }, { text: "From the last six months", isCorrect: true }, { text: "From the last three years", isCorrect: false }, { text: "Any time period is fine", isCorrect: false },
      ]},
      { prompt: 'What does the article say is the better signal in reviews?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Repeated complaints. The article notes that one angry review can be ignored, but five complaints about the same thing (thin walls, weak Wi-Fi, rude staff) usually means the problem is real.", answers: [
        { text: "Reviews that mention the breakfast", isCorrect: false }, { text: "Reviews from past celebrities", isCorrect: false }, { text: "Repeated complaints about the same problem", isCorrect: true }, { text: "Reviews longer than 500 words", isCorrect: false },
      ]},
      { prompt: 'According to the article, what room size in square meters is described as "normal"?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "Twenty-five square meters is described as normal. Fifteen is small, thirty-five is generous.", answers: [
        { text: "Fifteen square meters", isCorrect: false }, { text: "Twenty-five square meters", isCorrect: true }, { text: "Thirty-five square meters", isCorrect: false }, { text: "Forty square meters", isCorrect: false },
      ]},
      { prompt: "Why does the article suggest contacting the hotel directly with specific requests before booking?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'Two reasons: hotels can usually accommodate small requests if they know in advance, and the email exchange tells you something about service quality before you arrive.', answers: [
        { text: "It usually gets you a discount", isCorrect: false }, { text: "It tells you about service quality before you arrive", isCorrect: true }, { text: "It is required by booking websites", isCorrect: false }, { text: "It avoids the booking fee", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Dealing with delays and cancellations",
    skill: "READING" as SkillType,
    estimatedMinutes: 10,
    sortOrder: 2,
    audioUrl: null,
    content: `If you travel often enough, your flight will be delayed. Your train will be cancelled. Your bus will not show up. Travel is full of small disruptions, and the difference between a stressful trip and a manageable one usually comes down to how you handle them.

The first rule is to find out what is actually happening. Airlines and train companies often update their app or website before they update the announcement at the airport or station. If your phone says your flight is delayed by two hours but the screen at the airport still says "on time", trust your phone. The official announcement comes later because it has to be approved.

The second rule is to know your rights. In many countries, including most of Europe, you have legal rights when your flight is delayed. If the delay is more than three hours and the airline is responsible, you may be entitled to compensation. The airline will often not tell you this. You have to ask, or read the rules, or use one of the websites that handle the claim for you. Compensation is in addition to a free meal or hotel, not instead of it.

The third rule is to stay polite. The person at the desk did not cause the delay. The person at the desk also has authority to help you in ways their colleagues do not. The traveller who shouts at them gets the rebooking that the system suggests. The traveller who asks calmly, "I understand this is not your fault, but I really need to get to Madrid by tomorrow morning. What options do you have?" sometimes gets a creative solution that involves a different airline or a route through a third city.

Always have a backup plan in your head. If your flight is cancelled, what would you do? Stay overnight at the airport? Take a train to another nearby city and fly from there? Rebook for the next morning? Knowing the answer means you can act fast when others are still standing in the queue trying to think.

A small piece of practical advice: always travel with a phone charger and a snack. The two hours you might lose at an airport feel much shorter when your phone is at full battery and you are not hungry.`,
    questions: [
      { prompt: 'According to the article, what should you trust when your phone and the airport screen disagree?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: "Your phone. Airlines and train companies often update their app or website before they update the screens at the airport.", answers: [
        { text: "The airport screen", isCorrect: false }, { text: "Your phone", isCorrect: true }, { text: "Other passengers in the queue", isCorrect: false }, { text: "The first announcement you hear", isCorrect: false },
      ]},
      { prompt: 'In many countries, when may you be entitled to compensation for a flight delay?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'When the delay is more than three hours and the airline is responsible. The article notes that this is a legal right but airlines often will not tell you about it.', answers: [
        { text: "Any delay over thirty minutes", isCorrect: false }, { text: "Any delay over one hour", isCorrect: false }, { text: "Delays over three hours where the airline is responsible", isCorrect: true }, { text: "Only when the flight is cancelled completely", isCorrect: false },
      ]},
      { prompt: 'According to the article, why is it important to stay polite with airline staff?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: "Because the person at the desk has authority to help in creative ways their colleagues do not. Polite travellers sometimes get solutions involving a different airline or route, while travellers who shout get only what the system suggests.", answers: [
        { text: "The airline records who is rude and bans them", isCorrect: false }, { text: "Polite travellers sometimes get creative solutions that others do not", isCorrect: true }, { text: "It avoids legal trouble", isCorrect: false }, { text: "It is required by airline policy", isCorrect: false },
      ]},
      { prompt: 'What does the article say about having a backup plan?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: "Knowing the answer means you can act fast while others are still standing in the queue trying to think. Examples include staying at the airport, taking a train to another city, or rebooking for the next morning.", answers: [
        { text: "It is only useful for international flights", isCorrect: false }, { text: "It lets you act fast while others are still thinking", isCorrect: true }, { text: "It guarantees a free upgrade", isCorrect: false }, { text: "It is something only frequent travellers need", isCorrect: false },
      ]},
      { prompt: "What two practical items does the article recommend always travelling with?", type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'A phone charger and a snack. The article notes that two lost hours feel much shorter when your phone is at full battery and you are not hungry.', answers: [
        { text: "Headphones and a notebook", isCorrect: false }, { text: "A guidebook and a paper map", isCorrect: false }, { text: "A phone charger and a snack", isCorrect: true }, { text: "Cash and an extra passport photo", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Asking for recommendations like a local",
    skill: "READING" as SkillType,
    estimatedMinutes: 10,
    sortOrder: 3,
    audioUrl: null,
    content: `The best meals, the best museums, and the best small streets usually do not appear in the guidebooks. They appear in the heads of the people who actually live in the city. Learning to ask for recommendations the way locals do is one of the small skills that makes travel deeper.

The wrong question to ask is "What is the best restaurant in this city?" The person you are asking does not know what you mean by best. Best for value? Best for atmosphere? Best for special occasions? You have given them no information to work with, so they will give you the safe answer: a famous tourist place that everyone agrees is good but is also crowded and expensive.

A better question is specific. "I am here for three days. I love seafood. Where would you go for dinner if you wanted something special but not too formal?" Now the person can actually help. They have constraints to work with: three days, seafood, special, not too formal. They might suggest a place they go to themselves, which is usually the answer you want.

Even better, give the person a chance to change your mind. "I was thinking of going to the famous market on Saturday morning. Is there somewhere you would go instead?" This question respects their knowledge and admits you might not have made the best plan. Locals love to redirect tourists to the better, less crowded version of what they are looking for.

When you get a recommendation, ask one follow-up question. "What would you order?" or "What is the best time to go?" or "Is there a part of the menu that is especially good?" Recommendations without follow-up are half-useful. The follow-up question turns "go to this restaurant" into "order the special at this restaurant after eight in the evening, the wine list is overpriced but the chef's tasting menu is the real find".

Lastly, remember that recommendations are a two-way exchange. After you have used the recommendation, tell the person what you thought of it the next time you see them. This is partly courtesy and partly an investment: locals are more generous with their second recommendation than their first if you have shown that their advice was taken seriously.`,
    questions: [
      { prompt: 'Why does the article say "What is the best restaurant in this city?" is a bad question?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'The person you are asking does not know what you mean by best -- value, atmosphere, special occasions? With no constraints to work with, they default to a safe famous tourist place.', answers: [
        { text: "It is rude to ask strangers for recommendations", isCorrect: false }, { text: 'The person does not know what you mean by "best"', isCorrect: true }, { text: "Locals do not eat in restaurants", isCorrect: false }, { text: "Different cities have different definitions of best", isCorrect: false },
      ]},
      { prompt: 'According to the article, what makes the question "I love seafood. Where would you go for dinner?" better?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'It gives constraints (three days, seafood, special, not too formal) so the person has something to work with. They might even suggest a place they go to themselves.', answers: [
        { text: "It is shorter and more polite", isCorrect: false }, { text: "It gives the person constraints they can work with", isCorrect: true }, { text: "It avoids tourist places automatically", isCorrect: false }, { text: "It signals you have local connections", isCorrect: false },
      ]},
      { prompt: 'What does the article say is even better than asking for a recommendation?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'Giving the person a chance to change your mind. The example: "I was thinking of going to the famous market. Is there somewhere you would go instead?"', answers: [
        { text: "Asking for a written list", isCorrect: false }, { text: "Giving them a chance to change your mind about a plan", isCorrect: true }, { text: "Asking three different locals the same question", isCorrect: false }, { text: "Looking at online reviews first", isCorrect: false },
      ]},
      { prompt: 'What kind of follow-up questions does the article recommend?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'Specific ones like "What would you order?", "What is the best time to go?", or "Is there a part of the menu that is especially good?" These turn a basic recommendation into something usable.', answers: [
        { text: "Questions about the price", isCorrect: false }, { text: "Specific questions like what to order or the best time to go", isCorrect: true }, { text: "Questions about parking and accessibility", isCorrect: false }, { text: "Questions about the local language", isCorrect: false },
      ]},
      { prompt: 'According to the article, why should you tell the local what you thought of their recommendation later?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'Partly courtesy and partly investment: locals are more generous with their second recommendation if they see their first advice was taken seriously.', answers: [
        { text: "It is required as a polite custom", isCorrect: false }, { text: "Locals are more generous with their second recommendation", isCorrect: true }, { text: "It helps them write reviews online", isCorrect: false }, { text: "It builds your social media presence", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: hotel reception, problem solved",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 9,
    sortOrder: 4,
    audioUrl: null,
    content: `A guest, Yuki, has just arrived at her hotel after a long flight. She speaks with the receptionist, David.

DAVID: Good evening, welcome to the Hotel Marina. Do you have a reservation?

YUKI: Yes, my name is Yuki Tanaka. I booked online about a month ago.

DAVID: Let me check. Tanaka, Yuki, three nights, double room with a city view. Is that right?

YUKI: That is correct. Although -- I requested a quiet room when I booked. Is that on the booking?

DAVID: Let me see. Yes, I see the request. Unfortunately, our city-view rooms all face the main street, so they are not the quietest in the hotel. Would you like me to move you to a room facing the back garden? You would lose the city view, but the back rooms are very quiet.

YUKI: That sounds better. I am here for work meetings, so sleep is more important to me than the view.

DAVID: Of course. Let me see what I have. I can offer you a room on the third floor facing the garden. The room is the same size as the city-view rooms, and there is no extra charge. Would that work?

YUKI: That would be perfect. Thank you.

DAVID: One more thing. We have a free breakfast in the restaurant from seven to ten in the morning. Would you also like me to book you a wake-up call?

YUKI: Yes, please. Could I have a wake-up call at six thirty tomorrow?

DAVID: Six thirty, of course. Here is your key, room 312. The lift is just behind you. Would you like help with your bags?

YUKI: No, I can manage, thank you. One last question. Is there a place to do laundry in the hotel, or somewhere nearby?

DAVID: We have a laundry service. You can leave clothes at reception before nine in the morning, and they will come back the same evening. There is a price list in your room.

YUKI: Wonderful. Thank you for your help.

DAVID: My pleasure. Have a good evening.`,
    questions: [
      { prompt: 'Why does Yuki choose the garden-view room instead of the city-view room?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'She is here for work meetings, so sleep is more important to her than the view. The garden rooms are quieter than the city-view rooms which face the main street.', answers: [
        { text: "It is cheaper", isCorrect: false }, { text: "She is here for work meetings, so sleep matters more than the view", isCorrect: true }, { text: "She does not like cities", isCorrect: false }, { text: "The garden has a swimming pool", isCorrect: false },
      ]},
      { prompt: 'Is there an extra charge for the room change?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'No extra charge. The room is the same size as the city-view rooms.', answers: [
        { text: "Yes, twenty euros per night", isCorrect: false }, { text: "Yes, only for the first night", isCorrect: false }, { text: "No, there is no extra charge", isCorrect: true }, { text: "It depends on the floor", isCorrect: false },
      ]},
      { prompt: 'What time does Yuki ask for her wake-up call?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'Six thirty in the morning.', answers: [
        { text: "Six o'clock", isCorrect: false }, { text: "Six thirty", isCorrect: true }, { text: "Seven o'clock", isCorrect: false }, { text: "She does not want a wake-up call", isCorrect: false },
      ]},
      { prompt: 'What time does breakfast end?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'Ten in the morning. Breakfast is from seven to ten.', answers: [
        { text: "Eight in the morning", isCorrect: false }, { text: "Nine in the morning", isCorrect: false }, { text: "Ten in the morning", isCorrect: true }, { text: "Eleven in the morning", isCorrect: false },
      ]},
      { prompt: 'How does the hotel laundry service work?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'Leave clothes at reception before nine in the morning; they come back the same evening. A price list is in the room.', answers: [
        { text: "There is a self-service laundry on the ground floor", isCorrect: false }, { text: "Leave clothes at reception before nine, they return the same evening", isCorrect: true }, { text: "The hotel does not offer laundry", isCorrect: false }, { text: "There is a service every two days", isCorrect: false },
      ]},
    ],
  },

  {
    title: "Listening: a city tour with a local guide",
    skill: "LISTENING" as SkillType,
    estimatedMinutes: 8,
    sortOrder: 5,
    audioUrl: null,
    content: `A small walking tour. The guide, Elena, is showing a group of tourists around the old part of the city.

ELENA: Welcome, everyone. Before we start, just a few things. The tour is two hours long. We will have one short break in the middle, near the cathedral, where there is a public toilet and a small cafe. The tour finishes back at this square. Is everyone wearing comfortable shoes? Good.

We are standing in the main square of the old town. This square is over six hundred years old. The building behind me, with the clock tower, is the city hall. It is still working as the city hall today. The tradition is that the bells ring at midday, but every Wednesday they also play a short song -- which is something only the locals know.

Follow me, please. We are walking now into one of the oldest streets. Look up at the second floor. You can see windows that are very narrow. This is because, in the old days, taxes were calculated on the size of the windows. Bigger windows meant a bigger tax. So clever families made their windows narrow to save money.

This building on the right used to be a bakery in the seventeenth century. You can still see the original stone oven through the window, although now it is a bookshop. The owner is a friend, and if you mention you are on this tour, she will give you ten percent off.

We are coming up to a small fountain. This fountain has been here since the eighteenth century. The water comes from a spring under the city. Locals say if you drink three sips, you will return to the city one day. This is the most popular thing tourists do here.

Now, there is one rule about this neighbourhood I want to mention. Many people live here. Please keep your voices down, especially in the small streets. The houses are close together, and noise travels.

Any questions before we keep going? Yes, the gentleman in the blue jacket?`,
    questions: [
      { prompt: 'How long is the tour?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 1, explanation: 'Two hours long, with one short break in the middle near the cathedral.', answers: [
        { text: "One hour", isCorrect: false }, { text: "Two hours", isCorrect: true }, { text: "Three hours", isCorrect: false }, { text: "The whole afternoon", isCorrect: false },
      ]},
      { prompt: 'Why are the windows on the old buildings narrow?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 2, explanation: 'Taxes were calculated on the size of the windows. Bigger windows meant a bigger tax, so families made narrow windows to save money.', answers: [
        { text: "They were easier to clean", isCorrect: false }, { text: "Taxes were calculated on window size, so smaller meant cheaper", isCorrect: true }, { text: "It was a religious tradition", isCorrect: false }, { text: "Glass was rare and expensive", isCorrect: false },
      ]},
      { prompt: 'What special thing happens at the city hall every Wednesday?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 3, explanation: 'The bells play a short song. The guide notes this is something only the locals know.', answers: [
        { text: "There is a free concert in the square", isCorrect: false }, { text: "The clock tower is open to visitors", isCorrect: false }, { text: "The bells play a short song at midday", isCorrect: true }, { text: "The mayor gives a speech", isCorrect: false },
      ]},
      { prompt: 'What is special about the bookshop building?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 4, explanation: 'It used to be a bakery in the seventeenth century, and you can still see the original stone oven through the window. The owner gives ten percent off to people on the tour.', answers: [
        { text: "It is the oldest bookshop in the country", isCorrect: false }, { text: "It used to be a bakery, with the original oven still visible", isCorrect: true }, { text: "It was once a famous library", isCorrect: false }, { text: "It is open twenty-four hours", isCorrect: false },
      ]},
      { prompt: 'What do locals say happens if you drink three sips from the fountain?', type: "MULTIPLE_CHOICE" as QuestionType, sortOrder: 5, explanation: 'You will return to the city one day. The guide notes this is the most popular thing tourists do.', answers: [
        { text: "You will have good luck for one year", isCorrect: false }, { text: "You will become fluent in the local language", isCorrect: false }, { text: "You will return to the city one day", isCorrect: true }, { text: "You will find true love", isCorrect: false },
      ]},
    ],
  },
];


const MS6_WRITING = [
  {
    title: "Email to a hotel about a problem",
    prompt: `You are staying at a hotel for three nights. Last night, you could not sleep because of noise from a wedding party in the hotel restaurant that finished at 1 AM. You were not warned about the event when you checked in.

Write an email to the hotel manager explaining the situation. Your email should:
- Politely explain what happened
- Mention that you specifically requested a quiet room when you booked
- Ask for compensation, but suggest a reasonable solution (a discount, a free meal, or a room change)
- Avoid sounding angry, even though you are tired and frustrated

Aim for 130-200 words. Use polite language. The lessons on dealing with delays and the introduction lessons may help you find phrases that are firm but not rude.`,
    minWords: 110,
    maxWords: 240,
    rubricMode: "EMAIL" as RubricMode,
    sortOrder: 1,
  },
  {
    title: "A short travel review",
    prompt: `Write a review of a recent trip you took (or imagine one). The review should help future travellers decide whether to visit the same place.

Your review should include:
- Where you went and when (the city, the season)
- What kind of trip it was (sightseeing, family, business, etc.)
- One thing you loved
- One thing you would warn future travellers about
- A clear recommendation: would you go again, and what kind of traveller would enjoy it most

Aim for 150-225 words. Be specific. The lesson on reviewing accommodation has guidance on what makes reviews useful: short paragraphs, specific details, and honesty about both what worked and what did not.`,
    minWords: 130,
    maxWords: 260,
    rubricMode: "GENERAL" as RubricMode,
    sortOrder: 2,
  },
];


/*
  WRITING ASSIGNMENTS -- two per MaterialSet, one short and one
  longer. Designed so a learner has a choice and can attempt
  the shorter one first if they feel uncertain.
*/

const WRITING_ASSIGNMENTS = {
  B1_JOB: [
    {
      title: "Reschedule a meeting professionally",
      prompt: "You scheduled a one-hour meeting with a client for tomorrow at 2 PM. Something has come up and you need to move it to Thursday afternoon or Friday morning. Write an email to the client. Apologize for the change, propose two alternative times, and offer to be flexible if neither time works. Use a polite, professional tone.",
      minWords: 80,
      maxWords: 200,
      sortOrder: 1,
    },
    {
      title: "Decline an extra task without sounding rude",
      prompt: "Your manager has asked you to take on a new project on top of your existing workload. You do not have capacity to take it on this month without dropping something else. Write an email to your manager. Acknowledge the request, explain the constraint clearly without sounding negative, propose one of two alternatives (deferring the new project, or dropping a current task), and ask for their guidance. Aim for a professional and constructive tone throughout.",
      minWords: 120,
      maxWords: 250,
      sortOrder: 2,
    },
  ],
  B2_IELTS: [
    {
      title: "IELTS Task 2: opinion essay on university subjects",
      prompt: "Some people believe that universities should focus only on subjects with clear job market demand, such as engineering and computer science. Others believe universities should preserve traditional subjects like history and philosophy regardless of market demand. Discuss both views and give your own opinion. Write at least 250 words. Use formal academic English with appropriate hedging.",
      minWords: 250,
      maxWords: 350,
      sortOrder: 1,
    },
    {
      title: "IELTS Task 1: describe a process",
      prompt: "The diagram below shows the process by which paper is recycled. (For this exercise, imagine a six-step process: collection, sorting, shredding, washing, pulping, and re-rolling into new paper.) Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words. Use the passive voice where appropriate.",
      minWords: 150,
      maxWords: 220,
      sortOrder: 2,
    },
  ],
  A2_TRAVEL: [
    {
      title: "Write a postcard to a friend",
      prompt: "Imagine you are on holiday in a foreign city. Write a short postcard to a friend back home. Include: where you are, what you did yesterday, what you plan to do tomorrow, and one thing you love about the city. Keep the tone friendly and informal.",
      minWords: 60,
      maxWords: 120,
      sortOrder: 1,
    },
    {
      title: "Write a hotel review",
      prompt: "You stayed three nights at a hotel during your trip. Write a short review for a travel website. Include: the name of the hotel (you can invent one), what was good about your stay, what was not good, whether you would recommend it to other travellers, and a star rating from 1 to 5. Be honest but fair.",
      minWords: 80,
      maxWords: 160,
      sortOrder: 2,
    },
  ],
};


// Main seed function

async function main() {
  console.log("Seeding database...");

  // 1. Levels (upsert -- safe to re-run)
  console.log("  Seeding levels...");
  for (const lvl of LEVELS) {
    await prisma.level.upsert({
      where:  { key: lvl.key },
      update: lvl,
      create: lvl,
    });
  }

  // 2. Purposes (upsert)
  console.log("  Seeding purposes...");
  for (const p of PURPOSES) {
    await prisma.purpose.upsert({
      where:  { key: p.key },
      update: p,
      create: p,
    });
  }

  /* 3. Wipe content tables for a clean re-seed.
     Order matters: foreign keys cascade from MaterialSet down,
     so deleting MaterialSets cascades to Lessons, Questions,
     Answers, and WritingAssignments. */
  console.log("  Wiping previous MaterialSets and dependent content...");
  /*
    Order matters: Submission -> WritingAssignment, Progress -> Lesson,
    SpeakingBooking is independent. We delete the leaf rows first so
    foreign keys do not block the MaterialSet wipe.
    User-generated rows (Submissions, Bookings, Progress) are also wiped
    here -- a re-seed assumes a clean slate for content.
  */
  await prisma.submission.deleteMany({});
  await prisma.speakingBooking.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.materialSet.deleteMany({});

  // Fetch the level and purpose ids we just upserted
  const levelB1 = await prisma.level.findUniqueOrThrow({ where: { key: "B1" } });
  const levelB2 = await prisma.level.findUniqueOrThrow({ where: { key: "B2" } });
  const levelA2 = await prisma.level.findUniqueOrThrow({ where: { key: "A2" } });

  const purposeJob    = await prisma.purpose.findUniqueOrThrow({ where: { key: "JOB"    } });
  const purposeIelts  = await prisma.purpose.findUniqueOrThrow({ where: { key: "IELTS"  } });
  const purposeTravel = await prisma.purpose.findUniqueOrThrow({ where: { key: "TRAVEL" } });

  console.log("  Seeding MaterialSet 1: B1 + Job (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "Workplace English for B1",
    description: "Email etiquette, meetings, scheduling, delivering bad news, and the soft skills that make professional English flow.",
    levelId:   levelB1.id,
    purposeId: purposeJob.id,
    lessons:   MS1_LESSONS,
    writingAssignments: WRITING_ASSIGNMENTS.B1_JOB,
  });

  console.log("  Seeding MaterialSet 2: B2 + IELTS (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "IELTS Preparation for B2",
    description: "Task 1 graphs and processes, Task 2 essays, academic register, hedging, and the structures that score band 7 and above.",
    levelId:   levelB2.id,
    purposeId: purposeIelts.id,
    lessons:   MS2_LESSONS,
    writingAssignments: WRITING_ASSIGNMENTS.B2_IELTS,
  });

  console.log("  Seeding MaterialSet 3: A2 + Travel (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "Practical Travel English for A2",
    description: "Airports, hotels, restaurants, asking for directions, and handling everyday emergencies abroad.",
    levelId:   levelA2.id,
    purposeId: purposeTravel.id,
    lessons:   MS3_LESSONS,
    writingAssignments: WRITING_ASSIGNMENTS.A2_TRAVEL,
  });


  // Look up the BUSINESS purpose for path 4
  const purposeBusiness = await prisma.purpose.findUniqueOrThrow({ where: { key: "BUSINESS" } });

  console.log("  Seeding MaterialSet 4: B2 + Business (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "Professional English for B2",
    description: "Negotiation, presenting to executives, professional emails, and the listening skills for high-stakes business conversations.",
    levelId:   levelB2.id,
    purposeId: purposeBusiness.id,
    lessons:   MS4_LESSONS,
    writingAssignments: MS4_WRITING,
  });

  console.log("  Seeding MaterialSet 5: A2 + Job (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "Workplace English for A2",
    description: "Introducing yourself, asking for help, requesting time off, and handling everyday workplace conversations.",
    levelId:   levelA2.id,
    purposeId: purposeJob.id,
    lessons:   MS5_LESSONS,
    writingAssignments: MS5_WRITING,
  });

  console.log("  Seeding MaterialSet 6: B1 + Travel (5 lessons, 2 writing prompts)...");
  await createMaterialSet({
    title: "Practical Travel English for B1",
    description: "Booking accommodation, dealing with delays, asking for recommendations, and handling situations that need negotiation.",
    levelId:   levelB1.id,
    purposeId: purposeTravel.id,
    lessons:   MS6_LESSONS,
    writingAssignments: MS6_WRITING,
  });

  console.log("Seed complete.");
}


/*
  Helper: create one MaterialSet plus all of its lessons,
  questions, answers, and writing assignments.
*/

async function createMaterialSet(input: {
  title: string;
  description: string;
  levelId: string;
  purposeId: string;
  lessons: typeof MS1_LESSONS;
  writingAssignments: Array<{
    title: string;
    prompt: string;
    minWords: number;
    maxWords: number;
    sortOrder: number;
  }>;
}) {
  const set = await prisma.materialSet.create({
    data: {
      title:       input.title,
      description: input.description,
      levelId:     input.levelId,
      purposeId:   input.purposeId,
    },
  });

  for (const lesson of input.lessons) {
    const createdLesson = await prisma.lesson.create({
      data: {
        materialSetId:    set.id,
        title:            lesson.title,
        skill:            lesson.skill,
        content:          lesson.content,
        audioUrl:         lesson.audioUrl,
        estimatedMinutes: lesson.estimatedMinutes,
        sortOrder:        lesson.sortOrder,
      },
    });

    for (const q of lesson.questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          lessonId:    createdLesson.id,
          prompt:      q.prompt,
          type:        q.type,
          sortOrder:   q.sortOrder,
          explanation: q.explanation,
        },
      });

      for (let i = 0; i < q.answers.length; i++) {
        const a = q.answers[i];
        await prisma.answer.create({
          data: {
            questionId: createdQuestion.id,
            text:       a.text,
            isCorrect:  a.isCorrect,
            sortOrder:  i,
          },
        });
      }
    }
  }

  for (const wa of input.writingAssignments) {
    await prisma.writingAssignment.create({
      data: {
        materialSetId: set.id,
        title:         wa.title,
        prompt:        wa.prompt,
        minWords:      wa.minWords,
        maxWords:      wa.maxWords,
        sortOrder:     wa.sortOrder,
      },
    });
  }
}


main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
