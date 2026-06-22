"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Single-line + Enter submit composer with autosize textarea. Cmd+Enter sends
 * too, in case the user's chat habit is Slack-style.
 */
export function ChatComposer({ onSubmit, disabled, placeholder = "Ask anything…" }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(160, t.scrollHeight)}px`;
  }, [text]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-2xl border border-stone-border bg-white p-2"
    >
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || (!e.shiftKey && !e.altKey))) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-midnight outline-none placeholder:text-stone-text"
      />
      <button
        type="submit"
        disabled={disabled || text.trim() === ""}
        className="btn-pill-dark px-4 text-sm disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
