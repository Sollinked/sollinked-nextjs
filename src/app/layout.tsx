import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SideBar from '@/components/SideBar';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sollinked',
  description: 'Earn on Solana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`
        ${inter.className} 
        flex flex-row
      `}>
        <SideBar />
        <div className={`
          w-3/4 max-h-screen overflow-auto
          relative
        `}>
          <Header />
          <div className={`
              px-5 pb-5 pt-3
            `}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
