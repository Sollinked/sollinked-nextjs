'use client';
import { ChangeEvent, useCallback, useMemo, useEffect, useState } from 'react';
import { MailingListPriceTier, User, UserReservationSetting, UserTier } from '../../../types';
import { toast } from 'react-toastify';
import { cloneObj, toLocaleDecimal } from '../../common/utils';
import { useSollinked } from '@sollinked/sdk';
import { ConfigProvider, Empty, Modal } from 'antd';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/Input';
import Link from 'next/link';
import moment from 'moment';
import { LoadingOutlined, RightOutlined } from '@ant-design/icons';

const SUBCRIPTION_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_SUBSCRIPTION_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = () => {
    const { user } = useSollinked();

    // inputs
    const [userDetails, setUserDetails] = useState<User>(user);

    // whenever user updates
    useEffect(() => {
        setUserDetails(user);
    }, [user]);

    return (
        <div 
			className={`
				flex flex-col
			`}
		>
            <div className={`
                text-center
                flex flex-row items-center justify-center
            `}>
                <span>Content Passes</span>
                <Link
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-black bg-green-500
                        border-none
                    `}
                    href="/content/pass/new"
                >
                    <span>+</span>
                </Link>
            </div>

            <div className={`
                flex flex-col
                w-full
                mt-3 mb-3
            `}>
                <div className={`
                    flex flex-col items-center justify-start
                    rounded-md
                `}>
                    {
                        (!userDetails.contentPasses || userDetails.contentPasses.length === 0) &&
                        <div className={`
                            flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] min-h-[30vh] items-center justify-center
                            dark:bg-slate-600 bg-white
                            dark:border-none border-[1px] border-gray-950
                        `}>
                            <Empty/>
                        </div>
                    }
                    {
                        userDetails.contentPasses?.map((x, index) => (
                            <Link className={`
                                    flex flex-row justify-between p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                                key={`content-pass-${index}`}
                                href={`/content/pass/edit/${x.id}`}
                            >
                                <strong>{x.name}</strong>
                                <RightOutlined/>
                            </Link>
                        ))
                    }
                </div>
            </div>

            <div className={`
                mt-10
                text-center
                flex flex-row items-center justify-center
            `}>
                <span>Your Contents</span>
                <Link
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-black bg-green-500
                        border-none
                    `}
                    href={"/content/new"}
                >
                    <span>+</span>
                </Link>
            </div>
            <div className={`
                flex flex-col
                w-full
                mt-3 mb-3
            `}>
                <div className={`
                    flex flex-col items-center justify-start
                    rounded-md
                `}>
                    {
                        (!userDetails.contents || userDetails.contents.length === 0) &&
                        <div className={`
                            flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] min-h-[30vh] items-center justify-center
                            dark:bg-slate-600 bg-white
                            dark:border-none border-[1px] border-gray-950
                        `}>
                            <Empty/>
                        </div>
                    }
                    {
                        userDetails.contents?.map((x, index) => (
                            <Link className={`
                                    flex flex-row justify-between p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                                key={`content-${index}`}
                                href={`/content/edit/${x.id}`}
                            >
                                {x.title}
                                <RightOutlined/>
                            </Link>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

export default Page;