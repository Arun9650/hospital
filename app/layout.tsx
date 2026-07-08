import type { Metadata } from "next";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";

const display = Roboto({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aria Health — Healthcare that begins with one conversation",
  description:
    "Discover doctors, book appointments, consult online, manage records and receive digital prescriptions on Aria Health, a premium telemedicine platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
