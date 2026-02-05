import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feen - Secure API Key Sharing",
  description:
    "The secure way to share, manage, and monetize your API keys. Built for developers, teams, and enterprises.",
  keywords: [
    "API keys",
    "key sharing",
    "API management",
    "secure sharing",
    "developer tools",
  ],
  authors: [{ name: "Yethikrishna R", url: "https://github.com/yethikrishna" }],
  openGraph: {
    title: "Feen - Secure API Key Sharing",
    description: "The secure way to share, manage, and monetize your API keys.",
    url: "https://feen.dev",
    siteName: "Feen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feen - Secure API Key Sharing",
    description: "The secure way to share, manage, and monetize your API keys.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
