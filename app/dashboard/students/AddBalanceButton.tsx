"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { getDir } from "@/lib/i18n/core";

export function AddBalanceButton({
  studentId,
  studentName,
  currentBalance,
}: {
  studentId: string;
  studentName: string;
  currentBalance: number;
}) {
  const t = useT();
  const dir = getDir();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function openModal() {
    setAmount(String(Math.round(Number(currentBalance))));
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isInteger(num) || num < 0) {
      setError(t("dashboard.studentsPage.invalidAmountError", "Enter a valid amount"));
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch(`/api/dashboard/students/${studentId}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: num }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("dashboard.studentsPage.editBalanceFailed", "Failed to update balance"));
      return;
    }
    setOpen(false);
    setAmount("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
      >
        {t("dashboard.studentsPage.editBalanceButton", "Edit balance")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            dir={dir}
            className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
          >
            <h3 className="font-semibold text-[var(--color-foreground)]">
              {t("dashboard.studentsPage.editBalanceModalTitlePrefix", "Edit balance —")} {studentName}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t("dashboard.studentsPage.currentBalanceLabel", "Current balance:")}{" "}
              {Math.round(Number(currentBalance))}{" "}
              {t("common.egyptianPoundShort", "EGP")}
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              <input
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("dashboard.studentsPage.newBalancePlaceholderEgp", "New balance (EGP)")}
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError("");
                  }}
                  className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] py-2 text-sm font-medium"
                >
                  {t("dashboard.studentsPage.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-[var(--radius-btn)] bg-[var(--color-primary)] py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading
                    ? t("dashboard.studentsPage.processing", "Working...")
                    : t("dashboard.studentsPage.save", "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
