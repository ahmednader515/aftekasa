import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  categoryIsManageableOnDashboard,
  deleteCategory,
  getCategoryById,
  updateCategoryImage,
} from "@/lib/db";
import { isGradeStageSlug } from "@/lib/grade-stages";

/** تحديث صورة قسم المرحلة الدراسية — أدمن/مساعد فقط */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });
  }

  const existing = await getCategoryById(id);
  if (!existing) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }
  const slug = String((existing as { slug?: string }).slug ?? "");
  if (!isGradeStageSlug(slug)) {
    return NextResponse.json(
      { error: "يمكن تحديث صورة المراحل الدراسية الثابتة فقط من هنا" },
      { status: 400 }
    );
  }

  let body: { imageUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  if (body.imageUrl === undefined) {
    return NextResponse.json({ error: "imageUrl مطلوب" }, { status: 400 });
  }

  try {
    const updated = await updateCategoryImage(
      id,
      body.imageUrl === null ? null : String(body.imageUrl)
    );
    if (!updated) {
      return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
    }
    const row = updated as unknown as Record<string, unknown>;
    return NextResponse.json({
      id: row.id,
      slug: row.slug,
      imageUrl: (row.imageUrl ?? row.image_url ?? null) as string | null,
    });
  } catch (e) {
    console.error("API categories [id] PATCH:", e);
    return NextResponse.json({ error: "فشل تحديث الصورة" }, { status: 500 });
  }
}

/** حذف قسم — الأدمن/المساعد: أقسام المنصة وأقسام الأدمن فقط؛ المدرس: أقسامه فقط. الدورات المرتبطة تصبح بدون قسم */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });
  }

  const allowed = await categoryIsManageableOnDashboard(id, session.user.id, role);
  if (!allowed) {
    return NextResponse.json({ error: "لا يمكن حذف هذا القسم" }, { status: 403 });
  }

  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "GRADE_STAGE_PROTECTED") {
      return NextResponse.json({ error: "لا يمكن حذف المراحل الدراسية الثابتة" }, { status: 403 });
    }
    console.error("API categories [id] DELETE:", e);
    return NextResponse.json({ error: "فشل حذف القسم" }, { status: 500 });
  }
}
