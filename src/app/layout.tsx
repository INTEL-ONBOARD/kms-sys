import type { Metadata } from "next";
import { Anek_Odia } from "next/font/google";
import "./globals.css";
import Provider from "@/Components/Provider";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";

// Importing the Anek Odia font
const anekOdia = Anek_Odia({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], 
  display: 'swap',
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
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
        {/* 2. Wrap the entire application with the Session Provider */}
        <Provider>
          {/* Global Header — appears on every page */}
          <Header />
          {/* Page-specific content */}
          <main>
            {children}
          </main>
          {/* Global Footer — appears on every page */}
          <Footer />
        </Provider>
      </body>
    </html>
  );
}