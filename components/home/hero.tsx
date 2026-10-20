import { CalendarDays, Sofa, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RewardIcon } from "@/components/ui/reward-icon";
import { CAFE, UNIVERSES } from "@/lib/cafe";

export function Hero() {
  const alcoveHref = CAFE.alcoveBookingUrl ?? "#infos";

  return (
    <section className="manga-panel halftone-torii rounded-2xl p-5 shadow-panel sm:p-8">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="relative inline-block rounded-2xl border-2 border-black bg-paper px-4 py-1.5 font-display text-sm text-ink after:absolute after:-bottom-[8px] after:left-6 after:size-3.5 after:rotate-45 after:border-r-2 after:border-b-2 after:border-black after:bg-paper">
            いらっしゃいませ ! Bienvenue
          </span>
          <h1 className="mt-5 font-display text-3xl leading-tight text-paper sm:text-5xl">
            {CAFE.tagline.replace(" à Genève", "")}
            <span className="block text-torii">à {CAFE.city}</span>
          </h1>
          <p className="mt-4 max-w-lg text-zinc-300">
            Installe-toi dans une alcôve avec une pile de mangas, un bubble tea et des amis : le Subarashii,
            c&apos;est une bibliothèque, un bar, une zone gaming et un shop TCG sous le même toit.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-torii px-4 py-2.5 text-sm font-extrabold text-paper shadow-panel transition hover:-translate-y-0.5 hover:bg-torii-bright"
            >
              <CalendarDays className="size-4" /> Voir l&apos;Agenda
            </Link>
            <Link
              href="/pass"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-gold px-4 py-2.5 text-sm font-extrabold text-ink shadow-panel transition hover:-translate-y-0.5 hover:bg-dorayaki"
            >
              <Swords className="size-4" /> Mon Pass Fidélité
            </Link>
            <Link
              href={alcoveHref}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-zinc-600 bg-charcoal px-4 py-2.5 text-sm font-extrabold text-paper transition hover:-translate-y-0.5 hover:border-paper"
            >
              <Sofa className="size-4" /> Réserver une Alcôve
            </Link>
          </div>
        </div>

        <div className="relative order-first mx-auto grid aspect-square w-full max-w-[13rem] place-items-center md:order-none md:max-w-xs">
          {/* Lignes de vitesse manga derrière le logo */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(244,244,245,0.09)_0deg_1.5deg,transparent_1.5deg_8deg)] [mask-image:radial-gradient(circle,transparent_38%,black_45%,transparent_72%)]"
          />
          <Image
            src="/brand/logo.png"
            alt="Subarashii Manga Café"
            width={320}
            height={320}
            priority
            className="relative size-[78%] rounded-full shadow-[0_20px_60px_-20px_rgba(230,57,70,0.7)]"
          />
        </div>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {UNIVERSES.map((u) => (
          <li key={u.key} className="rounded-xl border border-zinc-700 bg-ink/60 p-3.5">
            <span className="grid size-10 place-items-center rounded-lg bg-torii/15 text-torii">
              <RewardIcon icon={u.icon} className="size-5" />
            </span>
            <h3 className="mt-2.5 text-sm font-extrabold text-paper">{u.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{u.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
