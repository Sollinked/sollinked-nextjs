'use client';
import { VERIFY_MESSAGE } from '@/common/constants';
import { BarsOutlined, SearchOutlined } from '@ant-design/icons';
import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSollinked } from '@sollinked/sdk';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';

type HeaderParams = {
    onMenuClick: () => void;
    onHeaderVisibilityChange: (isHidden: boolean) => void;
}

const hideInPaths = [
    '/settings',
];

const hidePathPattern = [
    /\/github\/\d+/g,
    /\/.*\/contentPass/g,
    /\/.*\/content/g,
];

const Header = ({onMenuClick, onHeaderVisibilityChange}: HeaderParams) => {
    const wallet = useWallet();
    const { user, init } = useSollinked();
    const pathname = usePathname();
    const isIniting = useRef<boolean>(false);
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
        onHeaderVisibilityChange(shouldHide && user.id > 0);
    }, [shouldHide, user, onHeaderVisibilityChange]);

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
                //console.error('Verification error: no sign message function');
                return;
            }
            
            if(isIniting.current) {
                // dont set off multiple
                return;
            }

            isIniting.current = true;

            // ask for signature
            const toSign = VERIFY_MESSAGE;
            let signature = "";
            let retries = 0;
            // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
            // This uses a Node.js-style buffer shim in the browser.
            while(retries < 3) {
                try {
                    const msg = Buffer.from(toSign);
                    let signed = await wallet.signMessage(msg);
                    signature = Buffer.from(signed).toString("base64");
                    init(signature);
                    break;
                }

                catch(e: any) {
                    if(e.message.includes("Plugin Closed")) {
                        retries++;
                        continue;
                    }
                    toast.error(e.message);
                    break;
                }

            }

            if(retries === 3) {
                toast.error("Unable to init user profile");
            }

            isIniting.current = false;
        }

        askForSignature();
    }, [user, init, wallet, isIniting]);

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
            <UnifiedWalletButton />
        </div>
      </div>
    )
}

export default Header;