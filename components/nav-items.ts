import { CalendarDays, House, ShoppingBag, Swords, UserRound } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", short: "Accueil", icon: House },
  { href: "/events", label: "Agenda", short: "Agenda", icon: CalendarDays },
  { href: "/pass", label: "Pass & Quêtes", short: "Pass", icon: Swords },
  { href: "/shop", label: "Shop", short: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Mon Profil", short: "Profil", icon: UserRound },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
