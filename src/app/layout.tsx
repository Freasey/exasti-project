import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EcoCycle - Ride Green, Live Clean",
    template: "%s · EcoCycle",
  },
  description:
    "Lacak perjalanan sepedamu secara real-time, hitung karbon yang kamu hemat, dan tukar poin dengan reward.",
  applicationName: "EcoCycle",
};

export const viewport: Viewport = {
  themeColor: "#0a0d0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink-900 text-mist-100">{children}</body>
    </html>
  );
}
