import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IntroAlignment - Legal Network for Estate Planning Attorneys",
  description: "Connecting estate planning attorneys with high-net-worth clients. Dynasty trusts, asset protection, sophisticated estate structures. Join our legal services network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
