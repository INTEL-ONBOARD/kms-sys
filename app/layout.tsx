import type { Metadata } from "next";
import { Anek_Odia } from "next/font/google";
import "./globals.css";

// Importing the Anek Odia font
const anekOdia = Anek_Odia({
  subsets: ["latin", "oriya"],
  weight: ["200", "300", "400", "500", "600", "700", "800"], 
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Wise East University",
  description: "A Tradition of Excellence - Shaping Leaders, Advancing Knowledge and Inspiring Generations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font's className to the <body> tag */}
      <body className={`${anekOdia.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}