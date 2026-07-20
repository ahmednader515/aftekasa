import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUnreadStaffMessageNotificationsForStudent,
  getUnreadStudentMessageNotifications,
} from "@/lib/db";
import type { UserRole } from "@/lib/types";

function serializeItems(
  items: Awaited<ReturnType<typeof getUnreadStudentMessageNotifications>>["items"],
) {
  return items.map((item) => ({
    conversationId: item.conversationId,
    studentId: item.studentId,
    studentName: item.studentName,
    staffId: item.staffId ?? null,
    staffName: item.staffName ?? null,
    staffRole: item.staffRole ?? null,
    preview: item.preview,
    unreadCount: item.unreadCount,
    latestAt: item.latestAt,
  }));
}

/** إشعارات الرسائل غير المقروءة — للموظف (من الطلاب) أو للطالب (من الإدارة/المدرس) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role as UserRole;

  try {
    if (role === "STUDENT") {
      const data = await getUnreadStaffMessageNotificationsForStudent(session.user.id);
      return NextResponse.json({
        count: data.count,
        items: serializeItems(data.items),
      });
    }

    if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ count: 0, items: [] });
    }

    const data = await getUnreadStudentMessageNotifications(session.user.id, role);
    return NextResponse.json({
      count: data.count,
      items: serializeItems(data.items),
    });
  } catch (e) {
    console.error("GET /api/messages/unread", e);
    return NextResponse.json({ count: 0, items: [] });
  }
}
