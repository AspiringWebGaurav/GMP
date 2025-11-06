import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "../components/providers/ToasterProvider";
import { ThemeProvider } from "../contexts/ThemeContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RecycleBinProvider } from "../contexts/RecycleBinContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gaurav Management Portfolio",
  description: "GMP - management portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface text-foreground min-h-screen`}
      >
        <ThemeProvider>
          <NotificationProvider>
            <RecycleBinProvider>
              <Providers>{children}</Providers>
            </RecycleBinProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
