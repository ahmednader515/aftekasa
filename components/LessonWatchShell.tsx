"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlyrVideoPlayer } from "./plyr-video-player";
import { useT } from "./LocaleProvider";

type LessonUnlockContextValue = {
  homeworkSubmitted: boolean;
  notifyHomeworkSubmitted: () => void;
};

const LessonUnlockContext = createContext<LessonUnlockContextValue | null>(null);

export function useLessonUnlock(): LessonUnlockContextValue | null {
  return useContext(LessonUnlockContext);
}

type Props = {
  youtubeVideoId: string | null;
  storageKey: string;
  className?: string;
  lessonId: string;
  courseId: string;
  /** Student with full access who has not watched/marked the video yet. */
  canAutoComplete: boolean;
  initialVideoComplete: boolean;
  homeworkRequired: boolean;
  initialHomeworkSubmitted: boolean;
  nextHref: string | null;
  nextLabel: string | null;
  copyrightOverlay?: ReactNode;
  children?: ReactNode;
};

export function LessonWatchShell({
  youtubeVideoId,
  storageKey,
  className,
  lessonId,
  courseId,
  canAutoComplete,
  initialVideoComplete,
  homeworkRequired,
  initialHomeworkSubmitted,
  nextHref,
  nextLabel,
  copyrightOverlay,
  children,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [videoComplete, setVideoComplete] = useState(initialVideoComplete);
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(initialHomeworkSubmitted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVideoComplete(initialVideoComplete);
  }, [initialVideoComplete]);

  useEffect(() => {
    setHomeworkSubmitted(initialHomeworkSubmitted);
  }, [initialHomeworkSubmitted]);

  const progressionComplete =
    videoComplete && (!homeworkRequired || homeworkSubmitted);

  const markComplete = useCallback(async () => {
    if (videoComplete || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        setVideoComplete(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }, [videoComplete, loading, lessonId, courseId, router]);

  const onEnded = useCallback(() => {
    if (!canAutoComplete || videoComplete) return;
    void markComplete();
  }, [canAutoComplete, videoComplete, markComplete]);

  const notifyHomeworkSubmitted = useCallback(() => {
    setHomeworkSubmitted(true);
    router.refresh();
  }, [router]);

  const unlockCtx = useMemo(
    () => ({ homeworkSubmitted, notifyHomeworkSubmitted }),
    [homeworkSubmitted, notifyHomeworkSubmitted],
  );

  let progressAction: ReactNode = null;
  if (progressionComplete && nextHref && nextLabel) {
    progressAction = (
      <Link
        href={nextHref}
        className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        {nextLabel} →
      </Link>
    );
  } else if (progressionComplete) {
    progressAction = (
      <p className="mt-6 text-sm font-medium text-[var(--color-success)]">
        ✓ {t("courses.lessonCompleted", "Lesson completed")}
      </p>
    );
  } else if (videoComplete && homeworkRequired && !homeworkSubmitted) {
    progressAction = (
      <p
        role="status"
        className="mt-6 rounded-[var(--radius-btn)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
      >
        {t(
          "courses.homeworkRequiredToProgress",
          "Submit the homework to unlock the next lesson.",
        )}
      </p>
    );
  } else if (!videoComplete && homeworkRequired && homeworkSubmitted) {
    progressAction = (
      <p
        role="status"
        className="mt-6 rounded-[var(--radius-btn)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
      >
        {t(
          "courses.watchVideoToProgress",
          "Watch the full video to unlock the next lesson.",
        )}
      </p>
    );
  } else if (!youtubeVideoId && canAutoComplete) {
    progressAction = (
      <button
        type="button"
        onClick={() => void markComplete()}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {loading
          ? t("courses.completingLesson", "Saving...")
          : t("courses.markLessonComplete", "Mark lesson as complete")}
      </button>
    );
  }

  return (
    <LessonUnlockContext.Provider value={unlockCtx}>
      {youtubeVideoId ? (
        <div className="mt-6">
          <div className="lesson-video-shell relative w-full min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-black">
            <PlyrVideoPlayer
              key={`${storageKey}-${youtubeVideoId}`}
              youtubeVideoId={youtubeVideoId}
              storageKey={storageKey}
              className={className}
              onEnded={onEnded}
            />
            {copyrightOverlay}
          </div>
        </div>
      ) : null}

      {children}

      {progressAction}
    </LessonUnlockContext.Provider>
  );
}
