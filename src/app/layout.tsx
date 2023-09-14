import Layout from '@/components/Layout';
import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    <html lang="en" className=''>
      <body className={`
        ${inter.className} 
        flex flex-row dark:bg-black dark:text-white
      `}>
          <Layout>
            {children}

            <ToastContainer
              position="bottom-left"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover={false}
              theme={'colored'}
            />
          </Layout>
      </body>
    </html>
  )
}
