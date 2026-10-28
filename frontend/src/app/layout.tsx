import type { Metadata } from "next";
import { Inter, Newsreader, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zetsu | AICTE Security Deposit & FDR Management Portal",
  description:
    "Centralized, tamper-evident lifecycle governance for Fixed Deposit Receipts & Security Deposits pledged to AICTE. Automated bank API provenance, OCR discrepancy detection, and cryptographic audit chains.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F5] text-[#1c1917] selection:bg-amber-200 selection:text-amber-950 font-sans">
        {children}
      </body>
    </html>
  );
}
