type Props = { onPrompt?: (prompt: string) => void; className?: string };

const QUICK_PROMPTS = [
  "Explain how Penny escrow works",
  "What models are cheapest right now?",
  "Translate 'hello' to 5 languages",
  "Summarise the latest celo news",
];

export function EmptyChat({ onPrompt, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center gap-4 px-6 py-12 text-center ${className}`}>
      <h2 className="font-display text-2xl font-semibold text-midnight">Start a thread</h2>
      <p className="max-w-sm text-sm text-stone-text">
        Each message debits your prepaid balance. No subscription, no tier locks.
      </p>
      {onPrompt && (
        <ul className="mt-2 grid w-full max-w-md gap-2">
          {QUICK_PROMPTS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPrompt(p)}
                className="w-full rounded-xl border border-stone-border bg-white px-4 py-3 text-left text-sm text-midnight hover:border-midnight/40"
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
