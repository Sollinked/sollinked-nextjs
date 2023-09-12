'use client';

import SideBar from '@/components/SideBar';
import Header from '@/components/Header';
import { CookiesProvider } from 'react-cookie';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useMemo } from 'react';
import { useSollinked, Provider as SollinkedProvider } from '@sollinked/sdk';
import { VERIFY_MESSAGE } from '@/common/constants';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');


const Wrapped = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    const wallet = useWallet();

    const address = useMemo(() => {
        return wallet.publicKey?.toBase58() ?? "";
    }, [wallet]);

    return (
        <SollinkedProvider
            auth={{
                address,
                message: VERIFY_MESSAGE,
            }}
        >
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
        </SollinkedProvider>
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
                        {children}
                    </Wrapped>
                  </WalletModalProvider>
              </WalletProvider>
          </ConnectionProvider>
        </CookiesProvider>
    )
}

export default Layout;