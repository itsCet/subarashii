"use client";

import { CalendarDays, ClipboardList, ScanLine, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/staff", label: "Caisse", icon: ScanLine },
  { href: "/staff/commandes", label: "Commandes", icon: ClipboardList },
  { href: "/staff/events", label: "Agenda", icon: CalendarDays },
  { href: "/staff/shop", label: "Shop", icon: ShoppingBag },
];

export function StaffTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Outils staff" className="mb-6 grid grid-cols-2 gap-1.5 sm:grid-cols-4 border-[6px] border-black bg-black">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/staff" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-extrabold ${
              active ? "bg-torii text-white" : "bg-charcoal text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
