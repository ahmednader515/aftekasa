"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

const baseClass =
  "rounded-[var(--radius-btn)] border px-4 py-2 text-sm font-medium transition";
const inactiveClass =
  "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50";
const activeClass =
  "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]";

function NavLink({
  href,
  children,
  exact = false,
  badgeCount = 0,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 ${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {children}
      {badgeCount > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
          {badgeLabel}
        </span>
      ) : null}
    </Link>
  );
}

function StudentInboxNavLink() {
  const t = useT();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.count ?? 0));
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(id);
  }, [refresh, pathname]);

  return (
    <NavLink href="/dashboard/messages" badgeCount={count}>
      {t("dashboardNav.inbox", "Inbox")}
    </NavLink>
  );
}

export function DashboardNav({
  isAdmin,
  isAssistant,
  isTeacher,
}: {
  isAdmin: boolean;
  isAssistant: boolean;
  isTeacher: boolean;
}) {
  const t = useT();
  const isStaff = isAdmin || isAssistant;

  if (isTeacher) {
    return (
      <>
        <NavLink href="/dashboard/courses">{t("dashboardNav.manageMyCourses", "Manage my courses")}</NavLink>
        <NavLink href="/dashboard/courses/new" exact>
          {t("dashboardNav.createCourse", "Create course")}
        </NavLink>
        <NavLink href="/dashboard/quizzes">{t("dashboardNav.manageQuizzes", "Manage quizzes")}</NavLink>
        <NavLink href="/dashboard/statistics">{t("dashboardNav.studentStats", "Student statistics")}</NavLink>
        <NavLink href="/dashboard/codes">{t("dashboardNav.createCodes", "Create codes")}</NavLink>
        <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
        <NavLink href="/dashboard/messages">{t("dashboardNav.contactMyStudents", "Contact my students")}</NavLink>
        <NavLink href="/dashboard/live-streams">{t("dashboardNav.liveStreams", "Live streams")}</NavLink>
      </>
    );
  }

  if (!isStaff) {
    return (
      <>
        <StudentInboxNavLink />
        <Link
          href="/courses"
          className={`${baseClass} ${inactiveClass}`}
        >
          {t("dashboardNav.availableCourses", "Available courses")}
        </Link>
      </>
    );
  }

  return (
    <>
      <NavLink href="/dashboard/students">
        {isAdmin ? t("dashboardNav.studentsAccounts", "Students & accounts") : t("dashboardNav.students", "Students")}
      </NavLink>
      <NavLink href="/dashboard/statistics">
        {t("dashboardNav.studentStats", "Student statistics")}
      </NavLink>
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/password-change-requests">
          {t("dashboardNav.passwordChangeRequests", "Account change requests")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/codes">
          {t("dashboardNav.createCodes", "Create codes")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/homework">
          {t("dashboardNav.homework", "Student homework")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/messages">
          {t("dashboardNav.privateStudentMessages", "Private student messages")}
        </NavLink>
      )}
      {isAdmin && (
        <>
          <NavLink href="/dashboard/courses">
            {t("dashboardNav.manageCourses", "Manage courses")}
          </NavLink>
          <NavLink href="/dashboard/courses/new" exact>
            {t("dashboardNav.createCourse", "Create course")}
          </NavLink>
          <NavLink href="/dashboard/reviews">
            {t("dashboardNav.studentReviews", "Student reviews")}
          </NavLink>
          <NavLink href="/dashboard/settings/copyright-overlay">
            {t("dashboardNav.copyrightSettings", "Copyright code settings")}
          </NavLink>
          <NavLink href="/dashboard/live-streams">
            {t("dashboardNav.liveStreams", "Live streams")}
          </NavLink>
          <NavLink href="/dashboard/teachers">{t("dashboardNav.multipleTeachers", "Multiple teachers")}</NavLink>
          <NavLink href="/dashboard/subscriptions">{t("dashboardNav.platformSubscriptions", "Platform subscriptions")}</NavLink>
          <NavLink href="/dashboard/subscription-students">{t("dashboardNav.subscribedStudents", "Subscribed students")}</NavLink>
          <NavLink href="/dashboard/store">{t("dashboardNav.platformStore", "Platform store")}</NavLink>
        </>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/quizzes">{t("dashboardNav.manageQuizzes", "Manage quizzes")}</NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/settings/homepage">
          {t("dashboardNav.homepageSettings", "Homepage settings")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/settings/grade-stages">
          {t("dashboardNav.gradeStages", "Educational stage cards")}
        </NavLink>
      )}
      {(isAdmin || isAssistant) && (
        <NavLink href="/dashboard/settings/add-balance">
          {t("dashboardNav.paymentMethods", "Student payment methods")}
        </NavLink>
      )}
    </>
  );
}
