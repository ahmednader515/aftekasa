import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getUsersByRole,
  getEnrollmentsWithCourseByUserId,
  getAllQuizAttemptsForAdmin,
  getTotalPlatformEarnings,
  getStudentsEnrolledInTeacherCourses,
  getQuizAttemptsForTeacher,
  getTotalEarningsForTeacher,
  getCoursesWithCountsForCreator,
  getStudentLearningActivityForUsers,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import StatisticsContent from "./StatisticsContent";

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  if (role === "TEACHER") {
    const teacherId = session.user.id;
    const [students, attempts, totalEarnings, myCourses] = await Promise.all([
      getStudentsEnrolledInTeacherCourses(teacherId),
      getQuizAttemptsForTeacher(teacherId).catch(() => []),
      getTotalEarningsForTeacher(teacherId),
      getCoursesWithCountsForCreator(teacherId),
    ]);
    const myCourseIds = new Set(myCourses.map((row) => String((row as { id?: unknown }).id ?? "")));
    const myCourseIdList = [...myCourseIds];

    const enrollmentsByUser = await Promise.all(
      students.map(async (s) => {
        const all = await getEnrollmentsWithCourseByUserId(s.id);
        return all.filter((e) => myCourseIds.has(e.course.id));
      }),
    );

    const activityByUser = await getStudentLearningActivityForUsers(
      students.map((s) => s.id),
      myCourseIdList,
    );

    const totalEnrollments = enrollmentsByUser.reduce((sum, e) => sum + e.length, 0);

    const attemptsSerialized = attempts.map((a) => ({
      userId: a.userId,
      quizId: a.quizId,
      userName: a.userName,
      userEmail: a.userEmail,
      courseTitle: a.courseTitle,
      quizTitle: a.quizTitle,
      score: a.score,
      totalQuestions: a.totalQuestions,
      createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString(),
    }));

    const studentsWithDetails = students.map((s, i) => {
      const enrollments = enrollmentsByUser[i] ?? [];
      const userAttempts = attempts.filter((a) => a.userId === s.id);
      return {
        student: { id: s.id, name: s.name, email: s.email, studentNumber: s.student_number ?? null, guardianNumber: s.guardian_number ?? null },
        completedLessonsCount: activityByUser.get(s.id)?.completedLessonsCount ?? 0,
        homeworkCount: activityByUser.get(s.id)?.homeworkCount ?? 0,
        markedHomeworkCount: activityByUser.get(s.id)?.markedHomeworkCount ?? 0,
        lastLearningActivityAt: activityByUser.get(s.id)?.lastActivityAt ?? null,
        enrollments: enrollments.map((e) => ({
          course: { title: e.course.title, titleAr: e.course.titleAr ?? null },
        })),
        userAttempts: userAttempts.map((a) => ({
          userId: a.userId,
          quizId: a.quizId,
          userName: a.userName,
          userEmail: a.userEmail,
          courseTitle: a.courseTitle,
          quizTitle: a.quizTitle,
          score: a.score,
          totalQuestions: a.totalQuestions,
          createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString(),
        })),
      };
    });

    return (
      <StatisticsContent
        studentsCount={students.length}
        totalEnrollments={totalEnrollments}
        attemptsCount={attempts.length}
        totalEarnings={totalEarnings}
        attempts={attemptsSerialized}
        studentsWithDetails={studentsWithDetails}
        titleSuffix={t("dashboard.statisticsPage.titleSuffixTeacher", "(your courses)")}
      />
    );
  }

  const [students, attempts, totalEarnings] = await Promise.all([
    getUsersByRole("STUDENT"),
    getAllQuizAttemptsForAdmin().catch(() => []),
    getTotalPlatformEarnings(),
  ]);

  const enrollmentsByUser = await Promise.all(
    students.map((s) => getEnrollmentsWithCourseByUserId(s.id))
  );

  const activityByUser = await getStudentLearningActivityForUsers(students.map((s) => s.id));

  const totalEnrollments = enrollmentsByUser.reduce((sum, e) => sum + e.length, 0);

  const attemptsSerialized = attempts.map((a) => ({
    userId: a.userId,
    quizId: a.quizId,
    userName: a.userName,
    userEmail: a.userEmail,
    courseTitle: a.courseTitle,
    quizTitle: a.quizTitle,
    score: a.score,
    totalQuestions: a.totalQuestions,
    createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString(),
  }));

  const studentsWithDetails = students.map((s, i) => {
    const enrollments = enrollmentsByUser[i] ?? [];
    const userAttempts = attempts.filter((a) => a.userId === s.id);
    return {
      student: { id: s.id, name: s.name, email: s.email, studentNumber: s.student_number ?? null, guardianNumber: s.guardian_number ?? null },
      completedLessonsCount: activityByUser.get(s.id)?.completedLessonsCount ?? 0,
      homeworkCount: activityByUser.get(s.id)?.homeworkCount ?? 0,
      markedHomeworkCount: activityByUser.get(s.id)?.markedHomeworkCount ?? 0,
      lastLearningActivityAt: activityByUser.get(s.id)?.lastActivityAt ?? null,
      enrollments: enrollments.map((e) => ({
        course: { title: e.course.title, titleAr: e.course.titleAr ?? null },
      })),
      userAttempts: userAttempts.map((a) => ({
        userId: a.userId,
        quizId: a.quizId,
        userName: a.userName,
        userEmail: a.userEmail,
        courseTitle: a.courseTitle,
        quizTitle: a.quizTitle,
        score: a.score,
        totalQuestions: a.totalQuestions,
        createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt.toISOString(),
      })),
    };
  });

  return (
    <StatisticsContent
      studentsCount={students.length}
      totalEnrollments={totalEnrollments}
      attemptsCount={attempts.length}
      totalEarnings={totalEarnings}
      attempts={attemptsSerialized}
      studentsWithDetails={studentsWithDetails}
      titleSuffix=""
    />
  );
}
