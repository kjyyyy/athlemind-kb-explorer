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
  title: "AthleMind Knowledge Base Explorer",
  description:
    "Evidence chat and 3D knowledge graph from the sport psychology research library.",
  icons: { icon: "/brand/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${fraunces.variable} ${dmSans.variable}`}>
        <header className="site-header">
          <Image src="/brand/logo-mark.svg" alt="" width={32} height={32} priority aria-hidden />
          <div className="site-brand-block">
            <span className="site-wordmark">AthleMind Knowledge Base Explorer</span>
            <span className="site-tag-inline">
              From the research library · sport psychology
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}