import type { CourseContentOrderEntry } from "@/lib/save-course-quizzes";

export type ParentQuizRef =
  | { type: "owned"; index: number }
  | { type: "linked"; quizId: string };

export type QuestionOptionRow = { text: string; isCorrect: boolean };
export type QuestionRow = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  questionText: string;
  imageUrl: string;
  options: QuestionOptionRow[];
};

export type QuizRow = {
  id?: string;
  title: string;
  timeLimitMinutes: string;
  maxAttempts: string;
  quizType: "NORMAL" | "REMEDIAL";
  parentQuizRef: ParentQuizRef | null;
  questions: QuestionRow[];
};

/** Keep questions that have text and/or an image (image alone can be the prompt). */
export function questionHasContent(qt: { questionText?: string | null; imageUrl?: string | null }): boolean {
  return Boolean(qt.questionText?.trim() || qt.imageUrl?.trim());
}

/** Unused question slot (no prompt and no option drafts). */
export function questionIsBlank(qt: QuestionRow): boolean {
  return (
    !qt.questionText?.trim() &&
    !qt.imageUrl?.trim() &&
    !qt.options.some((o) => o.text.trim() || o.isCorrect)
  );
}

export function quizIsBlank(quiz: QuizRow): boolean {
  return !quiz.title.trim() && quiz.questions.every(questionIsBlank);
}

export type CourseFormLessonLike = {
  title: string;
  videoUrl?: string;
  content?: string;
  pdfUrl?: string;
  acceptsHomework?: boolean;
  homeworkMaterials?: unknown[];
  homeworkExplanationVideoUrl?: string;
};

export function lessonIsBlank(lesson: CourseFormLessonLike): boolean {
  return (
    !lesson.title.trim() &&
    !lesson.videoUrl?.trim() &&
    !lesson.content?.trim() &&
    !lesson.pdfUrl?.trim() &&
    !lesson.acceptsHomework &&
    !(lesson.homeworkMaterials && lesson.homeworkMaterials.length > 0) &&
    !lesson.homeworkExplanationVideoUrl?.trim()
  );
}

export type CourseFormValidationMessages = {
  titleArRequired: string;
  titleEnRequired: string;
  descriptionArRequired: string;
  descriptionEnRequired: string;
  teacherRequired: string;
  lessonTitleRequired: string;
  quizTitleRequired: string;
  quizNeedsQuestion: string;
  remedialParentRequired: string;
  questionNeedsPrompt: string;
  mcqOptionsRequired: string;
  correctAnswerRequired: string;
  tfOptionsRequired: string;
};

/** Returns the first validation error, or null if the form is ready to save. */
export function validateCourseFormContent(params: {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  requireTeacher?: boolean;
  teacherId?: string;
  lessons: CourseFormLessonLike[];
  quizzes: QuizRow[];
  messages: CourseFormValidationMessages;
}): string | null {
  const { messages } = params;
  if (!params.titleAr.trim()) return messages.titleArRequired;
  if (!params.titleEn.trim()) return messages.titleEnRequired;
  if (!params.descriptionAr.trim()) return messages.descriptionArRequired;
  if (!params.descriptionEn.trim()) return messages.descriptionEnRequired;
  if (params.requireTeacher && !params.teacherId?.trim()) return messages.teacherRequired;

  for (let i = 0; i < params.lessons.length; i++) {
    const lesson = params.lessons[i];
    if (lessonIsBlank(lesson)) continue;
    if (!lesson.title.trim()) {
      return messages.lessonTitleRequired.replace("{n}", String(i + 1));
    }
  }

  for (let qi = 0; qi < params.quizzes.length; qi++) {
    const quiz = params.quizzes[qi];
    if (quizIsBlank(quiz)) continue;
    const quizN = String(qi + 1);
    if (!quiz.title.trim()) {
      return messages.quizTitleRequired.replace("{n}", quizN);
    }
    if (quiz.quizType === "REMEDIAL" && !quiz.parentQuizRef) {
      return messages.remedialParentRequired.replace("{n}", quizN);
    }
    const activeQuestions = quiz.questions.filter((qt) => !questionIsBlank(qt));
    if (activeQuestions.length === 0) {
      return messages.quizNeedsQuestion.replace("{n}", quizN);
    }
    for (let qti = 0; qti < quiz.questions.length; qti++) {
      const qt = quiz.questions[qti];
      if (questionIsBlank(qt)) continue;
      const qN = String(qti + 1);
      if (!questionHasContent(qt)) {
        return messages.questionNeedsPrompt.replace("{quiz}", quizN).replace("{q}", qN);
      }
      const filledOptions = qt.options.filter((o) => o.text.trim());
      if (qt.type === "MULTIPLE_CHOICE") {
        if (filledOptions.length < 2) {
          return messages.mcqOptionsRequired.replace("{quiz}", quizN).replace("{q}", qN);
        }
        if (!filledOptions.some((o) => o.isCorrect)) {
          return messages.correctAnswerRequired.replace("{quiz}", quizN).replace("{q}", qN);
        }
      } else if (qt.type === "TRUE_FALSE") {
        if (filledOptions.length < 2) {
          return messages.tfOptionsRequired.replace("{quiz}", quizN).replace("{q}", qN);
        }
        if (!qt.options.some((o) => o.isCorrect && o.text.trim())) {
          return messages.correctAnswerRequired.replace("{quiz}", quizN).replace("{q}", qN);
        }
      }
    }
  }

  return null;
}

export type LinkedQuizRow = {
  quizId: string;
  title: string;
  ownerCourseTitle: string;
  ownerCourseTitleAr?: string | null;
  quizType?: string;
};

export type ContentOrderEntry = CourseContentOrderEntry;

export type LinkableQuizOption = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string | null;
  questionCount: number;
};

export function resolveParentQuizRefFromId(
  parentQuizId: string | null | undefined,
  ownedQuizzes: Array<{ id?: string }>,
  linkedQuizzes: LinkedQuizRow[],
): ParentQuizRef | null {
  const pid = parentQuizId?.trim();
  if (!pid) return null;
  const ownedIndex = ownedQuizzes.findIndex((q) => q.id === pid);
  if (ownedIndex >= 0) return { type: "owned", index: ownedIndex };
  if (linkedQuizzes.some((q) => q.quizId === pid)) return { type: "linked", quizId: pid };
  return null;
}

export function buildParentQuizOptions(
  contentOrder: ContentOrderEntry[],
  quizzes: QuizRow[],
  linkedQuizzes: LinkedQuizRow[],
  excludeOwnedIndex?: number,
): Array<{ ref: ParentQuizRef; label: string }> {
  const options: Array<{ ref: ParentQuizRef; label: string }> = [];
  for (const entry of contentOrder) {
    if (entry.type === "quiz") {
      if (entry.index === excludeOwnedIndex) continue;
      const quiz = quizzes[entry.index];
      if (!quiz || quiz.quizType !== "NORMAL") continue;
      const title = quiz.title.trim() || `#${entry.index + 1}`;
      options.push({ ref: { type: "owned", index: entry.index }, label: title });
    } else if (entry.type === "linkedQuiz") {
      const linked = linkedQuizzes.find((l) => l.quizId === entry.quizId);
      if (!linked || (linked.quizType ?? "NORMAL") !== "NORMAL") continue;
      options.push({
        ref: { type: "linked", quizId: entry.quizId },
        label: `${linked.title} (${linked.ownerCourseTitleAr ?? linked.ownerCourseTitle})`,
      });
    }
  }
  return options;
}

export function parentRefKey(ref: ParentQuizRef | null | undefined): string {
  if (!ref) return "";
  return ref.type === "owned" ? `owned:${ref.index}` : `linked:${ref.quizId}`;
}

export function parentRefFromKey(
  key: string,
  linkedQuizzes: LinkedQuizRow[],
): ParentQuizRef | null {
  if (!key) return null;
  if (key.startsWith("owned:")) {
    const index = parseInt(key.slice(6), 10);
    return Number.isFinite(index) ? { type: "owned", index } : null;
  }
  if (key.startsWith("linked:")) {
    const quizId = key.slice(7);
    return linkedQuizzes.some((l) => l.quizId === quizId) ? { type: "linked", quizId } : null;
  }
  return null;
}
