import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { IntroSplash, introSeenScript } from "@/components/intro-splash";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { themeScript } from "@/components/theme-toggle";
import "./globals.css";

// Polices auto-hébergées (app/fonts) : le build ne dépend pas de Google Fonts.
const rounded = localFont({
  variable: "--font-rounded",
  display: "swap",
  src: [
    { path: "./fonts/m-plus-rounded-1c-400-latin.woff2", weight: "400" },
    { path: "./fonts/m-plus-rounded-1c-500-latin.woff2", weight: "500" },
    { path: "./fonts/m-plus-rounded-1c-700-latin.woff2", weight: "700" },
    { path: "./fonts/m-plus-rounded-1c-800-latin.woff2", weight: "800" },
  ],
});

const dela = localFont({
  variable: "--font-dela",
  display: "swap",
  src: "./fonts/dela-gothic-one-400-latin.woff2",
  weight: "400",
});

// Sous-ensemble limité aux caractères japonais utilisés dans l'UI.
// Nouveau caractère japonais dans le code → `npm run fonts:jp`.
const delaJp = localFont({
  variable: "--font-dela-jp",
  display: "swap",
  src: "./fonts/dela-gothic-one-400-jp-subset.woff2",
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Subarashii Manga Café",
    template: "%s · Subarashii Manga Café",
  },
  description:
    "Manga café chaleureux à Genève : bibliothèque et alcôves, bar & fooding, zone gaming, shop TCG, agenda et Pass fidélité.",
  applicationName: "Subarashii",
  appleWebApp: { capable: true, title: "Subarashii", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121214" },
  ],
  colorScheme: "dark light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CH" suppressHydrationWarning className={`${rounded.variable} ${dela.variable} ${delaJp.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: introSeenScript }} />
      </head>
      <body className="font-sans antialiased">
        <IntroSplash />
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pt-10 md:pb-20">{children}</main>
        <BottomNav />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
