import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { themeScript } from "@/components/layout/ThemeToggle";
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
    default: `${APP_NAME} · Lost & Found`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-svh flex-col">
            <SetupNotice />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
