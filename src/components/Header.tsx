'use client';
import { MailOutlined, SearchOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const Header = () => {
    return (
      <div className={`
        flex flex-row px-3 items-center justify-between
        h-[60px]
        sticky top-0 left-0 right-0 
        z-10
      `}>
        <div
            className={`
                flex flex-row items-center
                rounded border-slate-500 border-[1px]
                bg-slate-700
                px-3 py-2
            `}
        >
            <SearchOutlined 
                style={{
                    fontSize: 20
                }}
            />
            <input 
                type="text" 
                className={`
                    w-[200px] focus:w-[300px] ml-2
                    bg-slate-700 outline-none
                    transition-all duration-300
                `}
            />
        </div>
        {/* <div>
            <span className='relative flex flex-row items-center mr-3'>
                <span className="absolute top-[-4px] right-[-4px] flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <MailOutlined 
                    style={{
                        fontSize: 20
                    }}
                />
            </span>
        </div> */}
        <div>
            <WalletMultiButtonDynamic />
        </div>
      </div>
    )
}

export default Header;