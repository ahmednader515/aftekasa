"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";
import type { GradeStageSlug } from "@/lib/grade-stages";

export type GradeStageRow = {
  id: string;
  slug: GradeStageSlug;
  nameAr: string;
  nameEn: string;
  shortLabel: string;
  imageUrl: string;
};

export function GradeStagesImagesForm({ initialStages }: { initialStages: GradeStageRow[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const G = "dashboard.gradeStagesPage";
  const [stages, setStages] = useState(initialStages);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [okById, setOkById] = useState<Record<string, string>>({});

  function setStageImage(id: string, imageUrl: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, imageUrl } : s)));
  }

  function clearMessages(id: string) {
    setErrorById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOkById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function persistImage(id: string, imageUrl: string | null) {
    clearMessages(id);
    setSavingId(id);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorById((prev) => ({
          ...prev,
          [id]: data.error ?? t(`${G}.saveFailed`, "Failed to save image"),
        }));
        return;
      }
      const nextUrl =
        typeof data.imageUrl === "string" && data.imageUrl.trim()
          ? data.imageUrl.trim()
          : "";
      setStageImage(id, nextUrl);
      setOkById((prev) => ({
        ...prev,
        [id]: t(`${G}.saveSuccess`, "Image saved"),
      }));
      router.refresh();
    } catch {
      setErrorById((prev) => ({
        ...prev,
        [id]: t(`${G}.connectionFailed`, "Connection failed"),
      }));
    } finally {
      setSavingId(null);
    }
  }

  async function uploadImage(id: string, file: File) {
    clearMessages(id);
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setErrorById((prev) => ({
          ...prev,
          [id]: data.error ?? t(`${G}.uploadFailed`, "Upload failed"),
        }));
        return;
      }
      setStageImage(id, data.url);
      await persistImage(id, data.url);
    } catch {
      setErrorById((prev) => ({
        ...prev,
        [id]: t(`${G}.connectionFailed`, "Connection failed"),
      }));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {stages.map((stage) => {
        const busy = uploadingId === stage.id || savingId === stage.id;
        const displayName = locale === "en" ? stage.nameEn : stage.nameAr;
        return (
          <div
            key={stage.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                  {stage.shortLabel}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  {displayName || stage.nameAr}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{stage.nameEn}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stage.imageUrl.trim() || "/instructor.png"}
                  alt=""
                  className="h-full w-full object-cover object-[center_18%]"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)]/40">
                  {uploadingId === stage.id
                    ? t(`${G}.uploading`, "Uploading…")
                    : t(`${G}.chooseImage`, "Choose image to upload")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void uploadImage(stage.id, file);
                    }}
                  />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="url"
                    value={stage.imageUrl}
                    disabled={busy}
                    onChange={(e) => {
                      clearMessages(stage.id);
                      setStageImage(stage.id, e.target.value);
                    }}
                    placeholder={t(`${G}.imageUrlPlaceholder`, "Or paste image URL: https://…")}
                    className="min-w-0 flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void persistImage(stage.id, stage.imageUrl.trim() || null)}
                    className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                  >
                    {savingId === stage.id
                      ? t(`${G}.saving`, "Saving…")
                      : t(`${G}.save`, "Save")}
                  </button>
                  {stage.imageUrl.trim() ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setStageImage(stage.id, "");
                        void persistImage(stage.id, null);
                      }}
                      className="text-sm text-red-600 hover:underline disabled:opacity-60"
                    >
                      {t(`${G}.remove`, "Remove")}
                    </button>
                  ) : null}
                </div>

                {errorById[stage.id] ? (
                  <p className="text-sm text-red-600">{errorById[stage.id]}</p>
                ) : null}
                {okById[stage.id] ? (
                  <p className="text-sm text-green-700">{okById[stage.id]}</p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
