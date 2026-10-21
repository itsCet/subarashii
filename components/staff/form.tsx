// Petits éléments de formulaire partagés par les écrans staff.

export const inputClass =
  "w-full border-2 border-zinc-700 bg-ink px-3 py-2.5 text-paper outline-none placeholder:text-zinc-600 focus:border-paper";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 border-2 border-black bg-torii px-4 py-2.5 text-sm font-extrabold text-white shadow-panel hover:bg-torii-strong disabled:opacity-60";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 border-2 border-zinc-600 px-4 py-2.5 text-sm font-extrabold text-paper hover:border-paper disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-paper">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-torii" />
      {label}
    </label>
  );
}
