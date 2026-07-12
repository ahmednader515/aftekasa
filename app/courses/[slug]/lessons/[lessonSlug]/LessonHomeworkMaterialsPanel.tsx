"use client";

import type { HomeworkMaterial } from "@/lib/homework-materials";
import { getYouTubeVideoId } from "@/lib/youtube";
import { PlyrVideoPlayer } from "@/components/plyr-video-player";
import { useLessonUnlock } from "@/components/LessonWatchShell";
import { useT } from "@/components/LocaleProvider";

type Props = {
  materials: HomeworkMaterial[];
  explanationVideoUrl: string | null;
  initialHomeworkSubmitted: boolean;
  /** Staff always see the explanation video. */
  forceShowExplanation?: boolean;
};

export function LessonHomeworkMaterialsPanel({
  materials,
  explanationVideoUrl,
  initialHomeworkSubmitted,
  forceShowExplanation = false,
}: Props) {
  const t = useT();
  const unlock = useLessonUnlock();
  const submitted = forceShowExplanation || (unlock?.homeworkSubmitted ?? initialHomeworkSubmitted);
  const youtubeId = getYouTubeVideoId(explanationVideoUrl);

  if (materials.length === 0 && !youtubeId) return null;

  return (
    <div className="mt-6 space-y-4">
      {materials.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("courses.homeworkMaterialsTitle", "Homework materials")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("courses.homeworkMaterialsSubtitle", "Download or view the homework files for this lesson.")}
          </p>
          <ul className="mt-4 space-y-3">
            {materials.map((m, i) => (
              <li key={`${m.url}-${i}`}>
                {m.type === "image" ? (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={m.fileName}
                      className="max-h-72 w-auto rounded-[var(--radius-btn)] border border-[var(--color-border)] object-contain"
                    />
                    <span className="mt-1 inline-block text-sm text-[var(--color-primary)] underline">
                      {m.fileName}
                    </span>
                  </a>
                ) : (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    📄 {m.fileName || t("courses.downloadPdf", "Download / View PDF")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {youtubeId ? (
        submitted ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t("courses.homeworkExplanationTitle", "Homework explanation")}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t("courses.homeworkExplanationSubtitle", "Watch the explanation for this homework.")}
            </p>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-black">
              <PlyrVideoPlayer
                youtubeVideoId={youtubeId}
                storageKey={`homework-explain-${youtubeId}`}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="rounded-[var(--radius-btn)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
          >
            {t(
              "courses.homeworkExplanationLocked",
              "Submit the homework to unlock the explanation video.",
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
