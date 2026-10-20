import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Dela_Gothic_One } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { IntroSplash, introSeenScript } from "@/components/intro-splash";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  description: "Pass de Combat saisonnier, quêtes et classement du Subarashii Manga Café de Genève.",
  applicationName: "Subarashii",
  appleWebApp: { capable: true, title: "Subarashii", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CH" suppressHydrationWarning className={`${chakra.variable} ${dela.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introSeenScript }} />
      </head>
      <body className="font-sans antialiased">
        <IntroSplash />
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-32">{children}</main>
        <BottomNav />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
