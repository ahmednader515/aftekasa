"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import { AuthPasswordField, authInputClassName } from "@/components/AuthFormFields";
import { useT } from "@/components/LocaleProvider";

function LoginForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [concurrentSession, setConcurrentSession] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const reasonElsewhere = searchParams.get("reason") === "session_ended_elsewhere";
  const signupMessage = searchParams.get("message");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConcurrentSession(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error === CONCURRENT_SESSION_ERROR) {
        setConcurrentSession(true);
        setLoading(false);
        return;
      }
      if (res?.error) {
        setError(t("auth.login.invalidCredentials", "Email/phone or password is incorrect"));
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogoutOther(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForceLogoutLoading(true);
    try {
      const r = await fetch("/api/auth/force-logout-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? t("auth.login.forceLogoutFailed", "Failed to log out the other device"));
        return;
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(t("auth.login.loginAfterForceLogoutFailed", "Failed to log in after logging out the other device"));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setForceLogoutLoading(false);
    }
  }

  if (concurrentSession) {
    return (
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          {t("auth.login.concurrentTitle", "This account is active on another device")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          {t("auth.login.concurrentDescription", "This account is currently logged in from another device or browser. To continue here, log out the other device first.")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {t("auth.login.concurrentSecurityHint", "If you suspect your account was compromised, update your password and account details from \"Edit account\" after logging in.")}
        </p>
        {error ? (
          <div className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <form onSubmit={handleForceLogoutOther} className="mt-8">
          <button
            type="submit"
            disabled={forceLogoutLoading}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {forceLogoutLoading
              ? t("auth.login.concurrentActionLoading", "Processing...")
              : t("auth.login.concurrentAction", "Log out the other device and continue here")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConcurrentSession(false)}
          className="mt-4 w-full text-sm text-slate-500 hover:underline"
        >
          {t("auth.login.concurrentCancel", "Cancel and go back to login")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {t("auth.login.title", "Log in")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
        {t("auth.login.subtitle", "Enter your phone number and password to access your account")}
      </p>

      {reasonElsewhere ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("auth.login.sessionEndedElsewhere", "You were logged out because this account was opened on another device. Log in again here if you want.")}
        </div>
      ) : null}
      {signupMessage ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {signupMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? (
          <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
            {t("auth.login.emailOrPhoneLabel", "Email or phone number")}
          </label>
          <input
            id="email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClassName}
            placeholder={t("auth.login.emailOrPhonePlaceholder", "example@email.com or 01xxxxxxxxx")}
          />
        </div>
        <AuthPasswordField
          id="password"
          label={t("auth.login.passwordLabel", "Password")}
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        <p className="text-sm">
          <Link href="/login/forgot-password" className="font-medium text-[var(--color-primary)] hover:underline">
            {t("auth.login.forgotPassword", "Forgot password?")}
          </Link>
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? t("auth.login.submitting", "Logging in...") : t("auth.login.submit", "Log in")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        {t("auth.login.noAccount", "Don't have an account?")}{" "}
        <Link href="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
          {t("auth.login.createAccount", "Create a new account")}
        </Link>
      </p>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function LoginFormClient() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
