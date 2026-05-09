import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://penny.timjosh507.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Penny — Pay-per-message AI",
  description: "Premium AI chat without the monthly subscription. Pay only when it answers.",
  openGraph: {
    type: "website",
    siteName: "Penny",
    title: "Penny — Pay-per-message AI",
    description: "Premium AI chat without the monthly subscription. Pay only when it answers.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Penny — Pay-per-message AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Penny — Pay-per-message AI",
    description: "Premium AI chat without the monthly subscription. Pay only when it answers.",
    images: ["/og.png"],
  },
  other: {
    "talentapp:project_verification":
      "7076270205c056ef5f0abf111afc17f757b0d83451a9c92ab2780a1e3531d2622ac21dfad4b76950e35a68d5a2ac10862a07a056f8415a6badb2f49e15f5e002",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
