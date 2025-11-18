import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeedOne - Valorant 5th Player Matchmaking",
  description: "Find compatible teammates for your Valorant 4-stack. Avoid toxic players with our reputation-based matching system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
