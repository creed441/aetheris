import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import { SWRProvider } from "./swr-provider";
import { Navbar } from "@/core/components/Navbar";
import { Footer } from "@/core/components/Footer";
import { ErrorBoundary } from "@/core/components/ErrorBoundary";

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-body",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: "Aetheris | DeFi on Stellar Soroban",
  description: "Experience the fastest AMM on Stellar. Swap AETH, provide liquidity, and earn protocol fees with advanced Soroban smart contracts.",
  openGraph: {
    title: "Aetheris",
    description: "The premier AMM and Liquidity Protocol on Stellar Soroban.",
    url: "https://aetheris.vercel.app",
    siteName: "Aetheris",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aetheris",
    description: "High-aetherage DeFi on Stellar Testnet",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} ${dmMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <ErrorBoundary>
          <SWRProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
          </SWRProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
