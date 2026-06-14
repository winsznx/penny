import Link from "next/link";
import { Header } from "@/components/Header";
import { LockRatePanel } from "@/components/LockRatePanel";
import { MilestonePanel } from "@/components/MilestonePanel";
import { TapButton } from "@/components/TapButton";
import { TopupHistory } from "@/components/TopupHistory";

export default function Home() {
  return (
    <main className="app-shell text-midnight font-body overflow-x-clip">
      <Header />

      <section className="container-page grid items-center gap-12 py-16 md:grid-cols-[1fr_420px] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-border bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-blue" />
            <span className="eyebrow">Onchain billing · no subscription</span>
          </div>
          <h1 className="display-xl">
            Pay only when it <span className="text-sky-blue">answers.</span>
          </h1>
          <p className="mt-6 max-w-2xl body-lg">
            Penny is premium AI chat without the monthly lock-in. Top up once in cUSD on Celo or
            STX on Stacks, send messages, and settle per useful answer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/chat" className="btn-pill-dark text-base">Start chatting</Link>
            <span className="rounded-full bg-white px-4 py-2 font-mono text-sm text-stone-text shadow-sm">
              Pay per useful answer
            </span>
          </div>
        </div>

        <div className="feature-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">Live pricing</span>
            <span className="rounded-full bg-sky-blue/10 px-3 py-1 text-xs font-semibold text-sky-blue">
              Haiku 4.5
            </span>
          </div>
          <div className="rounded-xl border border-stone-border bg-warm-stone p-4">
            <div className="msg-user p-4">
              Explain stablecoins like I am new to crypto.
            </div>
            <div className="msg-assistant mt-3 p-4 text-sm text-stone-text">
              Stablecoins are digital dollars designed to keep a steady price while moving onchain.
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ["Rate", "$0.001"],
              ["Refund", "24h"],
              ["Networks", "Celo · Stacks"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-stone-border bg-white p-3">
                <div className="eyebrow">{label}</div>
                <div className="mt-1 font-display text-lg font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-border bg-white/70 py-12">
        <div className="container-page">
          <div className="mb-6 text-center">
            <div className="eyebrow">Try Penny instantly</div>
            <h2 className="mt-2 heading-md">Ask first. Pay when the answer ships.</h2>
          </div>
          <div className="mx-auto flex max-w-2xl gap-3 rounded-xl border border-stone-border bg-warm-stone p-3 shadow-inner">
            <input
              type="text"
              placeholder="Ask anything..."
              className="flex-1 rounded-lg border border-stone-border bg-white px-4 py-3 font-body text-midnight outline-none transition-all focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
              readOnly
            />
            <Link href="/chat" className="btn-pill-dark px-6">Ask</Link>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 md:grid-cols-2">
        <TapButton />
        <MilestonePanel />
      </section>

      <section className="container-page pb-10">
        <LockRatePanel />
      </section>

      <section className="container-page pb-20">
        <div className="feature-card">
          <h3 className="heading-md">Your activity</h3>
          <p className="mb-4 mt-2 text-sm text-stone-text">
            Recent top-ups and withdrawals on the connected wallet.
          </p>
          <TopupHistory />
        </div>
      </section>
    </main>
  );
}
