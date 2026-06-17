import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const APP_NAME = "Provenance";
const APP_DESCRIPTION =
  "Provenance is a Sui, Walrus, and MemWal writing app that creates verifiable proof of authorship, draft history, and long-running creative memory. Your writing, cryptographically proven.";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://provenance.app";

export const viewport: Viewport = {
  themeColor: "#1A1A2E",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  // Core SEO
  title: {
    default: `${APP_NAME} - Your writing, cryptographically proven.`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "Provenance",
    "writing proof",
    "cryptographic authorship",
    "Sui blockchain",
    "Walrus storage",
    "MemWal agent memory",
    "verifiable writing",
    "proof of authorship",
    "decentralized storage",
    "content addressed blobs",
    "writing provenance",
    "draft history",
    "Sui Overflow 2026",
    "Walrus Track",
    "permanent storage",
    "Web3 writing",
    "blockchain proof",
    "creative process verification",
  ],

  // App info
  authors: [{ name: "Sumit Raikwar", url: "https://github.com/SumitRaikwar18" }],
  creator: "Sumit Raikwar",
  publisher: APP_NAME,
  applicationName: APP_NAME,
  category: "productivity",
  generator: "Next.js",

  // Canonical & alternates
  alternates: {
    canonical: "/",
  },

  // Open Graph
  openGraph: {
    title: `${APP_NAME} - Your writing, cryptographically proven.`,
    description:
      "Create permanent Walrus checkpoints, MemWal memory chains, and shareable proof pages for your writing sessions. Built on Sui.",
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
    locale: "en_US",
  },

  // Twitter / X
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Your writing, cryptographically proven.`,
    description:
      "Verifiable writing provenance powered by Sui, Walrus, and MemWal. Seal your drafts. Prove your process.",
    creator: "@SumitRaikwar18",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Manifest & icons
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        {/* Additional meta tags for broader SEO coverage */}
        <meta name="application-name" content={APP_NAME} />
        <meta name="author" content="Sumit Raikwar" />
        <meta
          name="description"
          content={APP_DESCRIPTION}
        />
        <meta
          name="keywords"
          content="Provenance, writing proof, cryptographic authorship, Sui blockchain, Walrus storage, MemWal, verifiable writing, proof of authorship, Sui Overflow 2026"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="theme-color" content="#1A1A2E" />
        <meta name="color-scheme" content="dark light" />
        <link rel="canonical" href={APP_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
