import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Providers from "../components/providers/ToasterProvider";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RecycleBinProvider } from "../contexts/RecycleBinContext";
import { LoadingProvider } from "../contexts/LoadingContext";
import AppLoader from "../components/AppLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gaurav Management Panel",
  description:
    "Professional management dashboard for tracking tasks, time, and productivity - GMP",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  applicationName: "Gaurav Management Panel",
  keywords: [
    "management",
    "dashboard",
    "productivity",
    "time tracker",
    "task management",
  ],
  authors: [{ name: "Gaurav" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#6366F1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GMP",
  },
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
        <LoadingProvider>
          <NotificationProvider>
            <RecycleBinProvider>
              <Providers>
                <AppLoader />
                {children}
              </Providers>
            </RecycleBinProvider>
          </NotificationProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
