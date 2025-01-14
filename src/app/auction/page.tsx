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
                <span>Auctions</span>
                <Link
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-black bg-green-500
                        border-none
                    `}
                    href="/auction/new"
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
                        (!userDetails.auctions || userDetails.auctions.length === 0) &&
                        <div className={`
                            flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] min-h-[30vh] items-center justify-center
                            dark:bg-slate-600 bg-white
                            dark:border-none border-[1px] border-gray-950
                        `}>
                            <Empty/>
                        </div>
                    }
                    {
                        userDetails.auctions?.map((x, index) => {
                            if(moment(x.end_date).isBefore(moment())) {
                                return (
                                    <div
                                        className={`
                                            flex flex-row justify-between p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                            dark:bg-slate-700 bg-white
                                            dark:border-none border-[1px] border-gray-950
                                        `}
                                        key={`content-pass-${index}`}
                                    >
                                        <div className="flex flex-col">
                                            <strong>Auction {index + 1}</strong>
                                            <span className='text-xs'>{moment(x.end_date).isBefore(moment())? 'Ended' : 'Ends'} {moment(x.end_date).fromNow()}</span>
                                        </div>
                                        <div className="flex flex-row items-center">
                                            <div className="flex flex-col items-end mr-5">
                                                <span>{x.stats?.highest_bid ?? 0} USDC</span>
                                                <span className='text-xs'>{x.stats?.bid_count ?? 0} bids</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <Link className={`
                                        flex flex-row justify-between p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                        dark:bg-slate-700 bg-white
                                        dark:border-none border-[1px] border-gray-950
                                    `}
                                    key={`content-pass-${index}`}
                                    href={`/auction/edit/${x.id}`}
                                    
                                >
                                    <div className="flex flex-col">
                                        <strong>Auction {index + 1}</strong>
                                        <span className='text-xs'>{moment(x.end_date).isBefore(moment())? 'Ended' : 'Ends'} {moment(x.end_date).fromNow()}</span>
                                    </div>
                                    <div className="flex flex-row items-center">
                                        <div className="flex flex-col items-end mr-5">
                                            <span>{x.stats?.highest_bid ?? 0} USDC</span>
                                            <span className='text-xs'>{x.stats?.bid_count ?? 0} bids</span>
                                        </div>
                                        <RightOutlined/>
                                    </div>
                                </Link>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    );
}

export default Page;