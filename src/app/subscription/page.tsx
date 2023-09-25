'use client';
import { toLocaleDecimal } from "@/common/utils";
import { useSollinked } from "@sollinked/sdk";
import { Empty } from "antd";
import Link from 'next/link';
import moment from 'moment';

const Page = () => {
    const { user } = useSollinked();

    return (
        <div className="flex flex-col w-full p-3 items-center">
            <div className="xl:w-[40vw] md:w-[500px] w-[90vw] min-h-[30vh]">
                <strong>Your Subscriptions</strong>
                <div className="mt-5">
                {
                    (!user.subscriptions || user.subscriptions.length === 0)?
                    <div className={`
                        flex flex-col p-3 rounded w-full items-center justify-center
                        dark:bg-slate-600 bg-white
                        dark:border-none border-[1px] border-gray-950
                    `}>
                        <Empty/>
                    </div> :
                    <>
                    <Link
                        href="https://spherepay.co/customer/"
                        target="_blank"
                        className={`
                            flex flex-col items-center justify-center
                            h-[40px] xl:w-[40vw] md:w-[500px] w-[90vw]
                            mb-3 rounded
                            bg-indigo-500
                        `}
                    >
                        Manage Your Subscriptions in SpherePay
                    </Link>
                    {

                        user.subscriptions.map(x => (
                            <div
                                className={`
                                    flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                            >
                                <strong>{x.price_tier!.username} - {x.price_tier!.name}</strong>
                                <span className='text-xs mt-3'>Bill: {toLocaleDecimal(x.price_tier!.amount * 1.05, 2, 5)} USDC every {x.price_tier!.charge_every} Month</span>
                                <span className='text-xs mt-1'>Email: {x.email_address}</span>
                                <span className='text-xs mt-1'>Expiry Date: {moment(x.expiry_date).format('YYYY-MM-DD HH:mm:ss')}</span>
                            </div>
                        ))
                    }
                    </>
                }
                </div>

            </div>
        </div>
    )
}

export default Page;