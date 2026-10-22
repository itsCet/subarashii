import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart";

/** − 2 + : utilisé par la caisse et le panier client. */
export function QuantityStepper({
  value,
  onChange,
  label,
  max = MAX_QUANTITY,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
}) {
  const button = "grid size-9 place-items-center text-paper hover:bg-zinc-800 disabled:opacity-40";
  return (
    <div className="inline-flex items-center border-2 border-zinc-700" role="group" aria-label={`Quantité : ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={value === 1 ? `Retirer ${label}` : `Un de moins : ${label}`} className={button}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-7 text-center font-extrabold tabular-nums text-paper" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Un de plus : ${label}`} className={button}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
