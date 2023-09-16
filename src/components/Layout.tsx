'use client';

import SideBar from '@/components/SideBar';
import Header from '@/components/Header';
import { CookiesProvider } from 'react-cookie';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Provider as SollinkedProvider } from '@sollinked/sdk';
import { VERIFY_MESSAGE } from '@/common/constants';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/hooks/useTheme';
import Head from 'next/head';
import {NextSeo} from 'next-seo';


// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');


const Wrapped = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    const wallet = useWallet();
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const pathname = usePathname();

    const address = useMemo(() => {
        return wallet.publicKey?.toBase58() ?? "";
    }, [wallet]);

    const onSidebarToggle = useCallback(() => {
        setIsSidebarActive(!isSidebarActive);
    }, [ isSidebarActive ]);

    const closeSidebar = useCallback(() => {
        if(!isSidebarActive) {
            return;
        }

        setIsSidebarActive(false);
    }, [ isSidebarActive ]);

    useEffect(() => {
        // close sidebar when the path changes
        closeSidebar();
    }, [ pathname ]);

    return (
        <ThemeProvider>
            <SollinkedProvider
                auth={{
                    address,
                    message: VERIFY_MESSAGE,
                }}
            >
                <SideBar 
                    isActive={isSidebarActive}
                    onCloseClick={onSidebarToggle}
                />
                <div className={`
                    md:w-3/4 w-full max-h-screen overflow-auto
                    relative
                `}>
                    <Header 
                        onMenuClick={onSidebarToggle}
                    />
                    <div className={`
                        md:px-5 md:pb-5 pt-3 px-1 pb-1
                        `}>
                        {children}
                    </div>
                </div>
            </SollinkedProvider>
        </ThemeProvider>
    )
}

const Layout = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;
  
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
            // new UnsafeBurnerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );
  
    return (
        <CookiesProvider>
          <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                    <Wrapped>
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
                        {children}
                    </Wrapped>
                  </WalletModalProvider>
              </WalletProvider>
          </ConnectionProvider>
        </CookiesProvider>
    )
}

export default Layout;