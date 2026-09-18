import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biznes Radar AI — Bozorni pul tikishdan oldin ko‘ring",
  description:
    "KOB va tadbirkorlar uchun bozor tahlili, moliyaviy model, ssenariy va AI qaror qo‘llab-quvvatlash platformasi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-navy-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
