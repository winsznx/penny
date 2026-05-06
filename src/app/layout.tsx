import type { Metadata } from "next";
import { Inter, SF_Pro_Display } from "next/font/google"; // Since SuisseIntl isn't on google fonts, using default or Inter.
import localFont from 'next/font/local';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
// Using Inter as fallback for display since SuisseIntl is custom
const display = Inter({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Penny — Pay-per-message AI",
  description: "Premium AI chat without the monthly subscription.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable}`}>
        {children}
      </body>
    </html>
  );
}
