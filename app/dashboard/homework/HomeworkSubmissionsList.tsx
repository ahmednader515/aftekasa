"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";

type Row = {
  id: string;
  courseId?: string;
  userId?: string;
  submissionType: string;
  linkUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  markedAt: string | null;
  courseTitle?: string;
  courseTitleAr?: string;
  userName?: string;
  lessonTitle?: string;
  lessonTitleAr?: string;
};

const PAGE_SIZE = 25;

export function HomeworkSubmissionsList({ allowDeleteAll = true }: { allowDeleteAll?: boolean } = {}) {
  const t = useT();
  const router = useRouter();
  const L = "dashboard.homeworkList";
  const { locale, dir, thClass } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);
  const dash = t("dashboard.studentsPage.dash");
  const [list, setList] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = list.slice(pageStart, pageStart + PAGE_SIZE);

  function changePage(nextPage: number) {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
    setSelectedIds(new Set());
  }

  function mapRow(r: Record<string, unknown>): Row {
    const markedRaw = r.markedAt ?? r.marked_at;
    return {
      id: String(r.id ?? ""),
      courseId: r.courseId != null ? String(r.courseId) : r.course_id != null ? String(r.course_id) : undefined,
      userId: r.userId != null ? String(r.userId) : r.user_id != null ? String(r.user_id) : undefined,
      submissionType: String(r.submissionType ?? r.submission_type ?? ""),
      linkUrl: (r.linkUrl ?? r.link_url) as string | null,
      fileUrl: (r.fileUrl ?? r.file_url) as string | null,
      fileName: (r.fileName ?? r.file_name) as string | null,
      createdAt: String(r.createdAt ?? r.created_at ?? ""),
      markedAt: markedRaw != null && String(markedRaw).trim() !== "" ? String(markedRaw) : null,
      courseTitle: r.courseTitle != null ? String(r.courseTitle) : r.course_title != null ? String(r.course_title) : undefined,
      courseTitleAr: r.courseTitleAr != null ? String(r.courseTitleAr) : r.course_title_ar != null ? String(r.course_title_ar) : undefined,
      userName: r.userName != null ? String(r.userName) : r.user_name != null ? String(r.user_name) : undefined,
      lessonTitle: r.lessonTitle != null ? String(r.lessonTitle) : r.lesson_title != null ? String(r.lesson_title) : undefined,
      lessonTitleAr: r.lessonTitleAr != null ? String(r.lessonTitleAr) : r.lesson_title_ar != null ? String(r.lesson_title_ar) : undefined,
    };
  }

  function load(studentName = search, resetPage = false) {
    setLoading(true);
    setLoadError(null);
    const url = studentName.trim()
      ? `/api/homework?studentName=${encodeURIComponent(studentName.trim())}`
      : "/api/homework";
    fetch(url, { credentials: "include" })
      .then(async (r) => {
        const text = await r.text();
        let data: unknown;
        try {
          data = text.trim() ? JSON.parse(text) : r.ok ? [] : {};
        } catch {
          throw new Error(t(`${L}.loadFailed`));
        }
        if (!r.ok) {
          const err =
            data && typeof data === "object" && data !== null && "error" in data
              ? String((data as { error?: unknown }).error ?? "")
              : "";
          throw new Error(err || t(`${L}.loadFailed`));
        }
        return data;
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setSelectedIds(new Set());
        setList(rows.map((r: Record<string, unknown>) => mapRow(r)));
        setPage((previous) => resetPage ? 1 : Math.min(previous, Math.max(1, Math.ceil(rows.length / PAGE_SIZE))));
      })
      .catch((e) => {
        setList([]);
        setLoadError(e instanceof Error ? e.message : t(`${L}.loadSubmitError`));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search, true);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (visibleRows.every((row) => selectedIds.has(row.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(visibleRows.map((r) => r.id)));
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/homework", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error ?? t(`${L}.deleteFailed`));
        return;
      }
      setSelectedIds(new Set());
      load();
    } catch {
      setDeleteError(t(`${L}.deleteFailedGeneric`));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteAll() {
    if (!confirm(t(`${L}.deleteAllConfirm`))) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/homework", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error ?? t(`${L}.deleteFailed`));
        return;
      }
      setSelectedIds(new Set());
      load();
    } catch {
      setDeleteError(t(`${L}.deleteFailedGeneric`));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleMarkAsMarked(row: Row) {
    if (!row.id || row.markedAt || markingId) return;
    setActionError(null);
    setMarkingId(row.id);
    try {
      const res = await fetch(`/api/homework/${encodeURIComponent(row.id)}/mark`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? t(`${L}.markFailed`));
        return;
      }
      const markedAt =
        data.markedAt != null
          ? String(data.markedAt)
          : data.submission
            ? String(data.submission.markedAt ?? data.submission.marked_at ?? new Date().toISOString())
            : new Date().toISOString();
      setList((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, markedAt } : r)),
      );
    } catch {
      setActionError(t(`${L}.markFailedGeneric`));
    } finally {
      setMarkingId(null);
    }
  }

  async function handleOpenChat(row: Row) {
    if (!row.userId) {
      setActionError(t(`${L}.missingStudent`));
      return;
    }
    if (chatLoadingId) return;
    setActionError(null);
    setChatLoadingId(row.id);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId: row.userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) {
        setActionError(data.error ?? t(`${L}.openChatFailed`));
        return;
      }
      router.push(`/dashboard/messages?c=${encodeURIComponent(String(data.id))}`);
    } catch {
      setActionError(t(`${L}.openChatFailed`));
    } finally {
      setChatLoadingId(null);
    }
  }

  if (loading && list.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
        {t(`${L}.loading`)}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(`${L}.searchPlaceholder`)}
          className="min-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t(`${L}.search`)}
        </button>
        {search.trim() && (
          <button
            type="button"
            onClick={() => { setSearch(""); load("", true); }}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            {t(`${L}.showAll`)}
          </button>
        )}
      </form>

      {loadError && (
        <p className="rounded-[var(--radius-btn)] bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {loadError}
        </p>
      )}
      {deleteError && (
        <p className="rounded-[var(--radius-btn)] bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {deleteError}
        </p>
      )}
      {actionError && (
        <p className="rounded-[var(--radius-btn)] bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </p>
      )}
      {list.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleteLoading}
            className="rounded-[var(--radius-btn)] border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 disabled:opacity-50"
          >
            {deleteLoading ? t(`${L}.deleteSelectedBusy`) : fillMessage(t(`${L}.deleteSelected`), { count: selectedIds.size })}
          </button>
          {allowDeleteAll ? (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deleteLoading}
              className="rounded-[var(--radius-btn)] border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {t(`${L}.deleteAll`)}
            </button>
          ) : null}
        </div>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {list.length === 0 && !loadError ? (
          <p className="p-8 text-center text-[var(--color-muted)]">{t(`${L}.empty`)}</p>
        ) : list.length > 0 ? (
          <table className="w-full text-sm" dir={dir}>
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className="w-10 p-3">
                  <label className="flex cursor-pointer items-center justify-center gap-1">
                    <input
                      type="checkbox"
                      checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--color-border)]"
                    />
                    <span className="text-xs text-[var(--color-muted)]">{t(`${L}.colSelectAllLabel`)}</span>
                  </label>
                </th>
                <th className={thClass}>{t(`${L}.colCourse`)}</th>
                <th className={thClass}>{t(`${L}.colLesson`)}</th>
                <th className={thClass}>{t(`${L}.colStudent`)}</th>
                <th className={thClass}>{t(`${L}.colType`)}</th>
                <th className={thClass}>{t(`${L}.colLinkOrFile`)}</th>
                <th className={thClass}>{t(`${L}.colDate`)}</th>
                <th className={thClass}>{t(`${L}.colActions`)}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)]">
                  <td className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-[var(--color-border)]"
                    />
                  </td>
                  <td className="p-3 text-[var(--color-foreground)]">
                    {row.courseTitleAr ?? row.courseTitle ?? dash}
                  </td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {row.lessonTitleAr ?? row.lessonTitle ?? dash}
                  </td>
                  <td className="p-3 font-medium text-[var(--color-foreground)]">
                    {row.userName ?? dash}
                  </td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {row.submissionType === "link" ? t(`${L}.typeLink`) : row.submissionType === "pdf" ? t(`${L}.typePdf`) : t(`${L}.typeImage`)}
                  </td>
                  <td className="p-3">
                    {row.linkUrl ? (
                      <a href={row.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">
                        {row.linkUrl.length > 40 ? row.linkUrl.slice(0, 40) + "…" : row.linkUrl}
                      </a>
                    ) : row.fileUrl ? (
                      <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">
                        {row.fileName || t(`${L}.openFile`)}
                      </a>
                    ) : (
                      dash
                    )}
                  </td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {row.createdAt ? (() => {
                    try {
                      return new Date(row.createdAt).toLocaleString(dateLocale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    } catch {
                      return new Date(row.createdAt).toLocaleString(dateLocale) || String(row.createdAt).slice(0, 16);
                    }
                  })() : dash}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkAsMarked(row)}
                        disabled={!!row.markedAt || markingId === row.id}
                        className={
                          row.markedAt
                            ? "rounded-[var(--radius-btn)] border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 disabled:opacity-80"
                            : "rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                        }
                      >
                        {markingId === row.id
                          ? t(`${L}.markAsMarkedBusy`)
                          : row.markedAt
                            ? t(`${L}.alreadyMarked`)
                            : t(`${L}.markAsMarked`)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenChat(row)}
                        disabled={!row.userId || chatLoadingId === row.id}
                        className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)] disabled:opacity-50"
                      >
                        {chatLoadingId === row.id ? t(`${L}.openChatBusy`) : t(`${L}.openChat`)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
      {list.length > 0 && (
        <nav aria-label={t(`${L}.paginationLabel`)} dir={dir} className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-[var(--color-muted)]">
            {fillMessage(t(`${L}.paginationSummary`), {
              start: pageStart + 1,
              end: Math.min(pageStart + PAGE_SIZE, list.length),
              total: list.length,
              page: currentPage,
              pages: totalPages,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1 || loading || deleteLoading}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {t(`${L}.previousPage`)}
            </button>
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages || loading || deleteLoading}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {t(`${L}.nextPage`)}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
