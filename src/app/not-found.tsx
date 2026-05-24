import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <main className="app-shell">
      <Header />
      <section id="main" className="container-page flex flex-col items-center gap-6 py-24 text-center">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-text font-mono">
          404 · not found
        </span>
        <h1 className="text-3xl font-semibold text-midnight md:text-4xl">
          Nothing at this URL.
        </h1>
        <p className="max-w-md text-sm text-stone-text">
          Double-check the address, or jump back into the chat.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/" className="btn-pill-dark">Home</Link>
          <Link href="/chat" className="btn-secondary">Open chat</Link>
        </div>
      </section>
    </main>
  );
}
