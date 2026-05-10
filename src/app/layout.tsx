import type { Metadata, Viewport } from "next";

import { fraunces, dmSans } from "@/lib/fonts";
import { APP } from "@/lib/constants";
import { ThemeProviderScript } from "@/components/ThemeToggle";

import "./globals.css";


/*
  Root layout.

  Server component. Sets the html shell, loads fonts, defines
  metadata, and inlines the no-flash theme script as the first
  child of body so the dark class is applied before paint.

  Why suppressHydrationWarning?
    The ThemeProviderScript sets the dark class on html based
    on localStorage BEFORE React hydrates. That creates a
    server-vs-client mismatch which is exactly what the
    suppressHydrationWarning prop is for. It silences the
    html-element warning and nothing else.
*/


export const metadata: Metadata = {
  title: {
    default: APP.name,
    template: `%s | ${APP.name}`,
  },
  description: APP.description,
  authors: [{ name: APP.author }],
  creator: APP.author,
  applicationName: APP.name,
  keywords: [
    "English learning",
    "ESL",
    "personalized learning",
    "AI feedback",
    "writing assessment",
    "CEFR",
    "IELTS",
  ],
  openGraph: {
    type: "website",
    title: APP.name,
    description: APP.description,
    siteName: APP.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: APP.name,
    description: APP.description,
  },
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)",  color: "#0B1C3F" },
  ],
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fraunces.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProviderScript />
        {children}
      </body>
    </html>
  );
}
