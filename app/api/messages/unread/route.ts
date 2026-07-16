import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnreadStudentMessageNotifications } from "@/lib/db";
import type { UserRole } from "@/lib/types";

/** إشعارات رسائل الطلاب غير المقروءة للموظف */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role as UserRole;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ count: 0, items: [] });
  }

  try {
    const data = await getUnreadStudentMessageNotifications(session.user.id, role);
    return NextResponse.json({
      count: data.count,
      items: data.items.map((item) => ({
        conversationId: item.conversationId,
        studentId: item.studentId,
        studentName: item.studentName,
        preview: item.preview,
        unreadCount: item.unreadCount,
        latestAt: item.latestAt,
      })),
    });
  } catch (e) {
    console.error("GET /api/messages/unread", e);
    return NextResponse.json({ count: 0, items: [] });
  }
}
