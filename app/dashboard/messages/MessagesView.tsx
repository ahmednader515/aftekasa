"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useT } from "@/components/LocaleProvider";
import { dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";

type ConversationItem = {
  id: string;
  staffUserId?: string;
  studentUserId?: string;
  studentName?: string;
  staffName?: string;
  staffRole?: string;
  updatedAt?: string;
};

type StaffItem = { id: string; role: string };

type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

type StudentItem = { id: string; name: string; email: string };

type UnreadItem = {
  conversationId: string;
  studentId: string;
  staffId?: string | null;
  unreadCount: number;
};

export function MessagesView({
  isStaff,
  canBulkMessage = false,
  userId,
  userName,
  initialConversationId = null,
}: {
  isStaff: boolean;
  canBulkMessage?: boolean;
  userId: string;
  userName: string;
  initialConversationId?: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const V = "dashboard.messagesView";
  const dateLocale = dateLocaleForUi(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  function roleLabel(role: string) {
    return t(`header.role.${role}`, role);
  }
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [unreadByStudentId, setUnreadByStudentId] = useState<Record<string, number>>({});
  const [unreadByConversationId, setUnreadByConversationId] = useState<Record<string, number>>({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const filteredStudents = !studentSearch.trim()
    ? students
    : students.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(studentSearch.trim().toLowerCase()) ||
          (s.email || "").toLowerCase().includes(studentSearch.trim().toLowerCase())
      );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const ua = unreadByStudentId[a.id] ?? 0;
    const ub = unreadByStudentId[b.id] ?? 0;
    if (ua > 0 && ub === 0) return -1;
    if (ua === 0 && ub > 0) return 1;
    return (a.name || a.email).localeCompare(b.name || b.email, "ar");
  });

  function isPlatformStaffRole(role: string | undefined): boolean {
    return role === "ADMIN" || role === "ASSISTANT_ADMIN";
  }

  function conversationForStaff(staffId: string, staffRole?: string): ConversationItem | undefined {
    const direct = conversations.find((c) => c.staffUserId === staffId);
    if (direct) return direct;
    if (isPlatformStaffRole(staffRole)) {
      return conversations.find((c) => isPlatformStaffRole(c.staffRole));
    }
    return undefined;
  }

  async function refreshUnread() {
    try {
      const res = await fetch("/api/messages/unread", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data.items) ? (data.items as UnreadItem[]) : [];
      if (isStaff) {
        const map: Record<string, number> = {};
        for (const item of items) {
          if (item.studentId) map[item.studentId] = Number(item.unreadCount ?? 0);
        }
        setUnreadByStudentId(map);
      } else {
        const map: Record<string, number> = {};
        for (const item of items) {
          if (item.conversationId) map[item.conversationId] = Number(item.unreadCount ?? 0);
        }
        setUnreadByConversationId(map);
      }
    } catch {
      /* تجاهل */
    }
  }

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        const deepLink = initialConversationId?.trim();
        if (deepLink && list.some((c: ConversationItem) => c.id === deepLink)) {
          setSelectedConversationId(deepLink);
          setSelectedStudentId(null);
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
    if (isStaff) {
      fetch("/api/messages/students")
        .then((r) => r.json())
        .then((data) => setStudents(Array.isArray(data) ? data : []))
        .catch(() => setStudents([]));
      void refreshUnread();
      const id = window.setInterval(() => void refreshUnread(), 25_000);
      return () => window.clearInterval(id);
    } else {
      fetch("/api/messages/staff")
        .then((r) => r.json())
        .then((data) => setStaffList(Array.isArray(data) ? data : []))
        .catch(() => setStaffList([]));
      void refreshUnread();
      const id = window.setInterval(() => void refreshUnread(), 25_000);
      return () => window.clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, initialConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    fetch(`/api/messages/conversations/${selectedConversationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        const studentId =
          (data.conversation?.studentUserId as string | undefined) ??
          conversations.find((c) => c.id === selectedConversationId)?.studentUserId;
        if (studentId) {
          setUnreadByStudentId((prev) => {
            if (!(studentId in prev)) return prev;
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
        }
        setUnreadByConversationId((prev) => {
          if (!(selectedConversationId in prev)) return prev;
          const next = { ...prev };
          delete next[selectedConversationId];
          return next;
        });
        void refreshUnread();
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, messagesLoading]);

  async function openChatWithStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setSending(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const conv = await res.json();
      if (conv.id) {
        setSelectedConversationId(conv.id);
        setConversations((prev) => {
          const name =
            students.find((s) => s.id === studentId)?.name ??
            t(`${V}.studentFallback`);
          const withoutDupes = prev.filter(
            (c) => c.id !== conv.id && c.studentUserId !== studentId
          );
          return [{ id: conv.id, studentName: name, studentUserId: studentId, ...conv }, ...withoutDupes];
        });
      }
    } finally {
      setSending(false);
    }
  }

  function selectConversation(convId: string) {
    setSelectedConversationId(convId);
    setSelectedStudentId(null);
  }

  async function deleteMessage(msgId: string) {
    if (deletingId) return;
    setDeletingId(msgId);
    try {
      const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function openChatWithStaff(staffId: string) {
    const staff = staffList.find((s) => s.id === staffId);
    const existing = conversationForStaff(staffId, staff?.role);
    if (existing) {
      setSelectedConversationId(existing.id);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      const conv = await res.json();
      if (conv.id) {
        setSelectedConversationId(conv.id);
        const staff = staffList.find((s) => s.id === staffId);
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [{ id: conv.id, staffUserId: staffId, staffRole: staff?.role, ...conv }, ...prev];
        });
      }
    } finally {
      setSending(false);
    }
  }

  async function sendText() {
    const trimmed = text.trim();
    if (!trimmed || !selectedConversationId || sending) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConversationId, messageType: "text", content: trimmed }),
      });
      const msg = await res.json();
      if (msg.id) setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }

  function openBulkModal() {
    setBulkOpen(true);
    setBulkText("");
    setBulkError(null);
    setBulkResult(null);
  }

  function closeBulkModal() {
    if (bulkSending) return;
    setBulkOpen(false);
    setBulkText("");
    setBulkError(null);
    setBulkResult(null);
  }

  async function sendBulkMessage() {
    const trimmed = bulkText.trim();
    if (!trimmed) {
      setBulkError(t(`${V}.bulkEmptyError`));
      return;
    }
    if (students.length === 0) {
      setBulkError(t(`${V}.bulkNoStudents`));
      return;
    }
    if (bulkSending) return;
    setBulkSending(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(typeof data.error === "string" ? data.error : t(`${V}.bulkFailed`));
        return;
      }
      const sent = Number(data.sent ?? 0);
      const failed = Number(data.failed ?? 0);
      const total = Number(data.total ?? 0);
      if (failed > 0) {
        setBulkResult(fillMessage(t(`${V}.bulkPartialFail`), { sent, failed }));
      } else {
        setBulkResult(fillMessage(t(`${V}.bulkSuccess`), { sent, total }));
      }
      setBulkText("");
    } catch {
      setBulkError(t(`${V}.bulkFailed`));
    } finally {
      setBulkSending(false);
    }
  }

  async function sendFile(type: "image" | "file") {
    if (!selectedConversationId || sending || fileUploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "image/*,.pdf,.doc,.docx,.xls,.xlsx";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setFileUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const up = await fetch("/api/upload/message", { method: "POST", body: formData });
        const upData = await up.json();
        if (!up.ok || !upData.url) {
          setFileUploading(false);
          return;
        }
        setSending(true);
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversationId,
            messageType: upData.messageType || type,
            fileUrl: upData.url,
            fileName: upData.fileName || file.name,
          }),
        });
        const msg = await res.json();
        if (msg.id) setMessages((prev) => [...prev, msg]);
      } finally {
        setSending(false);
        setFileUploading(false);
      }
    };
    input.click();
  }

  const currentTitle = selectedConversationId
    ? isStaff
      ? conversations.find((c) => c.id === selectedConversationId)?.studentName ?? students.find((s) => s.id === selectedStudentId)?.name ?? t(`${V}.studentFallback`)
      : (() => {
          const conv = conversations.find((c) => c.id === selectedConversationId);
          if (conv?.staffRole) return roleLabel(conv.staffRole);
          return conv?.staffName ?? t(`${V}.staffFallbackAdmin`);
        })()
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {isStaff ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-medium text-[var(--color-foreground)]">{t(`${V}.studentsHeading`)}</h3>
              {canBulkMessage ? (
                <button
                  type="button"
                  onClick={openBulkModal}
                  disabled={bulkSending || students.length === 0}
                  className="shrink-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-50"
                >
                  {t(`${V}.bulkOpenBtn`)}
                </button>
              ) : null}
            </div>
            <input
              type="search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={t(`${V}.searchPlaceholderStaff`)}
              className="mb-3 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm placeholder:text-[var(--color-muted)]"
            />
            <ul className="max-h-[420px] space-y-1 overflow-y-auto">
              {sortedStudents.map((s) => {
                const unread = unreadByStudentId[s.id] ?? 0;
                const isActive =
                  selectedStudentId === s.id ||
                  conversations.find((c) => c.id === selectedConversationId)?.studentUserId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openChatWithStudent(s.id)}
                      disabled={sending}
                      className={`flex w-full items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-right text-sm ${
                        isActive
                          ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                          : "hover:bg-[var(--color-background)]"
                      }`}
                    >
                      {unread > 0 ? (
                        <span
                          className="relative inline-flex h-2.5 w-2.5 shrink-0"
                          title={t(`${V}.unreadDotTitle`, "Unread messages")}
                          aria-label={t(`${V}.unreadDotTitle`, "Unread messages")}
                        >
                          <span className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-40" />
                          <span className="relative m-auto h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        </span>
                      ) : null}
                      <span className={`min-w-0 flex-1 truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>
                        {s.name || s.email}
                      </span>
                    </button>
                  </li>
                );
              })}
              {students.length === 0 && !loading && <p className="text-sm text-[var(--color-muted)]">{t(`${V}.noStudents`)}</p>}
              {students.length > 0 && filteredStudents.length === 0 && <p className="text-sm text-[var(--color-muted)]">{t(`${V}.noSearchResultsStaff`)}</p>}
            </ul>
          </>
        ) : (
          <>
            <h3 className="mb-3 font-medium text-[var(--color-foreground)]">{t(`${V}.messagingStaffHeading`)}</h3>
            {loading ? (
              <p className="text-sm text-[var(--color-muted)]">{t(`${V}.loading`)}</p>
            ) : (
              <ul className="space-y-1">
                {staffList.map((s) => {
                  const conv = conversationForStaff(s.id, s.role);
                  const label = roleLabel(s.role);
                  const unread = conv ? (unreadByConversationId[conv.id] ?? 0) : 0;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => (conv ? selectConversation(conv.id) : openChatWithStaff(s.id))}
                        disabled={sending}
                        className={`flex w-full items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-right text-sm ${
                          selectedConversationId === conv?.id
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                            : "hover:bg-[var(--color-background)]"
                        }`}
                      >
                        {unread > 0 ? (
                          <span
                            className="relative inline-flex h-2.5 w-2.5 shrink-0"
                            title={t(`${V}.unreadDotTitle`, "Unread messages")}
                            aria-label={t(`${V}.unreadDotTitle`, "Unread messages")}
                          >
                            <span className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-40" />
                            <span className="relative m-auto h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                          </span>
                        ) : null}
                        <span className={`min-w-0 flex-1 truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>
                          {label}
                        </span>
                        {unread > 1 ? (
                          <span className="shrink-0 rounded-full bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                            {unread}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && staffList.length === 0 && <p className="text-sm text-[var(--color-muted)]">{t(`${V}.noContactsStaff`)}</p>}
          </>
        )}
      </div>

      <div className="flex min-h-[400px] flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {!selectedConversationId ? (
          <div className="flex flex-1 items-center justify-center text-[var(--color-muted)]">
            {isStaff ? t(`${V}.selectPromptStaff`) : t(`${V}.selectPromptStudent`)}
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--color-border)] px-4 py-2 font-medium text-[var(--color-foreground)]">
              {currentTitle}
            </div>
            <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <p className="text-sm text-[var(--color-muted)]">{t(`${V}.loadingMessages`)}</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">{t(`${V}.noMessagesYet`, "No messages yet.")}</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isMe = m.senderId === userId;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                        <div className={`relative max-w-[85%] rounded-[var(--radius-btn)] px-3 py-2 ${isMe ? "bg-[var(--color-primary)]/15 text-[var(--color-foreground)]" : "bg-[var(--color-background)] text-[var(--color-foreground)]"}`}>
                          {m.messageType === "text" && <p className="whitespace-pre-wrap text-sm">{m.content}</p>}
                          {(m.messageType === "image" || m.messageType === "file") && m.fileUrl && (
                            <div>
                              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-primary)] underline">
                                {m.fileName ?? t(`${V}.openFile`)}
                              </a>
                              {m.messageType === "image" && (
                                <img src={m.fileUrl} alt="" className="mt-2 max-h-48 rounded-[var(--radius-btn)] object-cover" />
                              )}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-[var(--color-muted)]">
                              {new Date(m.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                            </p>
                            {isMe && (
                              <button
                                type="button"
                                onClick={() => deleteMessage(m.id)}
                                disabled={deletingId === m.id}
                                title={t(`${V}.deleteMessageTitle`)}
                                className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-background)] hover:text-red-500 disabled:opacity-50"
                              >
                                {deletingId === m.id ? (
                                  <span className="text-xs">...</span>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="border-t border-[var(--color-border)] p-3">
              <div className="flex flex-wrap items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendText())}
                  placeholder={t(`${V}.messagePlaceholder`)}
                  rows={2}
                  className="min-w-[200px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => sendFile("image")}
                    disabled={fileUploading || sending}
                    title={t(`${V}.imageTitle`)}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
                  >
                    📷
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFile("file")}
                    disabled={fileUploading || sending}
                    title={t(`${V}.fileTitle`)}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
                  >
                    📎
                  </button>
                  <button
                    type="button"
                    onClick={sendText}
                    disabled={sending || !text.trim()}
                    className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {t(`${V}.send`)}
                  </button>
                </div>
              </div>
              {fileUploading && <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`${V}.uploadingFile`)}</p>}
            </div>
          </>
        )}
      </div>

      {bulkOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            dir={dir}
            className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t(`${V}.bulkModalTitle`)}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${V}.bulkModalHelp`)}</p>
            {bulkError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{bulkError}</p>
            ) : null}
            {bulkResult ? (
              <p className="mt-3 text-sm text-green-700 dark:text-green-400">{bulkResult}</p>
            ) : null}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t(`${V}.bulkMessageLabel`)}
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={5}
                disabled={bulkSending}
                placeholder={t(`${V}.bulkMessagePlaceholder`)}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {students.length > 0
                  ? fillMessage(t(`${V}.bulkRecipientCount`), { count: students.length })
                  : t(`${V}.bulkNoStudents`)}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkSending}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50"
              >
                {t(`${V}.bulkCancel`)}
              </button>
              <button
                type="button"
                onClick={() => void sendBulkMessage()}
                disabled={bulkSending || !bulkText.trim() || students.length === 0}
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {bulkSending ? t(`${V}.bulkSending`) : t(`${V}.bulkConfirm`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
