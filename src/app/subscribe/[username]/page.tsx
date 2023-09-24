'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { MailingList } from '../../../../types';
import { toast } from 'react-toastify';
import { Socket, io } from 'socket.io-client';
import { useSollinked } from '@sollinked/sdk';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import qs from 'qs';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { getEmailDomain, getRPCEndpoint } from '@/common/utils';

const Page = ({params: { username }}: { params: { username: string }}) => {
    const socketRef = useRef<Socket>();
    const { user, mailingList } = useSollinked();
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [isError, setIsError] = useState(false);
    const [userMailingList, setUserMailingList] = useState<MailingList>();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { theme } = useTheme();
    const wallet = useWallet();
    const isGettingData = useRef(false);

    const getData = useCallback(async() => {
        if(!mailingList) {
            return;
        }

        if(isGettingData.current) {
            return;
        }

        try {
            isGettingData.current = true;
            let res = await mailingList.get(username);

            if(!res) {
                toast.error('Unable to get details');
                return;
            }

            if(typeof res === "string") {
                toast.error(res);
                return;
            }

            let {
                list,
                display_name,
            } = res;

            setUserMailingList(list);
            setDisplayName(display_name);
        }

        catch {
            toast.error('Unable to get user details');
            setIsError(true);
        }

        setIsLoading(false);
        isGettingData.current = false;
    }, []);

    useEffect(() => {
        if(!username) {
            return;
        }

        getData();
    }, [ username, mailingList ]);

    useEffect(() => {
        if(email) {
            return;
        }

        setEmail(user.email_address ?? "");
    }, [ user, email ]);

    useEffect(() => {
        setIsEmailValid(!email.includes(getEmailDomain()));
    }, [email]);

    const onEmailChange = useCallback((value: string) => {
        setEmail(value);
    }, []);
  
    const onPayClick = useCallback(async() => {

        if(!wallet || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please connect your wallet!');
            return;
        }

        if(!userMailingList) {
            toast.error('Unable to find mailing list!');
            return;
        }

        // const USDC_TOKEN_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        // const USDC_DECIMALS = 1000000;

        try {
            setIsPaying(true);

            let priceItem = userMailingList.tiers[selectedIndex];
            const paymentLinkRes = await axios.get(
              `https://api.spherepay.co/v1/public/paymentLink/${priceItem.paymentlink_id}`,
            );

            // code from sphere
            let paymentLink = paymentLinkRes.data.data.paymentLink;
            const query = paymentLink.lineItems.map((lineItem: any) => {
                return {
                    id: lineItem.id,
                    quantity: +lineItem.quantity,
                };
            });

            const payRes = await axios.post(
                `https://api.spherepay.co/v1/public/paymentLink/pay/${priceItem.paymentlink_id}?${qs.stringify(
                    {
                        lineItems: JSON.stringify(query),
                        email: email,
                        network: 'sol'
                    },
                )}`,
                {
                    account: wallet.publicKey.toBase58(),
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            const txBuf = Buffer.from(payRes.data.transaction, "base64");
            const tx = VersionedTransaction.deserialize(txBuf);
            const connection = new Connection(getRPCEndpoint());

            const blockHash = await connection.getLatestBlockhash('confirmed');
            const txId = await wallet.sendTransaction(tx, connection, {
                skipPreflight: true,
            });
            const confirmation = await connection.confirmTransaction({
                blockhash: blockHash.blockhash,
                lastValidBlockHeight: blockHash.lastValidBlockHeight,
                signature: txId
            });
            if (confirmation.value.err) {
                console.log('confirmation error');
                throw Error("Confirmation Error");
            }

            toast.success('Subscribed!');
            setIsPaying(false);
      
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

            toast.error('Unable to make payment');
            setIsPaying(false);
        }
  
    }, [ wallet, userMailingList, selectedIndex, email ]);  

    if(isError) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <CloseCircleOutlined
                    style={{
                        fontSize: 80,
                        color: '#f5222d'
                    }}
                    className='mb-3'
                />
                <strong style={{color: "#f5222d", fontSize: 30}}>Error</strong>
            </div>
        );
    }

    if(isLoading) {
        return (<div className='h-[80vh] w--full flex flex-col justify-center items-center'>
            <LoadingOutlined style={{ fontSize: 80 }}/>
        </div>)
    }

    return (
        <div className={`
            flex flex-col
        `}>
            {
                displayName &&
                <strong>Subscribe to {displayName}</strong>
            }
            <div className="grid xl:grid-cols-3 lg:grid-cols-2 grid-cols-1 gap-2 mt-3">
                {
                    userMailingList?.tiers.map((x, index) => (
                        <button className={`
                                flex flex-col p-1 rounded w-full relative items-center
                                
                                ${ selectedIndex === index?
                                    `dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950` :
                                    `dark:bg-transparent bg-white 
                                    dark:text-slate-200 text-slate-200
                                    border-[1px] dark:border-slate-500 border-gray-950`
                                }
                            `}
                            key={`mailing-price-tier-${index}`}
                            onClick={() => { setSelectedIndex(index) }}
                        >
                            <strong className='text-center p-3 border-b-[0.5px] border-slate-500 w-full' style={{ fontSize: 22 }}>{x.name}</strong>
                            <div className='text-xl mt-5' style={{ fontSize: 40 }}>{x.amount} USDC</div>
                            <div className='text-xs mt-3' style={{ fontSize: 10 }}>Every {x.charge_every} Month</div>
                            <div className='text-xs mb-2' style={{ fontSize: 10 }}>{x.prepay_month} {x.prepay_month > 1? 'months' : 'month'} upfront</div>
                        </button>
                    ))
                }
            </div>
            <div className={`
                flex flex-col
                w-full
                max-w-[600px]
            `}>
                <strong className='mt-10'>Your Info</strong>
                <div className='relative flex flex-col justify-end items-center mt-2 h-full space-y-2'>
                    <input
                        type="text"
                        className={`
                            w-full px-3 py-2 rounded
                            dark:text-white dark:bg-slate-700 bg-white
                            outline-none
                            ${isEmailValid? 'dark:border-none border-[1px] border-slate-300' : 'border-[1px] dark:border-red-500 border-red-300' }
                        `}
                        placeholder='your@email.com'
                        onChange={(e) => onEmailChange(e.target.value)}
                        value={email}
                    />
                    {
                        !isEmailValid &&
                        <span className='w-full text-start text-xs dark:text-red-500 text-red-300'>Please do not use a @{getEmailDomain()} address</span>
                    }
                </div>
                <button
                    className={`
                        mt-3 border-[1px] dark:border-green-700 border-green-200
                        px-3 py-2 rounded dark:bg-green-600 bg-green-300
                        disabled:cursor-not-allowed 
                        dark:disabled:bg-slate-500 dark:disabled:border-slate-600 disabled:bg-slate-200 disabled:border-slate-300 
                        dark:disabled:text-slate-300 disabled:text-slate-500
                    `}
                    onClick={onPayClick}
                    disabled={isPaying || !email || !isEmailValid}
                >
                    {isPaying? 'Subscribing' : 'Subscribe Now'}
                </button>
            </div>
        </div>
    );
}

export default Page;