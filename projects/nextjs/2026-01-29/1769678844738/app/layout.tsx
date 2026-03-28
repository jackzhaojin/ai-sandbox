import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "../styles/globals.css";
import { AnalyticsTracker } from "@/components/shared/AnalyticsTracker";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Retro Analytics Dashboard",
  description: "A retro-styled analytics dashboard with CRT monitor aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vt323.variable} antialiased crt-screen`}>
        <QueryProvider>
          <AnalyticsTracker />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#000',
                color: '#00ff00',
                border: '2px solid #00ff00',
                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                fontFamily: 'var(--font-vt323)',
                fontSize: '1.2rem',
              },
              success: {
                iconTheme: {
                  primary: '#00ff00',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff0000',
                  secondary: '#000',
                },
                style: {
                  border: '2px solid #ff0000',
                  boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
