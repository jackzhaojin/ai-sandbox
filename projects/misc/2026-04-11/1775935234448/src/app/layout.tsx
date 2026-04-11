import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Postal Checkout",
  description: "Multi-step checkout wizard for B2B postal services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
