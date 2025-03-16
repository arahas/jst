import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZIP Code Explorer',
  description: 'Explore ZIP code boundaries and demographics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-amazon-darkblue text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">ZIP Code Explorer</h1>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a href="/" className="hover:text-amazon-yellow">Lookup</a>
                </li>
                <li>
                  <a href="/jurisdiction" className="hover:text-amazon-yellow">Jurisdiction Viewer</a>
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
            <p>© {new Date().getFullYear()} ZIP Code Explorer</p>
          </div>
        </footer>
      </body>
    </html>
  )
} 