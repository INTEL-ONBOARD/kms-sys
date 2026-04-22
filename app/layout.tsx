import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS System",
  description: "Basic LMS structure with Next.js and MongoDB"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
