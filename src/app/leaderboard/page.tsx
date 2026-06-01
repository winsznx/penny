import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Penny",
  description: "Top spenders, tappers, and message senders on Penny — ranked by total on-chain actions on Celo and Stacks.",
};

export default function LeaderboardPage() {
  return (
    <main className="app-shell text-midnight font-body">
      <Header compact />

      <section className="container-page py-16 md:py-24">
        <div className="mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-border bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="eyebrow">Onchain · live</span>
          </div>
          <h1 className="mt-5 display-lg">
            Top <span className="text-sky-blue">users.</span>
          </h1>
          <p className="mt-4 body-lg">
            Ranked by total on-chain actions on the Penny contracts — top-ups, registered messages,
            taps, rate locks, milestone claims, and intros. Switch the chain toggle to see Celo (cUSD)
            or Stacks (STX) activity.
          </p>
          <Link href="/chat" className="mt-6 inline-flex btn-pill-dark">Start chat</Link>
        </div>

        <Leaderboard />
      </section>
    </main>
  );
}
