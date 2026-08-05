"use client";

type AttachmentKind = "image" | "pdf" | "video" | "audio" | "other";

function extensionFromUrl(url: string): string {
  try {
    const path = new URL(url, "https://example.local").pathname;
    const base = path.split("/").pop() || "";
    const ext = base.includes(".") ? base.split(".").pop() || "" : "";
    return ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  } catch {
    const clean = url.split("?")[0].split("#")[0];
    const base = clean.split("/").pop() || "";
    const ext = base.includes(".") ? base.split(".").pop() || "" : "";
    return ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
}

function kindFromExtension(ext: string): AttachmentKind {
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "m4a", "flac", "oga"].includes(ext)) return "audio";
  return "other";
}

function fileLabelFromUrl(url: string): string {
  try {
    const path = new URL(url, "https://example.local").pathname;
    const base = decodeURIComponent(path.split("/").pop() || "");
    return base || "file";
  } catch {
    const clean = url.split("?")[0].split("#")[0];
    return decodeURIComponent(clean.split("/").pop() || "file");
  }
}

export function LessonAttachmentPreview({
  url,
  viewLabel,
  removeLabel,
  onRemove,
  unavailableLabel,
  compact = false,
}: {
  url: string;
  viewLabel: string;
  removeLabel?: string;
  onRemove?: () => void;
  unavailableLabel?: string;
  /** Smaller preview for dashboard forms */
  compact?: boolean;
}) {
  const ext = extensionFromUrl(url);
  const kind = kindFromExtension(ext);
  const fileLabel = fileLabelFromUrl(url);
  const maxImageHeight = compact ? "14rem" : "28rem";
  const frameHeight = compact ? "h-56" : "h-[28rem]";

  return (
    <div className="mt-1 space-y-2">
      <div className="overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]">
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={fileLabel}
            className="mx-auto block w-auto max-w-full object-contain p-2"
            style={{ maxHeight: maxImageHeight }}
          />
        ) : kind === "pdf" ? (
          <iframe
            src={url}
            title={fileLabel}
            className={`w-full ${frameHeight} bg-white`}
          />
        ) : kind === "video" ? (
          <video src={url} controls className="mx-auto block max-h-80 w-full bg-black" />
        ) : kind === "audio" ? (
          <div className="p-4">
            <audio src={url} controls className="w-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {ext || "file"}
            </span>
            <p className="max-w-full truncate text-sm font-medium text-[var(--color-foreground)]" title={fileLabel}>
              {fileLabel}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {unavailableLabel || "Preview is not available for this file type"}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          {viewLabel}
        </a>
        {onRemove ? (
          <button type="button" onClick={onRemove} className="text-sm text-red-600 hover:underline">
            {removeLabel || "Remove"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
