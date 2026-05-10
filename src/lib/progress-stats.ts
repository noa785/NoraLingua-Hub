/*
  Progress statistics computation.

  Single source of truth for every metric on the dashboard. Each
  function takes raw Prisma rows and returns plain typed objects.
  No queries here -- callers fetch the data and pass it in.

  Why a separate file?
    The dashboard renders six sections that all derive from the
    same underlying tables (Lesson + Progress + Submission +
    SpeakingBooking). Putting the math here means each section
    calls a tiny function, the dashboard server component reads
    cleanly, and the same logic is reusable on the public profile
    page later.
*/


export type SkillMastery = {
  skill:        "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  label:        string;
  totalItems:   number;        // total lessons or assignments or sessions for this skill in user's path
  completed:    number;        // how many the user has done
  percentDone:  number;        // 0 to 100, integer
};


export type WritingBandPoint = {
  submissionId: string;
  date:         Date;
  band:         number;        // 0 to 9
  assignmentTitle: string;
};


export type WritingProgress = {
  totalSubmissions: number;
  averageBand:      number | null;   // null if zero submissions
  latestBand:       number | null;
  firstBand:        number | null;
  improvement:      number | null;   // latestBand minus firstBand, null if fewer than 2 submissions
  history:          WritingBandPoint[];  // chronological, oldest first
  /* The full payload of the most recent graded submission, used by
     the dashboard's LatestFeedbackCard to surface a feedback excerpt
     and per-criterion bars. Null when the learner has no graded
     submissions yet. Keeping this on WritingProgress (rather than a
     separate top-level field) keeps the dashboard's writing data
     cohesive: chart, bands, and feedback all flow from one source. */
  latestFeedback:   LatestFeedback | null;
};


export type LatestFeedback = {
  submissionId:    string;
  assignmentTitle: string;
  bandOverall:     number;
  bandCriterion1:  number | null;   // Task Response (TR)
  bandCriterion2:  number | null;   // Coherence and Cohesion (CC)
  bandCriterion3:  number | null;   // Lexical Resource (LR)
  bandCriterion4:  number | null;   // Grammatical Range and Accuracy (GR)
  excerpt:         string;          // first ~200 chars, suffixed with ellipsis if truncated
  gradedAt:        Date;
};


export type ActivityItem = {
  id:       string;
  kind:     "LESSON_COMPLETED" | "WRITING_GRADED" | "SPEAKING_BOOKED" | "JOINED";
  title:    string;            // human label
  detail?:  string;            // optional second line
  timestamp: Date;
};


export type Milestones = {
  pathPioneer: {
    unlocked: boolean;
    progress: number;          // 0 to 100, percent toward unlock
    detail:   string;          // "3 of 5 path items complete" etc
  };
  bandSeven: {
    unlocked:    boolean;
    bestBand:    number | null;
    detail:      string;
  };
};


export type DashboardStats = {
  // Hero metrics
  lessonsCompleted: number;
  writingBandAverage: number | null;
  speakingSessionsBooked: number;     // active bookings
  daysActive: number;                  // unique calendar days with any activity

  // Sections
  skills:     SkillMastery[];
  writing:    WritingProgress;
  activity:   ActivityItem[];          // last 5
  milestones: Milestones;
};


/* ---------- input shapes (loosely typed to accept Prisma rows) ---------- */

type LessonRow   = { id: string; skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING"; title: string };
type ProgressRow = {
  lessonId: string;
  isCompleted: boolean;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date | null;
  lastAccessedAt: Date;
};
type AssignmentRow = { id: string; title: string };
type SubmissionRow = {
  id: string;
  assignmentId: string;
  bandOverall: number | null;
  bandCriterion1: number | null;
  bandCriterion2: number | null;
  bandCriterion3: number | null;
  bandCriterion4: number | null;
  feedback: string | null;
  detailedFeedback: string | null;
  gradedAt: Date | null;
  createdAt: Date;
};
type BookingRow = {
  id: string;
  sessionDate: Date;
  status: "BOOKED" | "CANCELLED" | "COMPLETED";
  createdAt: Date;
};


/* ---------- public computation function ---------- */

type ComputeInput = {
  userJoinedAt:        Date;
  lessons:             LessonRow[];      // all lessons in user's matched MaterialSet
  progress:            ProgressRow[];    // all of this user's Progress rows
  writingAssignments:  AssignmentRow[];  // all assignments in matched MaterialSet
  submissions:         SubmissionRow[];  // all of this user's Submission rows
  speakingBookings:    BookingRow[];     // all of this user's SpeakingBooking rows
};


export function computeDashboardStats(input: ComputeInput): DashboardStats {
  const skills    = computeSkills(input.lessons, input.writingAssignments, input.progress, input.submissions, input.speakingBookings);
  const writing   = computeWritingProgress(input.submissions, input.writingAssignments);
  const activity  = computeActivity(input.lessons, input.progress, input.writingAssignments, input.submissions, input.speakingBookings, input.userJoinedAt);
  const milestones = computeMilestones(skills, writing);

  const lessonsCompleted     = input.progress.filter((p) => p.isCompleted).length;
  const speakingSessionsBooked = input.speakingBookings.filter((b) => b.status === "BOOKED").length;
  const daysActive           = computeDaysActive(input.progress, input.submissions, input.speakingBookings, input.userJoinedAt);

  return {
    lessonsCompleted,
    writingBandAverage: writing.averageBand,
    speakingSessionsBooked,
    daysActive,
    skills,
    writing,
    activity,
    milestones,
  };
}


/* ---------- section computations ---------- */

function computeSkills(
  lessons: LessonRow[],
  writingAssignments: AssignmentRow[],
  progress: ProgressRow[],
  submissions: SubmissionRow[],
  bookings: BookingRow[],
): SkillMastery[] {
  const completedLessonIds = new Set(progress.filter((p) => p.isCompleted).map((p) => p.lessonId));

  // READING
  const readingLessons = lessons.filter((l) => l.skill === "READING");
  const readingDone    = readingLessons.filter((l) => completedLessonIds.has(l.id)).length;

  // LISTENING
  const listeningLessons = lessons.filter((l) => l.skill === "LISTENING");
  const listeningDone    = listeningLessons.filter((l) => completedLessonIds.has(l.id)).length;

  // WRITING -- uses writingAssignments and graded submissions per assignment
  const submittedAssignmentIds = new Set(submissions.filter((s) => s.gradedAt !== null).map((s) => s.assignmentId));
  const writingDone = writingAssignments.filter((a) => submittedAssignmentIds.has(a.id)).length;

  // SPEAKING -- target is 3 sessions. Booked + Completed both count.
  const speakingActive = bookings.filter((b) => b.status === "BOOKED" || b.status === "COMPLETED").length;

  return [
    {
      skill: "READING", label: "Reading",
      totalItems: readingLessons.length,
      completed:  readingDone,
      percentDone: pct(readingDone, readingLessons.length),
    },
    {
      skill: "LISTENING", label: "Listening",
      totalItems: listeningLessons.length,
      completed:  listeningDone,
      percentDone: pct(listeningDone, listeningLessons.length),
    },
    {
      skill: "WRITING", label: "Writing",
      totalItems: writingAssignments.length,
      completed:  writingDone,
      percentDone: pct(writingDone, writingAssignments.length),
    },
    {
      skill: "SPEAKING", label: "Speaking",
      totalItems: 3,
      completed:  Math.min(3, speakingActive),
      percentDone: pct(Math.min(3, speakingActive), 3),
    },
  ];
}


function computeWritingProgress(submissions: SubmissionRow[], assignments: AssignmentRow[]): WritingProgress {
  // Only graded submissions count toward stats
  const graded = submissions
    .filter((s) => s.bandOverall !== null && s.gradedAt !== null)
    .sort((a, b) => (a.gradedAt!.getTime()) - (b.gradedAt!.getTime()));

  if (graded.length === 0) {
    return {
      totalSubmissions: 0,
      averageBand:      null,
      latestBand:       null,
      firstBand:        null,
      improvement:      null,
      history:          [],
      latestFeedback:   null,
    };
  }

  const titleById = new Map(assignments.map((a) => [a.id, a.title]));

  const history: WritingBandPoint[] = graded.map((s) => ({
    submissionId:    s.id,
    date:            s.gradedAt!,
    band:            s.bandOverall!,
    assignmentTitle: titleById.get(s.assignmentId) ?? "Writing",
  }));

  const firstBand  = history[0].band;
  const latestBand = history[history.length - 1].band;
  const sum        = history.reduce((acc, h) => acc + h.band, 0);
  const averageBand = sum / history.length;

  /* Build the latestFeedback payload from the most recent graded
     submission. We pick detailedFeedback first because it pairs with
     the IELTS rubric and is what the writing pipeline now writes;
     the legacy feedback field is kept as a fallback so historical
     submissions made before the rubric upgrade still surface text on
     the dashboard. The excerpt is hard-capped at 200 characters so
     the card remains glanceable; the link below it points to the
     full submission detail page. */
  const latestSub        = graded[graded.length - 1];
  const rawText          = latestSub.detailedFeedback ?? latestSub.feedback ?? "";
  const cleaned          = rawText.trim().replace(/\s+/g, " ");
  const EXCERPT_MAX      = 200;
  const excerpt          = cleaned.length <= EXCERPT_MAX
    ? cleaned
    : cleaned.slice(0, EXCERPT_MAX).trimEnd() + "...";
  const latestAssignment = titleById.get(latestSub.assignmentId) ?? "Writing";

  const latestFeedback: LatestFeedback = {
    submissionId:    latestSub.id,
    assignmentTitle: latestAssignment,
    bandOverall:     round1(latestSub.bandOverall!),
    bandCriterion1:  latestSub.bandCriterion1 !== null ? round1(latestSub.bandCriterion1) : null,
    bandCriterion2:  latestSub.bandCriterion2 !== null ? round1(latestSub.bandCriterion2) : null,
    bandCriterion3:  latestSub.bandCriterion3 !== null ? round1(latestSub.bandCriterion3) : null,
    bandCriterion4:  latestSub.bandCriterion4 !== null ? round1(latestSub.bandCriterion4) : null,
    excerpt:         excerpt,
    gradedAt:        latestSub.gradedAt!,
  };

  return {
    totalSubmissions: history.length,
    averageBand:      round1(averageBand),
    latestBand:       round1(latestBand),
    firstBand:        round1(firstBand),
    improvement:      history.length >= 2 ? round1(latestBand - firstBand) : null,
    history,
    latestFeedback,
  };
}


function computeActivity(
  lessons: LessonRow[],
  progress: ProgressRow[],
  assignments: AssignmentRow[],
  submissions: SubmissionRow[],
  bookings: BookingRow[],
  userJoinedAt: Date,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const assignById = new Map(assignments.map((a) => [a.id, a]));

  // Lesson completions
  for (const p of progress) {
    if (!p.isCompleted || !p.completedAt) continue;
    const lesson = lessonById.get(p.lessonId);
    items.push({
      id:        `lesson:${p.lessonId}`,
      kind:      "LESSON_COMPLETED",
      title:     `Completed lesson: ${lesson?.title ?? "lesson"}`,
      detail:    `${p.correctAnswers} of ${p.totalQuestions} correct`,
      timestamp: p.completedAt,
    });
  }

  // Graded writing submissions
  for (const s of submissions) {
    if (!s.gradedAt || s.bandOverall === null) continue;
    const assign = assignById.get(s.assignmentId);
    items.push({
      id:        `submission:${s.id}`,
      kind:      "WRITING_GRADED",
      title:     `Writing graded: ${assign?.title ?? "submission"}`,
      detail:    `Band ${s.bandOverall.toFixed(1)} of 9`,
      timestamp: s.gradedAt,
    });
  }

  // Speaking bookings
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    items.push({
      id:        `booking:${b.id}`,
      kind:      "SPEAKING_BOOKED",
      title:     `Booked speaking session`,
      detail:    formatDateShort(b.sessionDate),
      timestamp: b.createdAt,
    });
  }

  // JOINED is always last fallback
  items.push({
    id:        `joined:${userJoinedAt.getTime()}`,
    kind:      "JOINED",
    title:     `Joined NoraLingua Hub`,
    timestamp: userJoinedAt,
  });

  // Sort newest first, take 5
  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, 5);
}


function computeMilestones(skills: SkillMastery[], writing: WritingProgress): Milestones {
  // Path Pioneer: 50% across all 4 skills (weighted by their item counts)
  const totalItems    = skills.reduce((acc, s) => acc + s.totalItems, 0);
  const totalDone     = skills.reduce((acc, s) => acc + s.completed, 0);
  const overallPct    = pct(totalDone, totalItems);
  const pathUnlocked  = overallPct >= 50;

  // Band 7: best band score across all submissions
  const bestBand = writing.history.length > 0
    ? Math.max(...writing.history.map((h) => h.band))
    : null;
  const bandUnlocked = bestBand !== null && bestBand >= 7.0;

  return {
    pathPioneer: {
      unlocked: pathUnlocked,
      progress: Math.min(100, Math.round((overallPct / 50) * 100)), // 100 means we hit the 50% bar
      detail:   `${totalDone} of ${totalItems} path items complete (${overallPct}% overall)`,
    },
    bandSeven: {
      unlocked: bandUnlocked,
      bestBand: bestBand !== null ? round1(bestBand) : null,
      detail:   bestBand !== null
        ? `Best band so far: ${bestBand.toFixed(1)} of 9`
        : "Submit your first writing assignment to start",
    },
  };
}


function computeDaysActive(
  progress: ProgressRow[],
  submissions: SubmissionRow[],
  bookings: BookingRow[],
  userJoinedAt: Date,
): number {
  const days = new Set<string>();
  days.add(toDayKey(userJoinedAt));

  for (const p of progress) {
    if (p.completedAt)    days.add(toDayKey(p.completedAt));
    if (p.lastAccessedAt) days.add(toDayKey(p.lastAccessedAt));
  }
  for (const s of submissions) {
    days.add(toDayKey(s.createdAt));
    if (s.gradedAt) days.add(toDayKey(s.gradedAt));
  }
  for (const b of bookings) {
    days.add(toDayKey(b.createdAt));
  }

  return days.size;
}


/* ---------- helpers ---------- */

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function toDayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    timeZone: "Asia/Riyadh",
  });
}
