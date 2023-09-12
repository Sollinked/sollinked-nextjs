import Layout from '@/components/Layout';
import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

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
          <Layout>
            {children}
          </Layout>
      </body>
    </html>
  )
}
