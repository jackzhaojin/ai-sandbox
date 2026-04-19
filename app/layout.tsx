import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RecipeStoreProvider } from "./lib/RecipeStore";
import { SettingsStoreProvider } from "./lib/SettingsStore";
import { ClientLayout } from "./components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Book",
  description: "A UI-heavy multi-screen recipe book app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SettingsStoreProvider>
          <RecipeStoreProvider>
            <ClientLayout>{children}</ClientLayout>
          </RecipeStoreProvider>
        </SettingsStoreProvider>
      </body>
    </html>
  );
}
