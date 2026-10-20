"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-zinc-700 bg-charcoal/95 p-1.5 shadow-panel backdrop-blur-md">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold transition ${
                  active ? "text-paper" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-xl bg-torii"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.4 : 2} />
                <span className="relative">{short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
