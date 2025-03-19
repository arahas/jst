'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body>
        <header className="bg-amazon-darkblue text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">ZipScape 🌐</h1>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/" 
                    className={`hover:text-amazon-yellow ${pathname === '/' ? 'text-amazon-yellow' : ''}`}
                  >
                    Lookup
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/jurisdiction" 
                    className={`hover:text-amazon-yellow ${pathname === '/jurisdiction' ? 'text-amazon-yellow' : ''}`}
                  >
                    Jurisdiction Viewer
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-amazon-lightblue text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>© {new Date().getFullYear()} ZipScape 🌐</p>
          </div>
        </footer>
      </body>
    </html>
  )
} 