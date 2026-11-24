import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AthleMind KB Explorer",
  description: "Public evidence chat and citation knowledge graph for sport science research.",
  icons: { icon: "/brand/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable}`}>
        <header className="site-header">
          <Image src="/brand/logo-lockup.svg" alt="AthleMind" width={160} height={36} priority />
          <span className="site-tag">Research library explorer</span>
        </header>
        {children}
      </body>
    </html>
  );
}