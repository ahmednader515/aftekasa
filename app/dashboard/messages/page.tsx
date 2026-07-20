import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { MessagesView } from "./MessagesView";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isStaff =
    session.user.role === "ADMIN" ||
    session.user.role === "ASSISTANT_ADMIN" ||
    session.user.role === "TEACHER";
  const isStudent = session.user.role === "STUDENT";
  if (!isStaff && !isStudent) redirect("/dashboard");
  const canBulkMessage = isStaff;
  const t = await getServerTranslator();
  const params = await searchParams;
  const initialConversationId = typeof params.c === "string" ? params.c.trim() : null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[var(--color-foreground)]">
        {isStaff ? t("dashboard.messagesPage.staffTitlePrivate") : t("dashboard.messagesPage.studentTitleInbox")}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {isStaff
          ? session.user.role === "TEACHER"
            ? t("dashboard.messagesPage.staffSubtitleTeacher")
            : t("dashboard.messagesPage.staffSubtitleAdmin")
          : t("dashboard.messagesPage.studentSubtitle")}
      </p>
      <MessagesView
        isStaff={isStaff}
        canBulkMessage={canBulkMessage}
        userId={session.user.id}
        userName={session.user.name ?? ""}
        initialConversationId={initialConversationId}
      />
    </div>
  );
}
