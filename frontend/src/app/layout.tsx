import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZipScape",
  description: "ZIP Code Analysis and Visualization Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-[#232f3e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-white text-2xl font-bold hover:text-[#ff9900]">
                  ZipScape
                </Link>
              </div>
              <div className="flex space-x-1">
                <Link 
                  href="/" 
                  className="text-[#ffffff] hover:text-[#ff9900] px-3 py-2 rounded-sm text-sm font-medium border border-transparent hover:border-[#ff9900]"
                >
                  Home
                </Link>
                <Link 
                  href="/lookup" 
                  className="text-[#ffffff] hover:text-[#ff9900] px-3 py-2 rounded-sm text-sm font-medium border border-transparent hover:border-[#ff9900]"
                >
                  Lookup
                </Link>
                <Link 
                  href="/jurisdiction" 
                  className="text-[#ffffff] hover:text-[#ff9900] px-3 py-2 rounded-sm text-sm font-medium border border-transparent hover:border-[#ff9900]"
                >
                  Jurisdiction Viewer
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="bg-[#f3f3f3] min-h-screen">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
