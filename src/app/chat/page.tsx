import { BalancePill } from "@/components/BalancePill";
import { ChatComposerClient } from "@/components/ChatComposerClient";
import { ConnectButton } from "@/components/ConnectButton";
import { DisputeMessagePanel } from "@/components/DisputeMessagePanel";
import { GiftCreditButton } from "@/components/GiftCreditButton";
import { TierBreakdown } from "@/components/TierBreakdown";
import { TopUpButton } from "@/components/TopUpButton";
import { WithdrawBalanceButton } from "@/components/WithdrawBalanceButton";
import Link from "next/link";

export default function Chat() {
  return (
    <main className="chat-shell text-midnight font-body flex flex-col">
      {/* Navigation / Header */}
      <header className="mx-3 mt-3 rounded-xl border border-stone-border bg-white/85 px-5 py-4 shadow-sm backdrop-blur shrink-0 z-10">
        <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn-secondary min-h-0 px-3 py-2">
            Back
          </Link>
          <div className="font-display font-bold text-xl tracking-tight">Penny</div>
          <span
            className="text-xs bg-sky-blue/10 text-sky-blue px-2 py-1 rounded font-medium ml-2"
            title="Default tier — $0.001 per message (cUSD on Celo, STX-equivalent on Stacks)"
          >
            Haiku 4.5
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <BalancePill />
          <TopUpButton />
          <ConnectButton />
        </div>
        </div>
      </header>

      {/* Empty state — no fake transcript */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        <div className="max-w-2xl mx-auto pt-16 md:pt-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-blue/10 text-sky-blue text-xs font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-blue" />
            new conversation
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-midnight tracking-tight">
            Pay only when it answers.
          </h1>
          <p className="text-stone-text text-base md:text-lg leading-relaxed">
            Top up in cUSD on Celo or STX on Stacks, send a message, and the relay debits the going
            rate for the active tier and ships the response. Every charge settles on-chain and is
            refundable inside a 24-hour dispute window.
          </p>
          <div className="text-left">
            <TierBreakdown />
            <p className="mt-3 text-xs text-stone-text font-mono">
              ↑ pulled from the tier registry on chain — admin-updated, paused tiers grey out
              automatically.
            </p>
          </div>
          <p className="text-xs text-stone-text/70 font-mono">
            Relay is offline in v1 — the composer queues your draft locally so the UI is exercised.
            On-chain billing flips on once the relay key is provisioned.
          </p>

          <div className="pt-4 grid sm:grid-cols-2 gap-3">
            <WithdrawBalanceButton />
            <GiftCreditButton />
          </div>

          <div className="pt-3">
            <DisputeMessagePanel />
          </div>
        </div>
      </div>

      {/* Input Area — wraps ChatComposer with a chain-aware submit */}
      <ChatComposerClient />
    </main>
  );
}
