"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";

type Attempt = {
  userId: string;
  quizId: string;
  userName: string | null;
  userEmail: string | null;
  courseTitle: string | null;
  quizTitle: string | null;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

type CourseInfo = { title: string; titleAr: string | null };

type EnrollmentInfo = { course: CourseInfo };

type StudentWithDetails = {
  student: { id: string; name: string | null; email: string | null; studentNumber: string | null; guardianNumber: string | null };
  completedLessonsCount: number;
  homeworkCount: number;
  markedHomeworkCount: number;
  lastLearningActivityAt: string | null;
  enrollments: EnrollmentInfo[];
  userAttempts: Attempt[];
};

type Props = {
  studentsCount: number;
  totalEnrollments: number;
  attemptsCount: number;
  totalEarnings: number;
  attempts: Attempt[];
  studentsWithDetails: StudentWithDetails[];
  titleSuffix?: string;
};

function formatDate(d: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(typeof d === "string" ? new Date(d) : d);
}

const PAGE_SIZE = 25;

function StatisticsPagination({ page, total, label, onChange }: {
  page: number;
  total: number;
  label: string;
  onChange: (page: number) => void;
}) {
  const t = useT();
  const { dir } = useDashboardTable();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total === 0) return null;
  return (
    <nav aria-label={label} dir={dir} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-sm text-[var(--color-muted)]">
        {fillMessage(t("dashboard.statisticsPage.paginationSummary"), {
          start: (page - 1) * PAGE_SIZE + 1,
          end: Math.min(page * PAGE_SIZE, total),
          total,
          page,
          pages,
        })}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50">
          {t("dashboard.statisticsPage.previousPage")}
        </button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50">
          {t("dashboard.statisticsPage.nextPage")}
        </button>
      </div>
    </nav>
  );
}

export default function StatisticsContent({
  studentsCount,
  totalEnrollments,
  attemptsCount,
  totalEarnings,
  attempts,
  studentsWithDetails,
  titleSuffix = "",
}: Props) {
  const t = useT();
  const { locale, dir, thClassCompact } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);
  const [searchQuery, setSearchQuery] = useState("");
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const egp = t("common.egyptianPoundShort", "EGP");

  const trimmed = searchQuery.trim().toLowerCase();

  const matchingStudentIds = useMemo(() => new Set(studentsWithDetails.filter(({ student }) =>
    [student.name, student.email, student.studentNumber, student.guardianNumber]
      .some((value) => (value ?? "").toLowerCase().includes(trimmed))
  ).map(({ student }) => student.id)), [studentsWithDetails, trimmed]);

  const filteredAttempts = useMemo(() => {
    if (!trimmed) return attempts;
    return attempts.filter((a) => {
      const name = (a.userName ?? "").toLowerCase();
      const email = (a.userEmail ?? "").toLowerCase();
      return matchingStudentIds.has(a.userId) || name.includes(trimmed) || email.includes(trimmed);
    });
  }, [attempts, trimmed, matchingStudentIds]);

  const filteredStudentsWithDetails = useMemo(() => {
    if (!trimmed) return studentsWithDetails;
    return studentsWithDetails.filter((swd) => matchingStudentIds.has(swd.student.id));
  }, [studentsWithDetails, trimmed, matchingStudentIds]);

  const currentAttemptsPage = Math.min(attemptsPage, Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE)));
  const currentStudentsPage = Math.min(studentsPage, Math.max(1, Math.ceil(filteredStudentsWithDetails.length / PAGE_SIZE)));
  const visibleAttempts = filteredAttempts.slice((currentAttemptsPage - 1) * PAGE_SIZE, currentAttemptsPage * PAGE_SIZE);
  const visibleStudents = filteredStudentsWithDetails.slice((currentStudentsPage - 1) * PAGE_SIZE, currentStudentsPage * PAGE_SIZE);

  const pq = `dashboard.statisticsPage`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {t(`${pq}.title`, "Student statistics")}
          {titleSuffix ? ` ${titleSuffix}` : ""}
        </h2>
        <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          {t("dashboard.backToDashboard", "← Back to dashboard")}
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="student-search" className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
          {t(`${pq}.studentSearchLabel`, "Find a student")}
        </label>
        <input
          id="student-search"
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setAttemptsPage(1);
            setStudentsPage(1);
          }}
          placeholder={t(`${pq}.studentSearchPlaceholder`, "Student name or email…")}
          className="w-full max-w-md rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          dir={dir}
        />
        {trimmed && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {fillMessage(t(`${pq}.filterSummary`, "Showing {students} students, {attempts} quiz attempts"), {
              students: String(filteredStudentsWithDetails.length),
              attempts: String(filteredAttempts.length),
            })}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardStudents`, "Students")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{studentsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardEnrollments`, "Total course enrollments")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{totalEnrollments}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardAttempts`, "Quiz attempts")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{attemptsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/20 p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardEarningsTitle`, "Total platform earnings")}</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {totalEarnings.toFixed(2)} {egp}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t(`${pq}.cardEarningsHint`, "From student balance paid to enroll in courses")}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${pq}.sectionQuizScores`, "Quiz scores")}
        </h3>
        {filteredAttempts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed
              ? t(`${pq}.noAttemptsFiltered`, "No results match your search.")
              : t(`${pq}.noAttemptsEmpty`, "No attempts recorded yet.")}
          </p>
        ) : (
          <div dir={dir} className="overflow-x-auto">
            <table dir={dir} className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className={thClassCompact}>{t(`${pq}.colStudent`, "Student")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colEmail`, "Email")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colCourse`, "Course")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colQuiz`, "Quiz")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colScore`, "Score")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colDate`, "Date")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttempts.map((a) => (
                  <tr key={`${a.userId}-${a.quizId}-${a.createdAt}`} className="border-b border-[var(--color-border)]/50">
                    <td className="px-3 py-2 text-[var(--color-foreground)]">{a.userName}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{a.userEmail}</td>
                    <td className="px-3 py-2 text-[var(--color-foreground)]">{a.courseTitle}</td>
                    <td className="px-3 py-2 text-[var(--color-foreground)]">{a.quizTitle}</td>
                    <td className="px-3 py-2 text-[var(--color-foreground)]">
                      {a.score} / {a.totalQuestions}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{formatDate(a.createdAt, dateLocale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <StatisticsPagination
          page={currentAttemptsPage}
          total={filteredAttempts.length}
          label={t(`${pq}.sectionQuizScores`)}
          onChange={setAttemptsPage}
        />
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${pq}.sectionStudentsEnrollments`, "Students & enrollments")}
        </h3>
        {filteredStudentsWithDetails.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed
              ? t(`${pq}.noStudentsFiltered`, "No results match your search.")
              : t(`${pq}.noStudentsEmpty`, "No students registered.")}
          </p>
        ) : (
          <ul className="space-y-4">
            {visibleStudents.map(({ student: s, enrollments, userAttempts, completedLessonsCount, homeworkCount, markedHomeworkCount, lastLearningActivityAt }) => (
              <li
                key={s.id}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{s.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{s.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                    <span>
                      {fillMessage(t(`${pq}.enrolledInCourses`, "Enrolled in {count} course(s)"), {
                        count: String(enrollments.length),
                      })}
                    </span>
                    <span>
                      {t(`${pq}.quizAttemptsCount`, "Quiz attempts:")} {userAttempts.length}
                    </span>
                    <span>
                      {t(`${pq}.completedLessonsCount`, "Completed lessons:")} {completedLessonsCount}
                    </span>
                    <span>{t(`${pq}.homeworkCount`)} {homeworkCount}</span>
                    <span>{t(`${pq}.markedHomeworkCount`)} {markedHomeworkCount}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {t(`${pq}.lessonTrackingHelp`)}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t(`${pq}.lastActivity`)} {(() => {
                    const dates = [lastLearningActivityAt, ...userAttempts.map((a) => a.createdAt)]
                      .filter((date): date is string => !!date)
                      .map((date) => new Date(date).getTime()).filter(Number.isFinite);
                    return dates.length ? formatDate(new Date(Math.max(...dates)), dateLocale) : t(`${pq}.noActivity`);
                  })()}
                </p>
                {userAttempts.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium text-[var(--color-primary)]">{t(`${pq}.examBreakdown`)}</summary>
                    <ul className="mt-2 space-y-2">
                      {Array.from(userAttempts.reduce((map, attempt) => {
                        const existing = map.get(attempt.quizId);
                        if (existing) existing.count += 1;
                        else map.set(attempt.quizId, { title: attempt.quizTitle, course: attempt.courseTitle, count: 1 });
                        return map;
                      }, new Map<string, { title: string | null; course: string | null; count: number }>())).map(([id, exam]) => (
                        <li key={id} className="flex flex-wrap justify-between gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] p-2">
                          <span>{exam.title} {exam.course ? `(${exam.course})` : ""}</span>
                          <span>{fillMessage(t(`${pq}.examAttemptCount`), { count: exam.count })}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {enrollments.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    {t(`${pq}.coursesLabel`, "Courses:")}{" "}
                    {enrollments.map((e) => e.course.titleAr ?? e.course.title).join("، ")}
                  </p>
                )}
                {userAttempts.length > 0 && (
                  <div className="mt-2 text-xs text-[var(--color-muted)]">
                    {t(`${pq}.latestResults`, "Latest results:")}{" "}
                    {userAttempts
                      .slice(0, 3)
                      .map((a) => `${a.quizTitle} (${a.score}/${a.totalQuestions})`)
                      .join(" — ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <StatisticsPagination
          page={currentStudentsPage}
          total={filteredStudentsWithDetails.length}
          label={t(`${pq}.sectionStudentsEnrollments`)}
          onChange={setStudentsPage}
        />
      </section>
    </div>
  );
}
