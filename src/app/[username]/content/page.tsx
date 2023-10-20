'use client';
import { useSollinked } from "@sollinked/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicUser } from "../../../../types";
import { toast } from "react-toastify";
import { CloseCircleOutlined, LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";
import Image from 'next/image';
import { ellipsizeThis, getEmailDomain, sendTokensTo, swapAndSendTo, toLocaleDecimal } from "@/common/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import logo from '../../../../public/logo.png';
import { useRouter } from 'next/navigation';
import { USDC_DECIMALS, USDC_TOKEN_ADDRESS, supportedTokens } from "@/common/constants";
import { Empty, Select } from "antd";
import moment from 'moment';
import axios from 'axios';
import { PublicKey } from "@solana/web3.js";

const SUBCRIPTION_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_SUBSCRIPTION_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = ({params: { username }}: {params: { username: string}}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [publicUser, setPublicUser] = useState<PublicUser | undefined>();
    const { user, account, mail } = useSollinked();
    const wallet = useWallet();
	const router = useRouter();

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
                <div className={`
                    flex flex-col
                    w-[90%] lg:w-[75%] xl:w-[50%] mt-5
                    space-y-2
                `}>
                    {
                        publicUser.contents?.map(x => (
                            <Link
                                className={`
                                    flex flex-col w-full h-[150px]
                                    p-3 rounded
                                    dark:bg-slate-700 bg-slate-300
                                    relative
                                `}
                                href={`/${publicUser.username}/p/${x.slug}`}
                                key={`content-${x.id}`}
                            >
                                <div className="flex flex-row w-full justify-between">
                                    <strong className="sm:text-base 2xl:text-lg text-base">{x.title}</strong>
                                    <span className="text-xs 2xl:text-base text-sm">{moment(x.updated_at).format('MMM DD')}</span>
                                </div>
                                <span className="mt-3 text-sm 2xl:text-base">{x.description}</span>
                                
                                <div className="absolute bottom-[8px] right-[8px] flex flex-row w-full justify-end space-x-1">
                                    {
                                        x.is_free &&
                                        <strong className="text-xs text-white px-2 py-1 rounded-full bg-green-700">FREE</strong>
                                    }
                                    {
                                        !x.is_free && x.contentPasses && x.contentPasses.map(p => (
                                            <strong key={`pass-${x.id}-${p.id}`} className="text-xs text-white px-2 py-1 rounded-full bg-green-700">{p.name}</strong>
                                        ))
                                    }
                                </div>
                            </Link>
                        ))
                    }
                    {
                        (!publicUser.contents || publicUser.contents.length === 0) &&
                        <div
                            className="flex w-full h-[30vh] dark:bg-slate-700 bg-slate-500 rounded items-center justify-center"
                        >
                            <Empty/>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default Page;