import Link from "next/link";

type Props = {
  kicker?: string; // petit texte japonais / sur-titre dans la bulle
  title: string;
  id?: string;
  action?: { href: string; label: string };
};

/** Titre de section façon bulle de dialogue manga. */
export function SectionTitle({ kicker, title, id, action }: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="relative">
        {kicker && (
          <span className="relative mb-2 inline-block rounded-full border-2 border-black bg-paper px-3 py-0.5 text-xs font-extrabold text-ink after:absolute after:-bottom-[7px] after:left-4 after:size-3 after:rotate-45 after:border-r-2 after:border-b-2 after:border-black after:bg-paper">
            {kicker}
          </span>
        )}
        <h2 id={id} className="font-display text-xl text-paper sm:text-2xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 text-sm font-bold text-torii hover:text-torii-bright">
          {action.label} →
        </Link>
      )}
    </div>
  );
}
