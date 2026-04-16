import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban — GitHub Issues Board",
  description: "A Kanban board for GitHub issues across multiple repositories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
