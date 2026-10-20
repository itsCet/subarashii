"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/brand/logo.png" alt="" width={40} height={40} priority className="rounded-full" />
          <span className="font-display text-sm leading-none text-paper">
            SUBARASHII
            <span className="mt-0.5 block text-[10px] tracking-[0.3em] text-torii">MANGA CAFÉ</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
                      active ? "bg-torii text-paper" : "text-zinc-400 hover:bg-zinc-800 hover:text-paper"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <span aria-hidden className="ml-auto font-display text-lg text-zinc-700 md:hidden">
          素晴らしい
        </span>
      </div>
    </header>
  );
}
