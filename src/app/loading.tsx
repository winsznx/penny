import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="app-shell">
      <div className="container-page py-20">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-3/4 mt-3" />
        <Skeleton className="h-5 w-1/2 mt-2" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </main>
  );
}
