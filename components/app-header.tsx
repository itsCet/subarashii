import Image from "next/image";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="rounded-full ring-1 ring-logo-red/60"
          />
          <span className="font-display text-sm leading-none tracking-wide text-white">
            SUBARASHII
            <span className="block text-[10px] tracking-[0.35em] text-neon-pink">MANGA CAFÉ</span>
          </span>
        </Link>
        <span aria-hidden className="ml-auto font-display text-lg text-slate-700">
          素晴らしい
        </span>
      </div>
    </header>
  );
}
