import Image from "next/image";
import Link from "next/link";
import { CAFE, UNIVERSES } from "@/lib/cafe";
import { OpenStatusBadge } from "./opening-hours";

// Le hero est composé comme une planche de manga : cases sur papier, gouttières noires.
export function Hero() {
  const alcoveHref = CAFE.alcoveBookingUrl ?? "#infos";

  return (
    <section aria-labelledby="hero-title">
      <div className="grid gap-1.5 border-[6px] border-black bg-black md:grid-cols-[1fr_1fr_8rem]">
        {/* Case principale */}
        <div className="speed-lines relative overflow-hidden bg-paper p-6 text-ink sm:p-8 md:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-torii">{CAFE.claim}</p>
          <h1 id="hero-title" className="mt-3 max-w-md font-display text-4xl leading-[1.05] sm:text-6xl">
            Subarashii Manga Café
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-700">
            Une bibliothèque de mangas, des alcôves, un bar, des consoles et un shop TCG.
            <br />
            {CAFE.address.street}, {CAFE.address.city}.
          </p>
          <Image
            src="/brand/logo.png"
            alt=""
            width={260}
            height={260}
            priority
            className="pointer-events-none absolute -right-10 -bottom-12 hidden w-56 rotate-[-8deg] rounded-full border-4 border-black sm:block lg:w-64"
          />
        </div>

        {/* Case verticale japonaise */}
        <div className="hidden items-center justify-center bg-torii md:flex">
          <span className="font-display text-3xl leading-tight text-paper [writing-mode:vertical-rl]">
            素晴らしい漫画喫茶
          </span>
        </div>

        {/* Les quatre univers, une case chacun */}
        <ul className="grid grid-cols-2 gap-1.5 md:col-span-3 md:grid-cols-4">
          {UNIVERSES.map((u, i) => (
            <li key={u.key} className={`p-4 ${i % 3 === 0 ? "tone bg-paper text-ink" : "bg-charcoal text-paper"}`}>
              <span className="font-display text-xs text-torii">0{i + 1}</span>
              <h2 className="mt-1 text-base leading-tight font-extrabold">{u.title}</h2>
              <p className={`mt-1 text-xs leading-relaxed ${i % 3 === 0 ? "text-zinc-700" : "text-zinc-400"}`}>
                {u.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href="/events" className="border-2 border-black bg-torii px-5 py-3 text-sm font-extrabold text-paper shadow-panel hover:bg-torii-bright">
          Voir l&apos;agenda
        </Link>
        <Link href="/pass" className="border-2 border-black bg-paper px-5 py-3 text-sm font-extrabold text-ink shadow-panel hover:bg-white">
          Mon pass fidélité
        </Link>
        <Link href={alcoveHref} className="text-sm font-extrabold text-paper underline decoration-torii decoration-2 underline-offset-4 hover:text-torii">
          Réserver une alcôve
        </Link>
        <span className="ml-auto">
          <OpenStatusBadge />
        </span>
      </div>
    </section>
  );
}
