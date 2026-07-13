"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSetting } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

const inputClass =
  "w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

export function AddBalanceSettingsForm({ initialSettings }: { initialSettings: HomepageSetting }) {
  const router = useRouter();
  const t = useT();
  const Ab = "dashboard.addBalanceSettings";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    addBalanceTitle: initialSettings.addBalanceTitle ?? "",
    addBalanceTitleEn: initialSettings.addBalanceTitleEn ?? "",
    addBalanceSubtitle: initialSettings.addBalanceSubtitle ?? "",
    addBalanceSubtitleEn: initialSettings.addBalanceSubtitleEn ?? "",
    addBalanceMethodTitle: initialSettings.addBalanceMethodTitle ?? "",
    addBalanceMethodTitleEn: initialSettings.addBalanceMethodTitleEn ?? "",
    addBalanceTransferInstruction: initialSettings.addBalanceTransferInstruction ?? "",
    addBalanceTransferInstructionEn: initialSettings.addBalanceTransferInstructionEn ?? "",
    addBalanceWalletNumber: initialSettings.addBalanceWalletNumber ?? "",
    addBalanceInstapayMethodTitle: initialSettings.addBalanceInstapayMethodTitle ?? "",
    addBalanceInstapayMethodTitleEn: initialSettings.addBalanceInstapayMethodTitleEn ?? "",
    addBalanceInstapayTransferInstruction: initialSettings.addBalanceInstapayTransferInstruction ?? "",
    addBalanceInstapayTransferInstructionEn: initialSettings.addBalanceInstapayTransferInstructionEn ?? "",
    addBalanceInstapayWalletNumber: initialSettings.addBalanceInstapayWalletNumber ?? "",
    addBalanceEtisalatMethodTitle: initialSettings.addBalanceEtisalatMethodTitle ?? "",
    addBalanceEtisalatMethodTitleEn: initialSettings.addBalanceEtisalatMethodTitleEn ?? "",
    addBalanceEtisalatTransferInstruction: initialSettings.addBalanceEtisalatTransferInstruction ?? "",
    addBalanceEtisalatTransferInstructionEn: initialSettings.addBalanceEtisalatTransferInstructionEn ?? "",
    addBalanceEtisalatWalletNumber: initialSettings.addBalanceEtisalatWalletNumber ?? "",
    addBalanceConfirmationNote: initialSettings.addBalanceConfirmationNote ?? "",
    addBalanceConfirmationNoteEn: initialSettings.addBalanceConfirmationNoteEn ?? "",
    addBalanceWhatsappNumber: initialSettings.addBalanceWhatsappNumber ?? "",
    addBalanceWhatsappButtonText: initialSettings.addBalanceWhatsappButtonText ?? "",
    addBalanceWhatsappButtonTextEn: initialSettings.addBalanceWhatsappButtonTextEn ?? "",
    addBalanceWaitingNote: initialSettings.addBalanceWaitingNote ?? "",
    addBalanceWaitingNoteEn: initialSettings.addBalanceWaitingNoteEn ?? "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings/add-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t(`${Ab}.saveFailed`));
      setSuccess(t(`${Ab}.saveSuccess`));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(`${Ab}.genericError`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {success}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${Ab}.sectionPage`, "نصوص الصفحة")}
        </h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceTitle}
            onChange={(e) => setField("addBalanceTitle", e.target.value)}
            placeholder={t(`${Ab}.phTitleAr`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceTitleEn}
            onChange={(e) => setField("addBalanceTitleEn", e.target.value)}
            placeholder={t(`${Ab}.phTitleEn`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceSubtitle}
            onChange={(e) => setField("addBalanceSubtitle", e.target.value)}
            placeholder={t(`${Ab}.phSubtitleAr`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceSubtitleEn}
            onChange={(e) => setField("addBalanceSubtitleEn", e.target.value)}
            placeholder={t(`${Ab}.phSubtitleEn`)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${Ab}.sectionInstapay`, "إنستاباي")}
        </h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceInstapayMethodTitle}
            onChange={(e) => setField("addBalanceInstapayMethodTitle", e.target.value)}
            placeholder={t(`${Ab}.phInstapayTitleAr`, "عنوان إنستاباي (عربي)")}
            className={inputClass}
          />
          <input
            value={form.addBalanceInstapayMethodTitleEn}
            onChange={(e) => setField("addBalanceInstapayMethodTitleEn", e.target.value)}
            placeholder={t(`${Ab}.phInstapayTitleEn`, "عنوان إنستاباي (إنجليزي)")}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceInstapayTransferInstruction}
            onChange={(e) => setField("addBalanceInstapayTransferInstruction", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrAr`)}
            rows={2}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceInstapayTransferInstructionEn}
            onChange={(e) => setField("addBalanceInstapayTransferInstructionEn", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrEn`)}
            rows={2}
            className={inputClass}
          />
          <input
            value={form.addBalanceInstapayWalletNumber}
            onChange={(e) => setField("addBalanceInstapayWalletNumber", e.target.value)}
            placeholder={t(`${Ab}.phInstapayWallet`, "رقم/حساب إنستاباي")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${Ab}.sectionVodafone`, "فودافون كاش")}
        </h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceMethodTitle}
            onChange={(e) => setField("addBalanceMethodTitle", e.target.value)}
            placeholder={t(`${Ab}.phMethodTitleAr`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceMethodTitleEn}
            onChange={(e) => setField("addBalanceMethodTitleEn", e.target.value)}
            placeholder={t(`${Ab}.phMethodTitleEn`)}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceTransferInstruction}
            onChange={(e) => setField("addBalanceTransferInstruction", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrAr`)}
            rows={2}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceTransferInstructionEn}
            onChange={(e) => setField("addBalanceTransferInstructionEn", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrEn`)}
            rows={2}
            className={inputClass}
          />
          <input
            value={form.addBalanceWalletNumber}
            onChange={(e) => setField("addBalanceWalletNumber", e.target.value)}
            placeholder={t(`${Ab}.phWallet`)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${Ab}.sectionEtisalat`, "اتصالات كاش")}
        </h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceEtisalatMethodTitle}
            onChange={(e) => setField("addBalanceEtisalatMethodTitle", e.target.value)}
            placeholder={t(`${Ab}.phEtisalatTitleAr`, "عنوان اتصالات كاش (عربي)")}
            className={inputClass}
          />
          <input
            value={form.addBalanceEtisalatMethodTitleEn}
            onChange={(e) => setField("addBalanceEtisalatMethodTitleEn", e.target.value)}
            placeholder={t(`${Ab}.phEtisalatTitleEn`, "عنوان اتصالات كاش (إنجليزي)")}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceEtisalatTransferInstruction}
            onChange={(e) => setField("addBalanceEtisalatTransferInstruction", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrAr`)}
            rows={2}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceEtisalatTransferInstructionEn}
            onChange={(e) => setField("addBalanceEtisalatTransferInstructionEn", e.target.value)}
            placeholder={t(`${Ab}.phTransferInstrEn`)}
            rows={2}
            className={inputClass}
          />
          <input
            value={form.addBalanceEtisalatWalletNumber}
            onChange={(e) => setField("addBalanceEtisalatWalletNumber", e.target.value)}
            placeholder={t(`${Ab}.phEtisalatWallet`, "رقم محفظة اتصالات كاش")}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${Ab}.sectionShared`, "تأكيد التحويل وواتساب")}
        </h3>
        <div className="space-y-4">
          <textarea
            value={form.addBalanceConfirmationNote}
            onChange={(e) => setField("addBalanceConfirmationNote", e.target.value)}
            placeholder={t(`${Ab}.phConfirmationAr`)}
            rows={2}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceConfirmationNoteEn}
            onChange={(e) => setField("addBalanceConfirmationNoteEn", e.target.value)}
            placeholder={t(`${Ab}.phConfirmationEn`)}
            rows={2}
            className={inputClass}
          />
          <input
            value={form.addBalanceWhatsappNumber}
            onChange={(e) => setField("addBalanceWhatsappNumber", e.target.value)}
            placeholder={t(`${Ab}.phWhatsapp`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceWhatsappButtonText}
            onChange={(e) => setField("addBalanceWhatsappButtonText", e.target.value)}
            placeholder={t(`${Ab}.phWhatsappBtnAr`)}
            className={inputClass}
          />
          <input
            value={form.addBalanceWhatsappButtonTextEn}
            onChange={(e) => setField("addBalanceWhatsappButtonTextEn", e.target.value)}
            placeholder={t(`${Ab}.phWhatsappBtnEn`)}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceWaitingNote}
            onChange={(e) => setField("addBalanceWaitingNote", e.target.value)}
            placeholder={t(`${Ab}.phWaitingNoteAr`)}
            rows={3}
            className={inputClass}
          />
          <textarea
            value={form.addBalanceWaitingNoteEn}
            onChange={(e) => setField("addBalanceWaitingNoteEn", e.target.value)}
            placeholder={t(`${Ab}.phWaitingNoteEn`)}
            rows={3}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t(`${Ab}.saving`) : t(`${Ab}.saveIdle`)}
      </button>
    </form>
  );
}
