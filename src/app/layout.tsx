import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GrantMatchProvider } from "@/components/grantmatch-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GrantMatch Houston",
    template: "%s | GrantMatch Houston",
  },
  description:
    "An explainable AI funding navigator for Houston founders and early-stage businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <GrantMatchProvider>
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </GrantMatchProvider>
      </body>
    </html>
  );
}
