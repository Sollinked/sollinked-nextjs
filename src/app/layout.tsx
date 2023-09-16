import Layout from '@/components/Layout';
import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import {NextSeo} from 'next-seo';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='dark'>
      <NextSeo
        title="Sollinked | Earn on Solana"
        description="Earning from contents have never been easier."
        canonical="https://sollinked.com"
        openGraph={{
          url: 'https://sollinked.com',
          title: 'Sollinked - Earn on Solana',
          description: 'Earning from contents have never been easier.',
          images: [
            {
              url: 'https://sollinked.com/logo.jpg',
              width: 512,
              height: 512,
              alt: 'Og Image Alt',
              type: 'image/jpeg',
            },
          ],
          site_name: 'Sollinked | Earn on Solana',
        }}
        twitter={{
          handle: '@Sollinked_com',
          site: '@Sollinked_com',
          cardType: 'summary_large_image',
        }}
      />
      <Head>
        <link rel="alternate" href="https://www.sollinked.com"/>
        <link rel="alternate" href="https://app.sollinked.com"/>
      </Head>
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
