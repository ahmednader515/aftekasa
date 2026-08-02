import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getHomeworkSubmissionWithDetailsById,
  markHomeworkSubmissionAsMarked,
  getOrCreateConversation,
  createMessage,
} from "@/lib/db";

function field(row: Record<string, unknown>, camel: string, snake: string): unknown {
  return row[camel] ?? row[snake];
}

function buildMarkedMessage(submission: Record<string, unknown>): string {
  const course =
    String(field(submission, "courseTitleAr", "course_title_ar") ?? "").trim() ||
    String(field(submission, "courseTitle", "course_title") ?? "").trim() ||
    "الدورة";
  const lesson =
    String(field(submission, "lessonTitleAr", "lesson_title_ar") ?? "").trim() ||
    String(field(submission, "lessonTitle", "lesson_title") ?? "").trim();
  if (lesson) {
    return `تم تصحيح واجبك في دورة «${course}» — الحصة «${lesson}». يمكنك فتح المحادثة هنا لأي استفسار.`;
  }
  return `تم تصحيح واجبك في دورة «${course}». يمكنك فتح المحادثة هنا لأي استفسار.`;
}

/** تعليم تسليم واجب كمصحّح وإرسال رسالة للطالب في صندوق الوارد */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const role = session.user.role;
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN";
  const isTeacher = role === "TEACHER";
  if (!isStaff && !isTeacher) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id: submissionId } = await params;
  if (!submissionId?.trim()) {
    return NextResponse.json({ error: "معرف التسليم مطلوب" }, { status: 400 });
  }

  try {
    const teacherId = isTeacher ? session.user.id : null;
    const existing = await getHomeworkSubmissionWithDetailsById(submissionId, {
      teacherId,
    });
    if (!existing) {
      return NextResponse.json({ error: "التسليم غير موجود" }, { status: 404 });
    }

    const existingRow = existing as unknown as Record<string, unknown>;
    const alreadyMarked = !!field(existingRow, "markedAt", "marked_at");
    const submission = alreadyMarked
      ? existing
      : await markHomeworkSubmissionAsMarked(submissionId, { teacherId });

    if (!submission) {
      return NextResponse.json({ error: "التسليم غير موجود" }, { status: 404 });
    }

    const submissionRow = submission as unknown as Record<string, unknown>;
    const studentId = String(field(submissionRow, "userId", "user_id") ?? "").trim();
    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالب غير متوفر" }, { status: 500 });
    }

    const conversation = await getOrCreateConversation(session.user.id, studentId);
    let messageSent = false;
    if (!alreadyMarked) {
      await createMessage({
        conversation_id: conversation.id,
        sender_id: session.user.id,
        message_type: "text",
        content: buildMarkedMessage(submissionRow),
      });
      messageSent = true;
    }

    return NextResponse.json({
      success: true,
      alreadyMarked,
      messageSent,
      markedAt: field(submissionRow, "markedAt", "marked_at") ?? null,
      conversationId: conversation.id,
      submission,
    });
  } catch (err) {
    console.error("[POST /api/homework/[id]/mark]", err);
    const message =
      err instanceof Error && err.message.trim() !== ""
        ? err.message
        : "فشل تعليم الواجب كمصحّح";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
