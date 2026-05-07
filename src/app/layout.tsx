import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Penny — Pay-per-message AI",
  description: "Premium AI chat without the monthly subscription. Pay only when it answers.",
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
      <body>{children}</body>
    </html>
  );
}
