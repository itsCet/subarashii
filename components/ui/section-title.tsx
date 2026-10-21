import Link from "next/link";

type Props = {
  index: string; // « 01 », « 02 »…
  title: string;
  id?: string;
  aside?: string; // petit texte à droite (japonais, précision…)
  action?: { href: string; label: string };
};

/** En-tête de section éditorial : numéro, titre, filet épais. */
export function SectionTitle({ index, title, id, aside, action }: Props) {
  return (
    <div className="mb-5 flex items-end gap-3 border-b-2 border-paper pb-2">
      <span className="font-display text-sm text-torii-ink">{index}</span>
      <h2 id={id} className="font-display text-2xl leading-none text-paper">
        {title}
      </h2>
      {aside && <span className="hidden text-xs text-zinc-400 sm:inline">{aside}</span>}
      {action && (
        <Link href={action.href} className="ml-auto text-sm font-extrabold text-paper underline decoration-torii decoration-2 underline-offset-4 hover:text-torii-ink">
          {action.label}
        </Link>
      )}
    </div>
  );
}
