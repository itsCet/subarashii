"use client";

import { motion } from "framer-motion";
import { QrCode, ShoppingBag, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Pass", icon: Swords },
  { href: "/leaderboard", label: "Top 10", icon: Trophy },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Ma carte", icon: QrCode },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-neon-violet backdrop-blur-md">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                  active ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-neon-violet/50 bg-neon-violet/15"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.4 : 2} />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
