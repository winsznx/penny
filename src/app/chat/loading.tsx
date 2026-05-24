import { Skeleton } from "@/components/Skeleton";

export default function ChatLoading() {
  return (
    <main className="chat-shell flex min-h-screen flex-col px-3 pt-5">
      <Skeleton className="h-14 w-full" />
      <div className="mt-6 flex-1 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={`h-12 ${i % 2 === 0 ? "w-3/4" : "w-1/2 ml-auto"}`} />
        ))}
      </div>
      <Skeleton className="mt-4 h-16 w-full" />
    </main>
  );
}
