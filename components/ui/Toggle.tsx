"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-[var(--muted)]">
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full border transition ${
          checked
            ? "border-[rgba(139,92,246,0.7)] bg-[rgba(139,92,246,0.45)]"
            : "border-[rgba(31,41,55,0.7)] bg-[rgba(15,18,30,0.8)]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
