'use client';
import { useSollinked } from "@sollinked/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentCNFT, PublicUser } from "../../../../types";
import { toast } from "react-toastify";
import { CloseCircleOutlined, LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from 'next/image';
import { ellipsizeThis, getContentPaymentAddress, getEmailDomain, sendTokensTo, swapAndSendTo, toLocaleDecimal } from "@/common/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import logo from '../../../../public/logo.png';
import { useRouter } from 'next/navigation';
import { USDC_DECIMALS, USDC_TOKEN_ADDRESS, supportedTokens } from "@/common/constants";
import { Select } from "antd";
import axios from 'axios';
import { PublicKey } from "@solana/web3.js";

const CONTENT_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_CONTENT_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = ({params: { username }}: {params: { username: string}}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [publicUser, setPublicUser] = useState<PublicUser | undefined>();
    const [payWith, setPayWith] = useState("USDC");
    const [rate, setRate] = useState(1);
    const [isGettingRate, setIsGettingRate] = useState(false);
    const [isRateError, setIsRateError] = useState(false);
    const [contentPasses, setContentPasses] = useState<ContentCNFT[]>([]);
    const { user, account, contentPass } = useSollinked();
    const wallet = useWallet();
	const router = useRouter();
    

    const getData = useCallback(async() => {
        if(!account) {
            return;
        }
        let res = await account.get(username);
        setIsLoading(false);
        if(typeof res === "string") {
            toast.error(res);
            return;
        }

        setPublicUser(res);
    }, [username, account]);

    const getOwnContentPasses = useCallback(async() => {
        if(!account) {
            return;
        }

        if(!user || !user.id) {
            return;
        }

        let res = await account.meContentPasses();
        if(!res) {
            toast.error("Unable to content own content passes");
            return;
        }

        if(typeof res === "string") {
            toast.error(res);
            return;
        }
        setContentPasses(res);
    }, [account, user]);

    useEffect(() => {
        getData();
    }, [ getData ]);

    useEffect(() => {
        getOwnContentPasses();
    }, [getOwnContentPasses]);


    const onBuyPassClick = useCallback(async(id: number, name: string, value_usd: number) => {
        if(!contentPass) {
            return;
        }

        if(!wallet || !wallet.publicKey) {
            toast.error('Please connect your wallet!');
            return;
        }

        setIsPaying(true);

        const { address } = supportedTokens[payWith];
        let payValue = value_usd * CONTENT_FEE;
        let responseData = {};
        if(payWith !== "USDC") {
            try {
                let res = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${Math.round(payValue * USDC_DECIMALS)}&swapMode=ExactOut&slippageBps=50`);
                responseData = res.data;
            }
    
            catch {
                toast.error('Unable to get rate');
                setIsPaying(false);
                return;
            }
        }

        toast.info('Please do not navigate away from the page before the tx is complete');
        const depositTo = getContentPaymentAddress();
        try {
            let txHash = "";
            if(payWith === "USDC") {
                txHash = await sendTokensTo(wallet, depositTo, USDC_TOKEN_ADDRESS, USDC_DECIMALS, payValue);
            }

            else {
                txHash = await swapAndSendTo(wallet, new PublicKey(USDC_TOKEN_ADDRESS), new PublicKey(depositTo), responseData);
            }

            if(!txHash) {
                toast.error("Unable to send tx");
                setIsPaying(false);
            }

            toast.info(<a className="flex flex-col" href={`https://solana.fm/tx/${txHash}`} target="_blank" >
                <span>Verifying payment</span>
                <span className="mt-3">Payment Tx Link:</span>
                <span className="mb-3">{ellipsizeThis(txHash, 6, 6)}</span>
                <span>This may take up to a minute.</span>
            </a>, {
                autoClose: 5000
            });
            let res = await contentPass.pay(id, { txHash });
            if(typeof res === "string") {
                toast.error(res);
                setIsPaying(false);
                return;
            }

            toast.success(`Successfully bought ${name}`);
      
        } catch (error: any) {
            if(error.name === "WalletNotConnectedError") {
              toast.error('Please connect your wallet!');
              setIsPaying(false);
              return;
            }
  
            if(error.message.includes("Not enough")) {
              toast.error('Insufficient Balance');
              setIsPaying(false);
              return;
            }
  
            console.log(error)
            toast.error('Error occurred!');
            setIsPaying(false);
        }

        getData();
        getOwnContentPasses();
        setIsPaying(false);
  
    }, [ wallet, payWith, contentPass, getOwnContentPasses, getData ]);  


    if(isLoading) {
        return (
            <div className="h-[80vh] w-full flex items-center justify-center">
                <LoadingOutlined style={{ fontSize: 80 }}/>
            </div>
        );
    }

    if(!publicUser) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <CloseCircleOutlined
                    style={{
                        fontSize: 80,
                        color: '#f5222d'
                    }}
                    className='mb-3'
                />
                <strong style={{color: "#f5222d", fontSize: 30}}>Unable to find user</strong>
            </div>
        )
    }
    return (
        <div className={`
            flex flex-col items-center justify-start
            min-h-[75vh]
        `}>
            
			<div className={`
				flex flex-row px-3 items-center justify-between
				md:h-[60px] h-[70px]
				md:sticky fixed top-0 left-0 right-0 md:w-full w-[100vw]
				dark:bg-black bg-white
				z-10 animate-fade-in
                md:hidden
			`}>
				<div>
					<button
						className={`
							flex items-center justify-start
							w-[60px]
						`}
						onClick={() => router.back()}
					>
						<LeftOutlined/>
					</button>
				</div>
			</div>
            <div className={`
                flex flex-col items-center w-full
            `}>
                <div>
                {
                    <Image 
                        src={publicUser.profile_picture? publicUser.profile_picture : logo} 
                        alt="pfp"
                        width={150}
                        height={150}
                    />
                }
                </div>
                <div 
                    className={`
                        flex flex-row justify-between items-center
                        w-[90%] lg:w-[75%] xl:w-[50%] mt-5
                    `}
                >
                    <strong className="flex flex-row">
                        {publicUser?.display_name ?? publicUser.username}
                        {
                            publicUser.is_verified &&
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-1 dark:text-yellow-300 text-yellow-700">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        }
                    </strong>
                    <div className={`
                        flex flex-row space-x-3
                    `}>
                        <Link 
                            className={`
                                border-[1px] border-white p-1 rounded-full
                            `}
                            href={`/${publicUser?.username}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </Link>
                        <a
                            className={`
                                border-[1px] border-white p-1 rounded-full
                            `}
                            href={`mailto:${publicUser?.username}@${getEmailDomain()}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </a>
                        <Link 
                            className={`
                                border-[1px] border-white p-1 rounded-full
                            `}
                            href={`/reserve/${publicUser?.username}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                            </svg>
                        </Link>
                    </div>
                </div>
                <div className="h-[1px] w-full my-5 dark:bg-slate-700 bg-slate-300"></div>
                <div className={`
                    flex flex-col items-center
                    w-[90%] lg:w-[75%] xl:w-[50%] mt-2
                `}>
                {
                    publicUser.contentPasses?.map(x => {
                        if(x.amount > 0 && x.cnft_count >= x.amount && x.amount !== 0) {
                            return (
                                <Link
                                    className="flex flex-col justify-center items-center
                                    text-white w-[350px] dark:bg-indigo-700 bg-indigo-500 rounded h-[60px] mt-5 "
                                    key={`content-pass-${x.id}`}
                                    href={`https://tensor.trade/trade/caf25e95-e2a7-47ac-ae03-ff4af4173194`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span>Buy {x.name} Pass {x.cnft_count < x.amount || x.amount === 0? `for ${toLocaleDecimal(x.value_usd, 2 ,5)}` : ''}</span>
                                    {
                                        x.amount > 0 &&
                                        <span className="text-xs">({x.cnft_count < x.amount? `${x.amount - x.cnft_count} Left` : 'Secondary Market'})</span>
                                    }
                                </Link>

                            )
                        }

                        return (
                            <button 
                                className="flex flex-col items-center relative
                                text-white w-[350px] dark:bg-indigo-700 bg-indigo-500 rounded mt-5 pb-3"
                                disabled={isPaying || contentPasses.map(x => x.content_pass_id).includes(x.id)}
                                key={`content-pass-${x.id}`}
                                onClick={() => onBuyPassClick(x.id, x.name, x.value_usd)}
                            >
                                {
                                    contentPasses.map(x => x.content_pass_id).includes(x.id) &&
                                    <span className={`text-xs dark:bg-green-500 bg-green-700 rounded p-1 w-full text-left`}>OWNED</span>
                                }
                                <strong className="mt-3">{x.name}</strong>
                                <span className="text-xs w-full p-2 my-3 min-h-[100px] dark:bg-indigo-800 bg-indigo-400 text-left">{x.description}</span>
                                <div className="flex flex-row justify-between text-xs w-full px-3">
                                    <span>{toLocaleDecimal(x.value_usd * CONTENT_FEE, 2 ,5)} USDC</span>
                                    {
                                        x.amount > 0 &&
                                        <span>{x.amount - x.cnft_count} Left</span>
                                    }
                                </div>
                            </button>

                        )
                    })
                }
                </div>
                {
                    !isLoading && isPaying &&
                    <div className="w-full flex justify-center mt-10">
                        <LoadingOutlined style={{fontSize: 60}}/>
                    </div>
                }

            </div>
        </div>
    )
}

export default Page;