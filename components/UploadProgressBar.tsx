type Props = {
  percent: number;
  label?: string;
};

export function UploadProgressBar({ percent, label }: Props) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className="mt-2 w-full max-w-sm"
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
        {label ? <span>{label}</span> : <span />}
        <span className="tabular-nums font-medium text-[var(--color-foreground)]">{p}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150 ease-out"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}
