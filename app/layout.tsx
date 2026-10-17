import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { RegistrationGate } from "@/components/auth/registration-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ClinicDataProvider } from "@/components/providers/clinic-data-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Greens Healing Therapy",
  description: "Natural therapy and wellness clinic for healing, massage, cupping, and honey products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <ClinicDataProvider>
            <LocaleProvider>
              <RegistrationGate>
                <div className="min-h-screen">
                  <SiteHeader />
                  <main>{children}</main>
                  <SiteFooter />
                </div>
              </RegistrationGate>
            </LocaleProvider>
          </ClinicDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
