'use client';
import { VERIFY_MESSAGE } from '@/common/constants';
import { BarsOutlined, SearchOutlined } from '@ant-design/icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSollinked } from '@sollinked/sdk';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

type HeaderParams = {
    onMenuClick: () => void;
}

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const hideInPaths = [
    '/settings',
];

const hidePathPattern = [
    /\/github\/\d+/g,
    /\/.*\/contentPass/g,
    /\/.*\/content/g,
];

const Header = ({onMenuClick}: HeaderParams) => {
    const wallet = useWallet();
    const { user, init } = useSollinked();
    const pathname = usePathname();
    const shouldHide = useMemo(() => {
        if(hideInPaths.includes(pathname)) {
            return true;
        }

        for(const [key, value] of hidePathPattern.entries()) {
            if(pathname.search(value) !== -1) {
                return true;
            }
        }
        return false;
    }, [ pathname ]);

    useEffect(() => {
        if(!wallet) {
            return;
        }

        if(!wallet.signMessage) {
            console.error('Verification error: no sign message function');
            return;
        }

        if(user && user.id != 0) {
            return;
        }

        if(!init) {
            return;
        }

        const askForSignature = async() => {
            let res = await init();
            // has initialized
            if(res) {
                return;
            }

            if(!wallet.signMessage) {
                console.error('Verification error: no sign message function');
                return;
            }

            // ask for signature
            const toSign = VERIFY_MESSAGE;
            let signature = "";

            // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
            // This uses a Node.js-style buffer shim in the browser.
            const msg = Buffer.from(toSign);
            let signed = await wallet.signMessage(msg);
            signature = Buffer.from(signed).toString("base64");
            init(signature);
        }

        askForSignature();
    }, [user, init, wallet]);

    return (
      <div className={`
        ${shouldHide && user.id > 0? 'hidden' : ''}
        justify-between md:justify-end
        flex flex-row px-3 items-center 
        h-[60px]
        fixed top-2 ${shouldHide? '' : 'left-0 '} md:right-3 right-1
        z-[11]
      `}>
        {/** menu button */}
        <button
            className={`
                ${shouldHide? 'hidden' : ''}
                flex md:hidden
                flex-row items-center
                rounded border-slate-500 border-[1px]
                dark:bg-slate-700 bg-indigo-300
                px-3 py-2
            `}
            onClick={onMenuClick}
        >
            <BarsOutlined 
                style={{
                    fontSize: 20
                }}
            />
        </button>
        <div className='dark:bg-slate-700 rounded border-slate-500 border-[1px] shadow'>
            <WalletMultiButtonDynamic />
        </div>
      </div>
    )
}

export default Header;