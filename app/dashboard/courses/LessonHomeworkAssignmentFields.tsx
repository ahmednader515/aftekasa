"use client";

import { useState } from "react";
import type { HomeworkMaterial } from "@/lib/homework-materials";

type Props = {
  acceptsHomework: boolean;
  materials: HomeworkMaterial[];
  explanationVideoUrl: string;
  onAcceptsHomeworkChange: (value: boolean) => void;
  onMaterialsChange: (materials: HomeworkMaterial[]) => void;
  onExplanationVideoUrlChange: (url: string) => void;
  labels: {
    homeworkCheckbox: string;
    materialsLabel: string;
    materialsHelp: string;
    uploadPdf: string;
    uploadImage: string;
    uploading: string;
    remove: string;
    uploadSizeHint?: string;
    explanationVideoLabel: string;
    explanationVideoHelp: string;
    explanationVideoPlaceholder: string;
  };
};

export function LessonHomeworkAssignmentFields({
  acceptsHomework,
  materials,
  explanationVideoUrl,
  onAcceptsHomeworkChange,
  onMaterialsChange,
  onExplanationVideoUrlChange,
  labels,
}: Props) {
  const [uploading, setUploading] = useState<"pdf" | "image" | null>(null);

  async function uploadMaterial(file: File, type: "pdf" | "image") {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const endpoint = type === "pdf" ? "/api/upload/pdf" : "/api/upload/image";
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        onMaterialsChange([
          ...materials,
          {
            url: String(data.url),
            fileName: String(data.fileName ?? file.name),
            type,
          },
        ]);
      }
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-3 pt-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={acceptsHomework}
          onChange={(e) => onAcceptsHomeworkChange(e.target.checked)}
          className="rounded border-[var(--color-border)]"
        />
        <span className="text-sm text-[var(--color-foreground)]">{labels.homeworkCheckbox}</span>
      </label>

      {acceptsHomework ? (
        <div className="space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.materialsLabel}</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{labels.materialsHelp}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-block cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm">
                {uploading === "pdf" ? labels.uploading : labels.uploadPdf}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadMaterial(f, "pdf");
                  }}
                />
              </label>
              <label className="inline-block cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm">
                {uploading === "image" ? labels.uploading : labels.uploadImage}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadMaterial(f, "image");
                  }}
                />
              </label>
            </div>
            {labels.uploadSizeHint ? (
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">{labels.uploadSizeHint}</p>
            ) : null}
            {materials.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {materials.map((m, idx) => (
                  <li
                    key={`${m.url}-${idx}`}
                    className="flex flex-wrap items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-sm"
                  >
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] underline"
                    >
                      {m.fileName || (m.type === "image" ? "صورة" : "PDF")}
                    </a>
                    <span className="text-xs text-[var(--color-muted)]">{m.type === "image" ? "صورة" : "PDF"}</span>
                    <button
                      type="button"
                      onClick={() => onMaterialsChange(materials.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline"
                    >
                      {labels.remove}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {labels.explanationVideoLabel}
            </label>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{labels.explanationVideoHelp}</p>
            <input
              type="url"
              value={explanationVideoUrl}
              onChange={(e) => onExplanationVideoUrlChange(e.target.value)}
              placeholder={labels.explanationVideoPlaceholder}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
