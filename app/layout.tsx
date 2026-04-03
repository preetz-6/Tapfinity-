
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tapfinity | NFC-Powered Campus Payments",
    template: "%s | Tapfinity",
  },
  description:
    "Replace cash and UPI with instant NFC tap-to-pay. Tapfinity is a secure, closed-loop digital payment platform built for college campuses, cafeterias, and hostels.",
  keywords: [
    "NFC payments",
    "campus payments",
    "college cashless",
    "tap to pay",
    "digital wallet",
    "closed loop payments",
    "student payments",
  ],
  authors: [{ name: "Tapfinity" }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://tapfinity.vercel.app"),
  openGraph: {
    title: "Tapfinity | NFC-Powered Campus Payments",
    description:
      "Instant NFC tap-to-pay for colleges. No cash, no UPI, no waiting. Just tap and go.",
    siteName: "Tapfinity",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tapfinity | NFC-Powered Campus Payments",
    description:
      "Instant NFC tap-to-pay for colleges. No cash, no UPI, no waiting.",
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#030508",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
