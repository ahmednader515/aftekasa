import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getConversationById,
  canUserAccessConversation,
  markConversationReadForUser,
} from "@/lib/db";
import type { UserRole } from "@/lib/types";

/** تعليم محادثة كمقروءة للموظف الحالي */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role as UserRole;
  if (
    role !== "ADMIN" &&
    role !== "ASSISTANT_ADMIN" &&
    role !== "TEACHER" &&
    role !== "STUDENT"
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id: conversationId } = await params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  }

  const allowed = await canUserAccessConversation(session.user.id, role, conversation);
  if (!allowed) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await markConversationReadForUser(conversationId, session.user.id);
  return NextResponse.json({ success: true });
}
