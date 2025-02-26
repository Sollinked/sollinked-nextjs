'use client';

import SideBar from '@/components/SideBar';
import Header from '@/components/Header';
import { CookiesProvider } from 'react-cookie';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter, KeystoneWalletAdapter, TrustWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Provider as SollinkedProvider } from '@sollinked/sdk';
import { VERIFY_MESSAGE } from '@/common/constants';
import { usePathname } from 'next/navigation';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import React from 'react';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');


const Wrapped = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    const wallet = useWallet();
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const [isSidebarActive, setIsSidebarActive] = useState(false);
    const pathname = usePathname();

    const address = useMemo(() => {
        return wallet.publicKey?.toBase58() ?? "";
    }, [wallet]);

    const onSidebarToggle = useCallback(() => {
        setIsSidebarActive(!isSidebarActive);
    }, [ isSidebarActive ]);

    const closeSidebar = useCallback(() => {
        setIsSidebarActive(false);
    }, []);

    useEffect(() => {
        // close sidebar when the path changes
        closeSidebar();
    }, [ pathname, closeSidebar ]);

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
                    w-full max-h-screen overflow-auto
                    relative
                `}>
                    <Header 
                        onMenuClick={onSidebarToggle}
                        onHeaderVisibilityChange={setIsHeaderHidden}
                    />
                    <div className={`
                        md:px-5 md:pb-5 pt-3 px-1 
                        md:pb-3 pb-[70px]
                        ${isHeaderHidden? '' : 'pt-[100px]'}
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

    const {theme} = useTheme();
  
    return (
        <CookiesProvider>
          <ConnectionProvider endpoint={endpoint}>
              <UnifiedWalletProvider
                wallets={[]}
                config={{
                    autoConnect: true,
                    env: 'mainnet-beta',
                    metadata: {
                        name: 'UnifiedWallet',
                        description: 'UnifiedWallet',
                        url: 'https://jup.ag',
                        iconUrls: ['https://jup.ag/favicon.ico'],
                    },
                    // notificationCallback: WalletNotification,
                    walletlistExplanation: {
                        href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
                    },
                    theme: theme
                }}
              >
                <Wrapped>
                    {children}
                </Wrapped>
              </UnifiedWalletProvider>
          </ConnectionProvider>
        </CookiesProvider>
    )
}

export const ThemeLayout = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    return (
        <ThemeProvider>
            <Layout>
                {children}
            </Layout>
        </ThemeProvider>
    )
}

export default ThemeLayout;