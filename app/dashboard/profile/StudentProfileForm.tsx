"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EGYPT_GOVERNORATES,
  SIGNUP_GRADES,
  SIGNUP_STUDY_TYPES,
  divisionsForGrade,
  gradeHasDivisions,
} from "@/lib/signup-options";

type Props = {
  defaultName: string;
  defaultGrade: string;
  defaultDivision: string;
  defaultStudyType: string;
  defaultGovernorate: string;
  defaultGuardianNumber: string;
};

const inputClass =
  "mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

export function StudentProfileForm({
  defaultName,
  defaultGrade,
  defaultDivision,
  defaultStudyType,
  defaultGovernorate,
  defaultGuardianNumber,
}: Props) {
  const [grade, setGrade] = useState(defaultGrade);
  const [division, setDivision] = useState(defaultDivision);
  const [studyType, setStudyType] = useState(defaultStudyType);
  const [governorate, setGovernorate] = useState(defaultGovernorate);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const divisionOptions = useMemo(() => (grade ? divisionsForGrade(grade) : []), [grade]);

  const hasChanges =
    grade !== defaultGrade ||
    division !== defaultDivision ||
    studyType !== defaultStudyType ||
    governorate !== defaultGovernorate ||
    password.length >= 6;

  function handleGradeChange(value: string) {
    setGrade(value);
    setDivision("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!grade) {
      setError("اختر الصف الدراسي");
      return;
    }
    if (gradeHasDivisions(grade) && !division) {
      setError("اختر القسم");
      return;
    }
    if (!studyType) {
      setError("اختر نوع الدراسة");
      return;
    }
    if (!governorate) {
      setError("اختر المحافظة");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقتين");
      return;
    }
    if (password && password.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    const body: Record<string, string> = {
      grade,
      studyType,
      governorate,
      division: gradeHasDivisions(grade) ? division : "",
    };
    if (password) body.password = password;

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "فشل التحديث");
      return;
    }
    setSuccess("تم تحديث البيانات بنجاح");
    setPassword("");
    setConfirmPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[var(--radius-btn)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-primary)]">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">الاسم</label>
        <p className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/60 px-3 py-2 text-[var(--color-foreground)]">
          {defaultName || "—"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">لا يمكن تغيير الاسم من هنا — تواصل مع الإدارة إن لزم</p>
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-[var(--color-foreground)]">
          الصف الدراسي
        </label>
        <select
          id="grade"
          value={grade}
          onChange={(e) => handleGradeChange(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">اختر الصف</option>
          {SIGNUP_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {grade && gradeHasDivisions(grade) ? (
        <div>
          <label htmlFor="division" className="block text-sm font-medium text-[var(--color-foreground)]">
            القسم
          </label>
          <select
            id="division"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">اختر القسم</option>
            {divisionOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor="study_type" className="block text-sm font-medium text-[var(--color-foreground)]">
          نوع الدراسة
        </label>
        <select
          id="study_type"
          value={studyType}
          onChange={(e) => setStudyType(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">اختر نوع الدراسة</option>
          {SIGNUP_STUDY_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="governorate" className="block text-sm font-medium text-[var(--color-foreground)]">
          المحافظة
        </label>
        <select
          id="governorate"
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">اختر المحافظة</option>
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          رقم ولي الأمر
        </label>
        <p className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/60 px-3 py-2 text-[var(--color-foreground)]" dir="ltr">
          {defaultGuardianNumber || "—"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">لا يمكن تغيير رقم ولي الأمر من هنا — تواصل مع الإدارة إن لزم</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
          كلمة مرور جديدة (اتركها فارغة إن لم تُرد التغيير)
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-[var(--color-foreground)]">
          تأكيد كلمة المرور
        </label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !hasChanges}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}
