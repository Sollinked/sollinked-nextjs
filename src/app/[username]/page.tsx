'use client';
import { useSollinked } from "@sollinked/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicUser } from "../../../types";
import { toast } from "react-toastify";
import { CloseCircleOutlined, LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from 'next/image';
import { ellipsizeThis, getEmailDomain, sendTokensTo, swapAndSendTo, toLocaleDecimal } from "@/common/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import logo from '../../../public/logo.png';
import { useRouter } from 'next/navigation';
import { USDC_DECIMALS, USDC_TOKEN_ADDRESS, supportedTokens } from "@/common/constants";
import { Select } from "antd";
import axios from 'axios';
import { PublicKey } from "@solana/web3.js";

const SUBCRIPTION_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_SUBSCRIPTION_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = ({params: { username }}: {params: { username: string}}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [payWith, setPayWith] = useState("USDC");
    const [rate, setRate] = useState(1);
    const [isGettingRate, setIsGettingRate] = useState(false);
    const [isRateError, setIsRateError] = useState(false);
    const [publicUser, setPublicUser] = useState<PublicUser | undefined>();
    const { user, account, mail } = useSollinked();
    const wallet = useWallet();
	const router = useRouter();

    const tiers = useMemo(() => {
        return publicUser?.tiers ?? [];
    }, [ publicUser ]);

    const lowestPricePerMonth = useMemo(() => {
        if(!publicUser) {
            return;
        }

        if(!publicUser.mailingList) {
            return;
        }
        
        if(publicUser.mailingList.tiers.length === 0) {
            return;
        }

        let lowestRate = publicUser.mailingList.tiers.map(x => ((x.amount * SUBCRIPTION_FEE) / x.charge_every)).reduce((a,b) => a > b? b : a);
        return toLocaleDecimal(lowestRate, 2, 5);
    }, [ publicUser ]);

    const getRate = useCallback(async() => {
        setIsGettingRate(true);
        setIsRateError(false);
        let { address, decimals } = supportedTokens[payWith];
        try {
            let res = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${USDC_DECIMALS}&swapMode=ExactOut&slippageBps=50`);

            setRate(Math.round(Number(res.data.inAmount) * 1000 / decimals) / 1000);
        }

        catch {
            toast.error('Unable to get rate');
            setIsGettingRate(false);
            setIsRateError(true);
            return;
        }

        setIsGettingRate(false);
    }, [payWith]);

    useEffect(() => {
        if(!account) {
            return;
        }

        const getData = async() => {
            let res = await account.get(username);
            setIsLoading(false);
            if(typeof res === "string") {
                toast.error(res);
                return;
            }

            setPublicUser(res);
        }

        getData();
    }, [ username, account ]);

    useEffect(() => {
        if(email) {
            return;
        }

        setEmail(user.email_address ?? "");
    }, [ user, email ]);

    useEffect(() => {
        setIsEmailValid(!email.includes(getEmailDomain()));
    }, [email]);

    useEffect(() => {
        if(payWith === 'USDC') {
            setRate(1);
            return;
        }

        getRate();
        let interval = setInterval(() => {
            getRate();
        }, 30000); // refresh every 30s

        return () => clearInterval(interval);
    }, [ payWith, getRate ]);

    const onPayClick = useCallback(async(value_usd: number) => {
        if(!mail) {
            return;
        }

        if(!email) {
            toast.error('Please fill in your email.');
            return;
        }

        if(!subject) {
            toast.error('Please fill in the subject.');
            return;
        }

        if(!message) {
            toast.error('Please fill in the message.');
            return;
        }

        if(!wallet || !wallet.publicKey) {
            toast.error('Please connect your wallet!');
            return;
        }

        let mailId = 0;
        let depositTo = "";

        // create a new mail first
        try {
            setIsPaying(true);
      
            let res = await mail.new(username, { replyToEmail: email });

            if(!res) {
                toast.error('Unable to create new mail');
                setIsPaying(false);
                return;
            }

            if(typeof res === 'string') {
                toast.error(res);
                setIsPaying(false);
                return;
            }

            mailId = res.mailId;
            depositTo = res.depositTo;

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
            toast.error('Unable to make payment');
            setIsPaying(false);
            return;
        }

        const { address } = supportedTokens[payWith];
        let responseData = {};
        if(payWith !== "USDC") {
            try {
                let res = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${Math.round(value_usd * USDC_DECIMALS)}&swapMode=ExactOut&slippageBps=50`);
                responseData = res.data;
            }
    
            catch {
                toast.error('Unable to get rate');
                setIsPaying(false);
                return;
            }
        }

        try {
            let txHash = "";
            if(payWith === "USDC") {
                txHash = await sendTokensTo(wallet, depositTo, USDC_TOKEN_ADDRESS, USDC_DECIMALS, value_usd);
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
                autoClose: 30000
            });
            let res = await mail.onPayment(username, { replyToEmail: email, subject, message, txHash, mailId });
            if(typeof res === "string") {
                toast.error(res);
                setIsPaying(false);
                return;
            }
            toast.success('Mail sent!');
            setIsPaying(false);
            setSubject("");
            setMessage("");
      
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
  
    }, [ wallet, username, email, subject, message, payWith, mail ]);  

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
            </div>

            {
                publicUser.mailingList &&
                publicUser.mailingList.tiers.length > 0 &&
                <Link
                    href={`/subscribe/${publicUser.username}`}
                    className={`
                        flex flex-col items-center justify-center
                        min-h-[90px] h-[15vh] w-[90%] lg:w-[75%] xl:w-[50%]
                        mt-10 rounded
                        dark:bg-indigo-500 bg-indigo-200
                    `}
                >
                    <span>
                        Subscribe to their newsletter from only
                    </span>
                    <strong style={{fontSize: 25}}>{lowestPricePerMonth} USDC / mo</strong>
                </Link>
            }

            <div className="flex flex-row space-x-2 w-[90%] lg:w-[75%] xl:w-[50%] mt-2">
                <Link
                    href={`/${publicUser.username}/contentPass`}
                    className={`
                        flex flex-col items-center justify-center
                        h-[50px] w-full
                        rounded
                        dark:bg-indigo-500 bg-indigo-200
                    `}
                >
                    <strong>
                        Content Passes
                    </strong>
                </Link>
                <Link
                    href={`/${publicUser.username}/content`}
                    className={`
                        flex flex-col items-center justify-center
                        h-[50px] w-full
                        rounded
                        dark:bg-indigo-500 bg-indigo-200
                    `}
                >
                    <strong>
                        Contents
                    </strong>
                </Link>
            </div>

            <strong className="mt-10 w-[90%] lg:w-[75%] xl:w-[50%]">Contact {publicUser.display_name ?? publicUser.username} Now</strong>
            <div className={`
                    flex flex-col
                    w-[90%] lg:w-[75%] xl:w-[50%] space-y-2 mt-3
                `}>
                <input 
                  className={`
                    dark:bg-slate-800 bg-white rounded
                    px-3 py-2
                    outline-none disabled:cursor-not-allowed
                    ${isEmailValid? 'dark:border-none border-[1px] border-slate-300' : 'border-[1px] dark:border-red-500 border-red-300' }
                  `} 
                    placeholder='Your Email'
                    onChange={({target: {value}}) => { setEmail(value) }}
                    value={email}
                    disabled={isPaying}
                />
                {
                    !isEmailValid &&
                    <span className='w-full text-start text-xs dark:text-red-500 text-red-300'>Please do not use a @{getEmailDomain()} address</span>
                }
                <input 
                  className={`
                    dark:bg-slate-800 bg-white rounded
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none disabled:cursor-not-allowed
                  `} 
                    placeholder='Subject'
                    onChange={({target: {value}}) => { setSubject(value) }}
                    value={subject}
                    disabled={isPaying}
                />
                <textarea 
                  className={`
                    dark:bg-slate-800 bg-white rounded min-h-[25vh]
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none disabled:cursor-not-allowed
                  `} 
                    placeholder="Message"
                    onChange={({target: {value}}) => { setMessage(value) }}
                    value={message}
                    disabled={isPaying}
                />
            </div>
            <div className="
                flex flex-row
                w-[90%] lg:w-[75%] xl:w-[50%] mt-3
            ">
                <Select 
                    className="w-full"
                    value={payWith}
                    onChange={(value) => setPayWith(value)}
                >
                    {
                        Object.keys(supportedTokens).map(x => {
                            return (
                                <Select.Option value={x} key={`pay-with-${x}`}>Pay with {x}</Select.Option>
                            )
                        })
                    }
                </Select>
            </div>
            <div className={`
              flex flex-col justify-end space-x-2
              w-[90%] lg:w-[75%] xl:w-[50%] mt-3
            `}>
                {
                isPaying &&
                <div className={`mr-5 items-center justify-center md:flex hidden`}>
                    <LoadingOutlined/>
                </div>
                }
                {
                    (tiers.length === 0)?
                    <strong className="dark:text-red-300 text-red-500 md:text-base text-sm">User has yet to set up Payment Tiers.</strong>:
                    <>
                    <div className={`
                        grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-2 gap-1 w-full
                    `}>
                    {
                        tiers.map((x, index) => (
                            <button 
                                key={`book-button-${index}`}
                                onClick={() => { onPayClick(x.value_usd) }}
                                disabled={isPaying || !email || !isEmailValid}
                                className={`
                                dark:bg-indigo-800 bg-indigo-200 rounded w-full px-3 py-2 text-xs
                                dark:border-none shadow border-[1px] border-slate-300
                                disabled:cursor-not-allowed
                                `}
                            >
                                {toLocaleDecimal(x.value_usd * rate, 2, 2)} {payWith} ({x.respond_days} {x.respond_days === 1? "Day" : "Days"})
                            </button>
                        ))
                    }
                    
                    </div>
                    <span className="mt-3 text-xs">*Pay x USDC to get a reply within (days)</span>
                    </>
                }
            </div>
            {
              isPaying &&
              <div className={`w-full items-center justify-center mt-10 md:hidden flex`}>
                <LoadingOutlined/>
              </div>
            }
        </div>
    )
}

export default Page;