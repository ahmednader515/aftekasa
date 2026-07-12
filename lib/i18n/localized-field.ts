import type { Locale } from "./types";

export function pickLocalizedText(
  locale: Locale,
  arabicValue: string | null | undefined,
  englishValue: string | null | undefined,
): string {
  const ar = (arabicValue ?? "").trim();
  const en = (englishValue ?? "").trim();
  if (locale === "en") return en || ar;
  return ar || en;
}

/** Homepage / settings: DB value or translated default for the active locale. */
export function settingTextOrDefault(
  raw: string | null | undefined,
  t: (key: string, fallback?: string) => string,
  messageKey: string,
  fallback: string,
): string {
  const v = (raw ?? "").trim();
  return v || t(messageKey, fallback);
}
