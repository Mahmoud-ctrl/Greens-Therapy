import type { Metadata } from "next";
import { Amiri, Cormorant_Garamond, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ClinicDataProvider } from "@/components/providers/clinic-data-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";

import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: "Greens Healing Therapy",
  description: "Natural therapy and wellness clinic for healing, massage, cupping, and honey products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${plexArabic.variable} ${cormorant.variable} ${amiri.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <ClinicDataProvider>
            <LocaleProvider>
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </div>
            </LocaleProvider>
          </ClinicDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
