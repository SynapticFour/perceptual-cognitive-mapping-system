import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OfflineSyncListener from "@/components/offline/OfflineSyncListener";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Explore your cognitive style through a research-based mapping tool. Culturally adaptive, private, and oriented toward reflection — a research prototype, not a validated instrument for individual decisions.";

export const metadata: Metadata = {
  title: "PCMS — Cognitive Mapping",
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  openGraph: {
    title: "PCMS — Cognitive Mapping",
    description: SITE_DESCRIPTION,
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "PCMS",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OfflineSyncListener />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
