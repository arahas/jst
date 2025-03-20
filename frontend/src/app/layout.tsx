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
        <nav className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold">
                  ZipScape
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/" className="hover:bg-gray-700 px-3 py-2 rounded-md">
                  Home
                </Link>
                <Link href="/lookup" className="hover:bg-gray-700 px-3 py-2 rounded-md">
                  Lookup
                </Link>
                <Link href="/jurisdiction" className="hover:bg-gray-700 px-3 py-2 rounded-md">
                  Jurisdiction Viewer
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
