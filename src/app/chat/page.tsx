import Link from "next/link";
import { BalancePill } from "@/components/BalancePill";
import { ConnectButton } from "@/components/ConnectButton";
import { TopUpButton } from "@/components/TopUpButton";

export default function Chat() {
  return (
    <main className="min-h-screen bg-warm-stone text-midnight font-body flex flex-col h-screen">
      {/* Navigation / Header */}
      <header className="px-6 py-4 flex flex-wrap justify-between items-center w-full bg-white border-b border-stone-border shrink-0 shadow-sm z-10 gap-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-stone-text hover:text-midnight font-medium">← Back</Link>
          <div className="font-display font-bold text-xl tracking-tight">Penny</div>
          <span className="text-xs bg-sky-blue/10 text-sky-blue px-2 py-1 rounded font-medium ml-2" title="0.001 cUSD per message at this tier">Haiku 4.5</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <BalancePill />
          <TopUpButton />
          <ConnectButton />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-8 flex flex-col pb-4">
          
          {/* Welcome Message */}
          <div className="flex justify-start">
            <div className="msg-assistant p-5 max-w-[85%] text-base leading-relaxed text-stone-text">
              <p>Hi there! I'm Penny. I can help you with anything from coding and writing to answering questions about the world.</p>
              <p className="mt-2 text-sm text-stone-text/70 italic">Cost: $0.00 (Welcome message)</p>
            </div>
          </div>
          
          {/* User Message */}
          <div className="flex justify-end">
            <div className="msg-user p-5 max-w-[85%] text-base leading-relaxed text-midnight">
              <p>Can you explain what a smart contract is in simple terms?</p>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex justify-start">
            <div className="msg-assistant p-5 max-w-[85%] text-base leading-relaxed text-stone-text">
              <p>Think of a smart contract like a digital vending machine.</p>
              <p className="mt-3">With a regular vending machine, you put in a coin, press a button, and the machine automatically gives you a snack. You don't need a store clerk to process the transaction—the machine's internal programming guarantees that if you provide the right input (money), you get the output (snack).</p>
              <p className="mt-3">A smart contract does the same thing on a blockchain. It's a piece of computer code that automatically executes actions when certain conditions are met, without needing a middleman like a bank or lawyer.</p>
              <div className="mt-3 pt-3 border-t border-stone-border/50 text-xs font-mono text-stone-text flex justify-between">
                <span>Debit: $0.02 cUSD</span>
                <span>Tokens: 384</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <div className="flex justify-start">
            <div className="msg-assistant p-5 max-w-[85%] flex items-center h-[60px]">
              <div className="blob-loader flex gap-2">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full bg-white border-t border-stone-border p-4 md:p-6 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-sky-blue text-white text-xs font-mono px-3 py-1 rounded-t-lg shadow-sm">
              Estimated cost: ~$0.01
            </div>
          </div>
          
          <div className="bg-warm-stone border border-stone-border rounded-xl p-2 flex items-end gap-2 shadow-sm focus-within:border-sky-blue focus-within:ring-2 focus-within:ring-sky-blue/20 transition-all">
            <textarea 
              placeholder="Message Penny..." 
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 min-h-[50px] max-h-[150px] resize-none font-body text-midnight"
              rows={1}
              defaultValue="How do I deploy one?"
            />
            <button className="bg-sky-blue hover:bg-sky-blue/90 text-white rounded-lg p-3 m-1 transition-colors shadow-sm flex items-center justify-center self-end">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          
          <div className="text-center mt-3 text-xs text-stone-text/70">
            AI can make mistakes. Paid messages are debited directly from your cUSD balance.
          </div>
        </div>
      </div>
    </main>
  );
}
