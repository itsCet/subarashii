"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const pathname = usePathname();

  return (
    // pt = zone de l'encoche / barre d'état quand l'app est installée sur l'écran d'accueil (iOS).
    <header className="sticky top-0 z-30 border-b-2 border-black bg-ink pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/brand/logo.png" alt="" width={44} height={44} priority className="size-11 rounded-full" />
          <span className="font-display text-sm leading-none text-paper">
            SUBARASHII
            <span className="mt-0.5 block text-[11px] tracking-[0.3em] text-torii-ink">MANGA CAFÉ</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`block border-b-2 px-3 py-5 text-sm font-extrabold transition ${
                      active ? "border-torii text-paper" : "border-transparent text-zinc-400 hover:text-paper"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ThemeToggle className="ml-auto size-11 md:ml-3 md:size-10" />
      </div>
    </header>
  );
}
