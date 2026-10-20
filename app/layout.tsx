import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, M_PLUS_Rounded_1c } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { IntroSplash, introSeenScript } from "@/components/intro-splash";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const dela = Dela_Gothic_One({
  variable: "--font-dela",
  subsets: ["latin"],
  weight: "400",
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
  themeColor: "#121214",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CH" suppressHydrationWarning className={`${rounded.variable} ${dela.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introSeenScript }} />
      </head>
      <body className="font-sans antialiased">
        <IntroSplash />
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-32 md:pb-16">{children}</main>
        <BottomNav />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
