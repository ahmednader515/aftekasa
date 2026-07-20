import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createMessage,
  getOrCreateConversation,
  getStudentsEnrolledInTeacherCourses,
  getUsersByRole,
} from "@/lib/db";

export const maxDuration = 60;

const BATCH_SIZE = 10;

/** إرسال رسالة جماعية لكل طلاب غرف الدردشة */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "محتوى النص مطلوب" }, { status: 400 });
  }

  const students =
    role === "TEACHER"
      ? await getStudentsEnrolledInTeacherCourses(session.user.id)
      : await getUsersByRole("STUDENT");

  if (students.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0 });
  }

  let sent = 0;
  let failed = 0;
  const failedStudentIds: string[] = [];

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (student) => {
        const conversation = await getOrCreateConversation(session.user.id, student.id);
        await createMessage({
          conversation_id: conversation.id,
          sender_id: session.user.id,
          message_type: "text",
          content,
        });
        return student.id;
      })
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        sent += 1;
      } else {
        failed += 1;
        failedStudentIds.push(batch[j].id);
      }
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: students.length,
    failedStudentIds: failedStudentIds.length > 0 ? failedStudentIds : undefined,
  });
}
