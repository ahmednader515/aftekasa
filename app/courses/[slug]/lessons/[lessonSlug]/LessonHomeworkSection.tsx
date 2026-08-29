"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLessonUnlock } from "@/components/LessonWatchShell";

type Submission = {
  id: string;
  submission_type: string;
  link_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

type PendingImage = {
  localId: string;
  url: string;
  fileName: string;
  previewUrl: string;
};

export function LessonHomeworkSection({
  lessonId,
  required = false,
}: {
  lessonId: string;
  required?: boolean;
}) {
  const router = useRouter();
  const unlock = useLessonUnlock();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<"link" | "pdf" | "image">("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSubmissions = useCallback(() => {
    return fetch(`/api/homework?lessonId=${encodeURIComponent(lessonId)}`)
      .then((r) => r.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]));
  }, [lessonId]);

  useEffect(() => {
    loadSubmissions().finally(() => setLoading(false));
  }, [loadSubmissions]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [pendingImages]);

  function onSubmitSuccess() {
    unlock?.notifyHomeworkSubmitted();
  }

  async function handleSubmitLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const url = linkUrl.trim();
    if (!url || !url.startsWith("http")) {
      setError("أدخل رابطاً صالحاً يبدأ بـ http");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, type: "link", linkUrl: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "فشل التسليم");
        return;
      }
      setSuccess("تم تسليم الرابط بنجاح");
      setLinkUrl("");
      await loadSubmissions();
      onSubmitSuccess();
    } catch {
      setError("حدث خطأ");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/homework", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "فشل الرفع");
        return;
      }
      setFileUrl(data.url ?? "");
      setFileName(data.fileName ?? file.name);
    } catch {
      setError("فشل الرفع");
    } finally {
      setFileUploading(false);
      e.target.value = "";
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    setFileUploading(true);
    try {
      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/homework", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          URL.revokeObjectURL(previewUrl);
          setError(data.error ?? "فشل رفع إحدى الصور");
          continue;
        }
        setPendingImages((prev) => [
          ...prev,
          {
            localId: crypto.randomUUID(),
            url: data.url ?? "",
            fileName: data.fileName ?? file.name,
            previewUrl,
          },
        ]);
      }
    } catch {
      setError("فشل الرفع");
    } finally {
      setFileUploading(false);
      e.target.value = "";
    }
  }

  function removePendingImage(localId: string) {
    setPendingImages((prev) => {
      const item = prev.find((p) => p.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  async function handleSubmitPdf(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!fileUrl.trim()) {
      setError("ارفع ملفاً أولاً ثم اضغط تسليم");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, type: "pdf", fileUrl: fileUrl.trim(), fileName: fileName.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "فشل التسليم");
        return;
      }
      setSuccess("تم تسليم الملف بنجاح");
      setFileUrl("");
      setFileName("");
      await loadSubmissions();
      onSubmitSuccess();
    } catch {
      setError("حدث خطأ");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleSubmitImages() {
    setError("");
    setSuccess("");
    if (pendingImages.length === 0) {
      setError("ارفع صورة واحدة على الأقل");
      return;
    }
    setSubmitLoading(true);
    try {
      for (const img of pendingImages) {
        const res = await fetch("/api/homework/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            type: "image",
            fileUrl: img.url,
            fileName: img.fileName,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "فشل تسليم إحدى الصور");
          return;
        }
      }
      setSuccess(`تم تسليم ${pendingImages.length} صورة بنجاح`);
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setPendingImages([]);
      await loadSubmissions();
      onSubmitSuccess();
    } catch {
      setError("حدث خطأ");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteSubmission(id: string) {
    if (!id || deletingId) return;
    setError("");
    setDeletingId(id);
    try {
      const res = await fetch("/api/homework", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "فشل الحذف");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch {
      setError("حدث خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
        إرسال الواجب
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {required
          ? "تسليم الواجب مطلوب لفتح الحصة التالية. يمكنك إرسال رابط أو ملف PDF أو صورة."
          : "يمكنك إرسال رابط أو ملف PDF أو صورة كواجب لهذه الحصة."}
      </p>
      {error && (
        <div className="mt-3 rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-[var(--radius-btn)] bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium ${mode === "link" ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] bg-[var(--color-background)]"}`}
        >
          رابط
        </button>
        <button
          type="button"
          onClick={() => setMode("pdf")}
          className={`rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium ${mode === "pdf" ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] bg-[var(--color-background)]"}`}
        >
          ملف PDF
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium ${mode === "image" ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] bg-[var(--color-background)]"}`}
        >
          صورة
        </button>
      </div>

      {mode === "link" && (
        <form onSubmit={handleSubmitLink} className="mt-4">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
          />
          <button type="submit" disabled={submitLoading} className="mt-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {submitLoading ? "جاري التسليم..." : "تسليم الرابط"}
          </button>
        </form>
      )}

      {mode === "pdf" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">
            رفع ملف PDF
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfSelect}
            disabled={fileUploading}
            className="mt-1 block w-full text-sm text-[var(--color-muted)] file:mr-2 file:rounded-[var(--radius-btn)] file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-white"
          />
          {fileUrl && (
            <form onSubmit={handleSubmitPdf} className="mt-2">
              <p className="text-sm text-[var(--color-muted)]">{fileName || "تم اختيار الملف"}</p>
              <button type="submit" disabled={submitLoading} className="mt-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {submitLoading ? "جاري التسليم..." : "تسليم الملف"}
              </button>
            </form>
          )}
        </div>
      )}

      {mode === "image" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">
            رفع صورة
          </label>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            يمكنك اختيار أكثر من صورة — الحد الأقصى 15 ميجابايت لكل صورة
          </p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            disabled={fileUploading}
            className="mt-1 block w-full text-sm text-[var(--color-muted)] file:mr-2 file:rounded-[var(--radius-btn)] file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-white"
          />
          {fileUploading && (
            <p className="mt-2 text-sm text-[var(--color-muted)]">جاري الرفع...</p>
          )}
          {pendingImages.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pendingImages.map((img) => (
                  <div
                    key={img.localId}
                    className="relative overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.fileName}
                      className="h-28 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingImage(img.localId)}
                      className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
                      title="حذف"
                      aria-label="حذف الصورة"
                    >
                      ×
                    </button>
                    <p className="truncate px-2 py-1 text-xs text-[var(--color-muted)]">{img.fileName}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleSubmitImages()}
                disabled={submitLoading}
                className="mt-3 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitLoading ? "جاري التسليم..." : `تسليم الصور (${pendingImages.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--color-muted)]">جاري التحميل...</p>
      ) : submissions.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[var(--color-foreground)]">تسليماتك السابقة</h3>
          <ul className="mt-2 space-y-2">
            {submissions.map((s, i) => (
              <li
                key={s.id || i}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {s.submission_type === "image" && s.file_url ? (
                  <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={s.file_url}
                      alt={s.file_name || "صورة مرفوعة"}
                      className="h-16 w-16 rounded-[var(--radius-btn)] border border-[var(--color-border)] object-cover"
                    />
                  </a>
                ) : s.submission_type === "link" && s.link_url ? (
                  <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">
                    {s.link_url}
                  </a>
                ) : (s.file_url || s.link_url) ? (
                  <a href={s.file_url || s.link_url || "#"} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">
                    {s.file_name || "ملف مرفوع"}
                  </a>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {s.submission_type === "image" && s.file_name && (
                    <span className="truncate text-[var(--color-foreground)]">{s.file_name}</span>
                  )}
                  <span className="text-[var(--color-muted)]">
                    {new Date(s.created_at).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                {s.id && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteSubmission(s.id)}
                    disabled={deletingId === s.id}
                    className="shrink-0 rounded-[var(--radius-btn)] border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    {deletingId === s.id ? "جاري الحذف..." : "حذف"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
