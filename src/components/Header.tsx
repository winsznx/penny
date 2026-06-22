import Link from "next/link";
import { BalancePill } from "./BalancePill";
import { ConnectButton } from "./ConnectButton";
import { NetworkSelector } from "./NetworkSelector";

export function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-3 z-40 px-3">
      <div className="container-page nav-frame flex min-h-[60px] md:min-h-[72px] items-center justify-between gap-2 px-3 md:gap-5 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-midnight)] font-display text-sm font-bold text-white">
            P
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">Penny</span>
            <span className="mt-1 hidden max-w-[190px] truncate text-xs text-stone-text sm:block">
              Pay-per-answer AI
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-stone-surface p-1 md:flex">
          <Link href="/chat" className="nav-link">Chat</Link>
          <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <NetworkSelector />
          {!compact && <div className="hidden sm:block"><BalancePill /></div>}
          <Link href="/chat" className="hidden sm:inline-flex btn-secondary">Start chat</Link>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
