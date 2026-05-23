import type { Metadata } from "next";
import Link from "next/link";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Penny",
  description: "Top spenders, tappers, and message senders on Penny — ranked by total on-chain actions.",
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-warm-stone text-midnight font-body flex flex-col">
      <header className="px-5 sm:px-6 py-4 flex justify-between items-center gap-3 max-w-6xl w-full mx-auto">
        <Link href="/" className="font-display font-bold text-xl sm:text-2xl tracking-tight">Penny</Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-stone-text uppercase tracking-widest">
          <Link href="/chat" className="hover:text-midnight transition-colors">Chat</Link>
          <Link href="/leaderboard" className="text-midnight">Leaderboard</Link>
        </nav>
        <Link href="/chat" className="nav-link-orange text-xs sm:text-sm whitespace-nowrap">
          Start chat <span aria-hidden>→</span>
        </Link>
      </header>

      <section className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 py-10 md:py-16">
        <div className="mb-10 md:mb-14 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-stone-surface border border-stone-border rounded-full px-3 py-1.5 mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-stone-text">Onchain · live</span>
          </div>
          <h1 className="font-display font-bold text-[40px] sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.05] tracking-tight">
            Top <span className="text-sky-blue">users.</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-text max-w-xl mx-auto md:mx-0">
            Ranked by total on-chain actions on the Penny contract — top-ups, messages registered, taps, rate locks, milestone claims, and intros. The contract is the source of truth.
          </p>
        </div>

        <Leaderboard />
      </section>
    </main>
  );
}
