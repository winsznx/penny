"use client";

import { ErrorState } from "@/components/ErrorState";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="chat-shell flex min-h-screen items-center justify-center px-5">
      <ErrorState
        title="Chat could not start"
        description="The pre-paid balance read or the rate-locker timed out. Reconnect your wallet and refresh."
        hint={error.digest}
        onRetry={reset}
      />
    </main>
  );
}
