import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";

export const metadata: Metadata = {
  title: "Thathumusa Funeral Stokvel",
  description:
    "A modern stokvel operations platform for member contributions, claims, meetings, loans, charity, and funeral support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background text-foreground">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
