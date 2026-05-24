import type { ReactNode } from "react";

type Props = {
  who: "user" | "assistant";
  children: ReactNode;
  costLabel?: string;
};

export function ChatBubble({ who, children, costLabel }: Props) {
  const isUser = who === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "border-midnight/10 bg-midnight text-white"
            : "border-stone-border bg-white text-midnight"
        }`}
      >
        {children}
        {costLabel && (
          <div
            className={`mt-2 text-[10px] uppercase tracking-widest font-mono ${
              isUser ? "text-white/60" : "text-stone-text"
            }`}
          >
            debited · {costLabel}
          </div>
        )}
      </div>
    </div>
  );
}
