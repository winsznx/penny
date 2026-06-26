"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BalancePill } from "./BalancePill";
import { ConnectButton } from "./ConnectButton";
import { NetworkSelector } from "./NetworkSelector";

export function Header({ compact = false }: { compact?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-3 z-40 px-3">
      <div className="container-page nav-frame flex min-h-[60px] lg:min-h-[72px] items-center justify-between gap-2 px-3 lg:gap-5 lg:px-6">
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

        <nav className="hidden items-center gap-1 rounded-full bg-stone-surface p-1 lg:flex">
          <Link href="/chat" className="nav-link">Chat</Link>
          <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <NetworkSelector />
          {!compact && <div className="hidden sm:block"><BalancePill /></div>}
          <Link href="/chat" className="hidden sm:inline-flex btn-secondary">Start chat</Link>
          <ConnectButton />
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link href="/chat" className="hidden btn-secondary btn-compact sm:inline-flex">
            Chat
          </Link>
          <button
            type="button"
            className="btn-secondary btn-compact"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="penny-mobile-menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div
          id="penny-mobile-menu"
          className="container-page nav-frame mt-3 grid gap-3 p-4 lg:hidden"
        >
          <div className="grid gap-3 sm:hidden">
            <NetworkSelector />
            {!compact && <BalancePill />}
            <ConnectButton />
          </div>
          <div className="h-px bg-stone-border sm:hidden" />
          <Link href="/chat" className="btn-secondary" onClick={() => setMenuOpen(false)}>
            Chat
          </Link>
          <Link href="/leaderboard" className="btn-secondary" onClick={() => setMenuOpen(false)}>
            Leaderboard
          </Link>
          <Link href="/chat" className="btn-pill-dark" onClick={() => setMenuOpen(false)}>
            Start chat
          </Link>
        </div>
      )}
    </header>
  );
}
