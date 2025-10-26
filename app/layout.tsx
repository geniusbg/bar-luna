import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "LUNA Bar & Coffee - Русе",
  description: "bar coffee lunch shisha & good mood - Русе, ул. Александровска 97",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Luna Bar"
  }
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/jpeg" sizes="32x32" href="/luna-logo.jpg" />
        <link rel="icon" type="image/jpeg" sizes="16x16" href="/luna-logo.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/luna-logo.jpg" />
        <link rel="shortcut icon" href="/luna-logo.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileImage" content="/luna-logo.jpg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
