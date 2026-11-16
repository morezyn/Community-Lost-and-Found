import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Toaster } from "sonner";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { themeScript } from "@/components/layout/ThemeToggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-heading",
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
      <body className={`${inter.variable} ${interTight.variable} bg-bg font-body text-ink antialiased`}>
        <AuthProvider>
          <div className="flex min-h-svh flex-col">
            <AnnouncementBanner />
            <SetupNotice />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "rounded-full border border-border bg-ink text-bg shadow-none",
                title: "text-bg font-medium",
                description: "text-bg/80",
                closeButton: "bg-bg/20 text-bg border-border/40",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
