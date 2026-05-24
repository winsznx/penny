"use client";

import { ErrorState } from "@/components/ErrorState";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell">
      <div className="container-page py-20">
        <ErrorState
          title="Couldn't aggregate the logs"
          description="The events index failed. Forno may be rate-limiting; try again in a minute."
          hint={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
