export type UploadProgressState = {
  /** 0–100 */
  percent: number;
  /** إرسال للمتصفح → السيرفر، أم انتظار رفع السيرفر للتخزين */
  phase: "uploading" | "processing";
};

export type UploadWithProgressResult = {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
};

/** جزء النسبة المخصّص لإرسال الملف للـ API (الباقي = انتظار السيرفر/R2) */
const TRANSFER_SHARE = 0.18;
/** تقدير سرعة رفع السيرفر إلى R2 — يُستخدم لتحريك الشريط أثناء الانتظار */
const ASSUMED_SERVER_BYTES_PER_SEC = 700_000;

/**
 * رفع ملف مع شريط تقدّم واقعي قدر الإمكان.
 * ملاحظة: progress في XHR يقيس فقط الإرسال للمتصفح→API؛ رفع R2 يحدث بعد ذلك على السيرفر،
 * لذلك نُقدّر مرحلة المعالجة حسب حجم الملف والوقت المنقضي.
 */
export function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (state: UploadProgressState) => void,
  fieldName = "file",
): Promise<UploadWithProgressResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.set(fieldName, file);

    let tick: ReturnType<typeof setInterval> | null = null;
    let settled = false;

    const clearTick = () => {
      if (tick != null) {
        clearInterval(tick);
        tick = null;
      }
    };

    const finish = (result: UploadWithProgressResult) => {
      if (settled) return;
      settled = true;
      clearTick();
      onProgress({ percent: 100, phase: "processing" });
      resolve(result);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTick();
      reject(err);
    };

    const startProcessingEstimate = () => {
      clearTick();
      const startedAt = Date.now();
      const expectedMs = Math.max(2500, (file.size / ASSUMED_SERVER_BYTES_PER_SEC) * 1000);
      onProgress({ percent: Math.round(TRANSFER_SHARE * 100), phase: "processing" });

      tick = setInterval(() => {
        const t = (Date.now() - startedAt) / expectedMs;
        // يقترب من 95% دون الوصول إليها حتى يرد السيرفر
        const processRatio = 1 - Math.exp(-2.2 * Math.max(0, t));
        const percent = Math.min(
          95,
          Math.round((TRANSFER_SHARE + (1 - TRANSFER_SHARE) * processRatio * 0.95) * 100),
        );
        onProgress({ percent, phase: "processing" });
      }, 120);
    };

    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable || e.total <= 0) return;
      const transferRatio = Math.min(1, e.loaded / e.total);
      const percent = Math.round(transferRatio * TRANSFER_SHARE * 100);
      onProgress({ percent, phase: "uploading" });
    });

    xhr.upload.addEventListener("load", () => {
      // اكتمل إرسال الجسم للـ API — الباقي انتظار معالجة السيرفر ورفعه إلى R2
      startProcessingEstimate();
    });

    xhr.addEventListener("load", () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText || "{}") as Record<string, unknown>;
      } catch {
        data = {};
      }
      finish({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    });

    xhr.addEventListener("error", () => fail(new Error("upload failed")));
    xhr.addEventListener("abort", () => fail(new Error("upload aborted")));

    onProgress({ percent: 0, phase: "uploading" });
    xhr.open("POST", url);
    xhr.send(fd);
  });
}
