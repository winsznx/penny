"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[penny] route error:", error);
  }, [error]);

  return (
    <main className="app-shell flex min-h-screen items-center justify-center bg-warm-stone px-5 py-20">
      <ErrorState
        title="Page failed to render"
        description="An unhandled error caught here. Your balance and chat history are safe — they live on chain."
        hint={error.digest ? `Trace: ${error.digest}` : undefined}
        onRetry={reset}
      />
    </main>
  );
}
