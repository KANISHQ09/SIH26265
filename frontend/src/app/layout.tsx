import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zetsu | AICTE Security Deposit & FDR Portal - Ministry of Education",
  description:
    "Centralized, tamper-evident portal for streamlining Security Deposits & FDR lifecycle management with 3-tier trust provenance, automated reminders, and multi-stage approvals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
