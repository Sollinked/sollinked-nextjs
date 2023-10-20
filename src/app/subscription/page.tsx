'use client';
import { toLocaleDecimal } from "@/common/utils";
import { useSollinked } from "@sollinked/sdk";
import { Empty } from "antd";
import Link from 'next/link';
import moment from 'moment';
import { useCallback, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

const SUBCRIPTION_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_SUBSCRIPTION_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = () => {
    const { user, mailingList } = useSollinked();
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const onResendClick = useCallback(async(broadcast_id: number) => {
        if(!mailingList) {
            return;
        }
        try {
            let res = await mailingList.resend({
                broadcast_id,
                subscriber_id: user.subscriptions![selectedIndex].id
            });

            if(typeof res === 'string') {
                toast.error(res);
                return;
            }
            
            toast.success('Newsletter resend in progress, you\'ll receive it in a moment.');
        }

        catch(e) {
            console.log(e);
            toast.error('Unable to resend');
        }
    }, [mailingList, selectedIndex, user]);

    if(selectedIndex >= 0) {
        return (
            <div className="flex flex-col w-full p-3 items-center">
                <div className="xl:w-[40vw] md:w-[500px] w-[90vw] min-h-[30vh]">
                    <div className="flex w-full items-start">
                        <button 
                            className={`
                                flex items-center justify-start
                                w-[60px] mb-10
                            `}
                            onClick={() => { setSelectedIndex(-1); }}
                        >
                            <LeftOutlined/>
                        </button>
                        <span className="ml-5">Click the newsletters to resend it to you</span>
                    </div>
                    {

                        user!.subscriptions![selectedIndex].price_tier?.past_broadcasts.map((x, index) => (
                            <button
                                className={`
                                    flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                                key={`past-broadcast-${x.id}`}
                                onClick={() => { onResendClick(x.id) }}
                            >
                                <strong>{x.username} - {x.title}</strong>
                                <span className="text-xs mt-1">Published: {moment(x.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                            </button>
                        ))
                    }
                </div>
            </div>
        )
    }

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
                        href="https://spherepay.co/customer/login"
                        target="_blank"
                        className={`
                            flex flex-col items-center justify-center
                            h-[40px] xl:w-[40vw] md:w-[500px] w-[90vw]
                            mb-3 rounded
                            dark:bg-indigo-500 bg-indigo-200
                            dark:text-white text-black
                        `}
                    >
                        Manage Your Subscriptions in SpherePay
                    </Link>
                    {

                        user.subscriptions.map((x, index) => (
                            <button
                                className={`
                                    flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                                key={`subscription-${x.id}`}
                                onClick={() => { setSelectedIndex(index); console.log({index}) }}
                            >
                                <strong>{x.price_tier!.username} - {x.price_tier!.name}</strong>
                                <span className='text-xs mt-3'>Bill: {toLocaleDecimal(x.price_tier!.amount * SUBCRIPTION_FEE, 2, 5)} USDC every {x.price_tier!.charge_every} Month</span>
                                <span className='text-xs mt-1'>Email: {x.email_address}</span>
                                <span className='text-xs mt-1'>Expiry Date: {moment(x.expiry_date).format('YYYY-MM-DD HH:mm:ss')}</span>
                                <span className='text-xs mt-5'>Published Newsletters: {x.price_tier?.past_broadcasts.length ?? 0}</span>
                            </button>
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