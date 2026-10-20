"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 border-t-2 pt-2 pb-2.5 text-[11px] font-bold ${
                  active ? "border-torii text-paper" : "border-transparent text-zinc-500"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
