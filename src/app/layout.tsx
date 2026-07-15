import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfessionProvider } from "@/context/ConfessionContext";
import { Navbar } from "@/components/Navbar";
import { Heart } from "lucide-react";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Confessly | Share What You Can't Say Out Loud",
  description: "A secure, privacy-focused space for anonymous confessions, thoughts, and feelings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#03030b] text-[#f1f1f7]">
        <ConfessionProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10">
            {children}
          </main>
          <footer className="w-full glass border-t border-white/5 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-0.5 text-slate-500 text-sm select-none">
                <span>© {new Date().getFullYear()} Confessly. All rights reserved</span>
                <Link href="/moderator" className="hover:text-slate-500 cursor-default">
                  .
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-slate-500 text-sm">
                <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                  Privacy Policy
                </Link>
                <div className="flex items-center gap-1">
                  <span>Made with</span>
                  <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />
                  <span>by Horn Vanhong.</span>
                </div>
              </div>
            </div>
          </footer>
        </ConfessionProvider>
      </body>
    </html>
  );
}
