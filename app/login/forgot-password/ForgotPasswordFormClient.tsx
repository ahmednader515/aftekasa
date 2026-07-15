"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPasswordField, authInputClassName } from "@/components/AuthFormFields";
import { useT } from "@/components/LocaleProvider";

export default function ForgotPasswordFormClient() {
  const t = useT();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          oldPassword: oldPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("auth.forgot.sendFailed", "Failed to send request"));
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("auth.forgot.connectionError", "Connection error occurred"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          {t("auth.forgot.sentTitle", "Request sent")}
        </h1>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t(
            "auth.forgot.sentDescription",
            "Your password-change request has been sent to admin. Your data will be updated within hours. Thanks for your patience.",
          )}
        </div>
        <Link
          href="/login"
          className="mt-8 block w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-center text-base font-bold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {t("auth.forgot.title", "Forgot password / Request account update")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
        {t(
          "auth.forgot.subtitle",
          "Enter your registered email or phone and your new password. The request will be sent to admin and handled within hours.",
        )}
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? (
          <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <div>
          <label htmlFor="emailOrPhone" className="block text-sm font-semibold text-slate-800">
            {t("auth.forgot.emailOrPhoneLabel", "Email or phone number")}
          </label>
          <input
            id="emailOrPhone"
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            className={authInputClassName}
            placeholder={t("auth.forgot.emailOrPhonePlaceholder", "example@email.com or 01xxxxxxxxx")}
          />
        </div>
        <AuthPasswordField
          id="oldPassword"
          label={t("auth.forgot.oldPasswordLabel", "Current password (optional if remembered)")}
          value={oldPassword}
          onChange={setOldPassword}
          placeholder={t("auth.forgot.oldPasswordPlaceholder", "Shown to admin if provided")}
          autoComplete="current-password"
        />
        <AuthPasswordField
          id="newPassword"
          label={t("auth.forgot.newPasswordLabel", "New password")}
          value={newPassword}
          onChange={setNewPassword}
          required
          minLength={6}
          placeholder={t("auth.forgot.newPasswordPlaceholder", "At least 6 characters")}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? t("auth.forgot.submitting", "Sending...") : t("auth.forgot.submit", "Send request")}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
          {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      </p>
    </div>
  );
}
