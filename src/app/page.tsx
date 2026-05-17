import Link from "next/link";
import { MilestonePanel } from "@/components/MilestonePanel";
import { TapButton } from "@/components/TapButton";
import { TopupHistory } from "@/components/TopupHistory";

export default function Home() {
  return (
    <main className="min-h-screen bg-warm-stone text-midnight font-body flex flex-col">
      {/* Navigation */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl w-full mx-auto">
        <div className="font-display font-bold text-2xl tracking-tight">Penny</div>
        <div className="flex items-center gap-6">
          <div className="bg-stone-surface px-4 py-2 rounded-full font-mono text-sm text-stone-text border border-stone-border">
            Balance: <span className="text-midnight font-bold">$0.00</span>
          </div>
          <Link href="#top-up" className="nav-link-orange text-sm">
            Top up balance →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto px-6 py-12 gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="font-display font-bold text-5xl md:text-[68px] leading-[1.1] tracking-tight">
            Pay only when it <span className="text-sky-blue">answers.</span>
          </h1>
          <p className="text-lg text-stone-text max-w-md mx-auto md:mx-0">
            Premium AI chat without the $20 monthly subscription. Pay per message using cUSD on the Celo network. 
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <Link href="/chat">
              <button className="btn-pill-dark text-lg px-8 py-4">Start Chatting</button>
            </Link>
            <span className="text-sm text-stone-text font-mono bg-stone-surface px-3 py-1.5 rounded-md">
              First 3 messages free
            </span>
          </div>
        </div>
        
        {/* Hero Illustration */}
        <div className="flex-1 w-full max-w-md flex justify-center">
          <div className="relative w-72 h-72">
            {/* Friendly blue robot blob SVG */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
              <path fill="#0ea5e9" d="M45.7,-76.1C58.9,-69.3,69.2,-55.4,78.5,-41.2C87.8,-27,96,-13.5,95.6,-0.2C95.2,13.1,86.2,26.2,76.5,38.6C66.8,51,56.5,62.8,43.3,71.1C30.1,79.4,15.1,84.2,0.1,84C-14.8,83.9,-29.7,78.8,-42.6,70.5C-55.5,62.2,-66.5,50.7,-75.3,37.6C-84.1,24.5,-90.7,9.8,-89.7,-4.3C-88.7,-18.4,-80,-31.8,-70.2,-43.3C-60.4,-54.8,-49.5,-64.3,-36.8,-71.4C-24.1,-78.5,-9.6,-83.2,3.1,-87.6C15.8,-92,32.5,-82.9,45.7,-76.1Z" transform="translate(100 100)" />
              {/* Eye */}
              <circle cx="100" cy="85" r="24" fill="white" />
              <circle cx="105" cy="85" r="10" fill="#0f172a" />
              {/* Coin */}
              <circle cx="160" cy="50" r="16" fill="#f97316" />
              <text x="156" y="55" fill="white" fontSize="14" fontFamily="monospace">$</text>
              {/* Stick hand */}
              <path d="M125 100 Q 140 80 150 65" stroke="#0f172a" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* Free Trial Widget Preview */}
      <section className="bg-white border-t border-stone-border py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-xl font-display font-medium mb-6 text-stone-text uppercase tracking-widest text-center">Try Penny instantly</h2>
          
          <div className="w-full max-w-2xl bg-warm-stone border border-stone-border rounded-xl p-4 flex gap-3 shadow-inner">
            <input
              type="text"
              placeholder="Ask anything (e.g. explain quantum computing in simple terms)"
              className="flex-1 bg-white border border-stone-border rounded-lg px-4 py-3 outline-none focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20 transition-all font-body text-midnight"
              readOnly
            />
            <button className="bg-sky-blue text-white rounded-lg px-6 font-medium hover:bg-sky-blue/90 transition-colors shadow-sm">
              Ask
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pt-2 pb-8 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-4">
        <TapButton />
        <MilestonePanel />
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <div className="feature-card">
          <h3 className="font-display font-bold text-xl text-midnight mb-1">Your activity</h3>
          <p className="text-sm text-stone-text mb-4">
            Recent top-ups and withdrawals on the connected wallet.
          </p>
          <TopupHistory />
        </div>
      </section>
    </main>
  );
}
