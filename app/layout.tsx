import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Trader - Automated Trading Platform",
  description: "Professional-grade algorithmic trading platform with real-time market analysis, automated execution, and comprehensive portfolio management.",
  keywords: ["trading", "automated trading", "algorithmic trading", "portfolio management", "stock market", "cryptocurrency"],
  authors: [{ name: "AI Trader Team" }],
  creator: "AI Trader",
  publisher: "AI Trader",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://aitrader.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/favicon.svg", sizes: "32x32", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#2563eb",
      },
    ],
  },
  openGraph: {
    title: "AI Trader - Automated Trading Platform",
    description: "Professional-grade algorithmic trading platform with real-time market analysis and automated execution.",
    url: "https://aitrader.vercel.app",
    siteName: "AI Trader",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Trader Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Trader - Automated Trading Platform",
    description: "Professional-grade algorithmic trading platform with real-time market analysis and automated execution.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}