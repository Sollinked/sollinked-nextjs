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
import { LoadingOutlined } from '@ant-design/icons';

const SUBCRIPTION_FEE = (Number(process.env.NEXT_PUBLIC_PAYMENT_SUBSCRIPTION_FEE ?? '0') / 100) + 1; // eg 1.05
const Page = () => {
    const { user, content, contentPass } = useSollinked();
    const { theme } = useTheme();
	const [isSaving, setIsSaving] = useState(false);
    const [isContentPassModalOpen, setIsContentPassModalOpen] = useState(false);

    // inputs
    const [userDetails, setUserDetails] = useState<User>(user);
	const [mailingPriceAmount, setMailingPriceAmount] = useState("");
	const [mailingPriceName, setMailingPriceName] = useState("");
	const [mailingPricePrepayMonth, setMailingPricePrepayMonth] = useState("");
	const [mailingPriceChargeEvery, setMailingPriceChargeEvery] = useState("");

    const onSave = useCallback(async(userDetails: User) => {
        if(!userDetails) {
            toast.error('Empty user details');
            return;
        }

		if(!contentPass) {
			return;
		}

        toast.info('Updating..');
		setIsSaving(true);
        try {
            // update user tiers
			if(userDetails.contentPasses) {
				/* let res4 = await content.update(userDetails.mailingList.id, { prices: userDetails.mailingList.tiers ?? [] });
				if(res4 && (typeof res4 === 'string' || typeof res4.data === 'string')) {
					let errMessage = typeof res4 === 'string'? res4 : res4.data.data;
					toast.error(errMessage ?? "Error saving data");
					setIsSaving(false);
					return;
				} */
			}
            toast.success("Saved");
        }

        catch {
            toast.error('Unable to save data');
        }
		setIsSaving(false);
    }, [ contentPass ]);

	const onNewMailingListPriceTier = useCallback(() => {
		let cloned = cloneObj(userDetails);
		if(!mailingPriceAmount && mailingPriceAmount !== '0') {
			toast.error('Please set the price');
			return
		}
		if(!mailingPriceName) {
			toast.error('Please set the name');
			return
		}
		if(!mailingPriceChargeEvery) {
			toast.error('Please set the charge interval');
			return
		}
		if(!mailingPricePrepayMonth) {
			toast.error('Please set the amount the subscriber has to prepay.');
			return
		}
		if(!cloned.mailingList) {
			cloned.mailingList = {
				id: 0, // 0 = new
				user_id: user.id,
				product_id: "",
				wallet_id: "",
				tiers: [],
			}	
		}

		cloned.mailingList.tiers.push({
			id: 0, // 0 = new
			mailing_list_id: 0, // not used
			price_id: "", // not used
			paymentlink_id: "",
			name: mailingPriceName,
			description: "", // not used for now
			amount: Number(mailingPriceAmount),
			currency: "", // not used for now, it's hardcoded to USDC in the backend
			charge_every: parseInt(mailingPriceChargeEvery),
			prepay_month: parseInt(mailingPricePrepayMonth),
            subscriber_count: 0,
			is_active: true,
		});

		setUserDetails(cloned);
		setIsContentPassModalOpen(false);
		setMailingPriceName("");
		setMailingPriceAmount("");
		setMailingPriceChargeEvery("");
		setMailingPricePrepayMonth("");
        onSave(cloned);
	}, [ userDetails, mailingPriceName, mailingPriceAmount, mailingPriceChargeEvery, mailingPricePrepayMonth, onSave, user ]);


	const onToggleMailingListPriceTierIndex = useCallback((index: number) => {
		let cloned = cloneObj(userDetails);
		if(!cloned || !cloned.mailingList || !cloned.mailingList.tiers) {
			return;
		}

		cloned.mailingList.tiers[index].is_active = !cloned.mailingList.tiers[index].is_active;
		setUserDetails(cloned);
        onSave(cloned);
	}, [userDetails, onSave]);

	const handleMailingListPriceCancel = useCallback(() => {
		setIsContentPassModalOpen(false);
	}, []);

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
                <button
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-black bg-green-500
                        border-none
                    `}
                    onClick={() => { setIsContentPassModalOpen(true) }}
                >
                    <span>+</span>
                </button>
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
                        !userDetails.contentPasses &&
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
                            <div className={`
                                flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                dark:bg-slate-700 bg-white
                                dark:border-none border-[1px] border-gray-950
                            `}
                                key={`content-pass-${index}`}
                            >
                                <strong>{x.name}</strong>
                            </div>
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
                        (!userDetails.broadcasts || userDetails.broadcasts.length === 0) &&
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
                                    flex flex-col p-3 rounded xl:w-[40vw] md:w-[500px] w-[90vw] mb-3 relative
                                    dark:bg-slate-700 bg-white
                                    dark:border-none border-[1px] border-gray-950
                                `}
                                key={`content-${index}`}
                                href={`/content/edit/${x.id}`}
                            >
                                {x.title}
                            </Link>
                        ))
                    }
                </div>
            </div>

            <Modal
                title="New Content Pass" 
                open={isContentPassModalOpen} 
                onOk={onNewMailingListPriceTier} 
                onCancel={handleMailingListPriceCancel}
                footer={[
                    <button 
                        key="submit" 
                        onClick={onNewMailingListPriceTier}
                        className={`
                            bg-green-500 dark:text-white text-black rounded
                            px-3 py-2
                        `}
                    >
                        Add
                    </button>,
                ]}
            >
                <Input
                    type="number"
                    addonBefore="Value (USDC)"
                    value={mailingPriceAmount}
                    onChange={({ target: {value}}) => { setMailingPriceAmount(value) }}
                    placeholder='1, 2, 3, 4, 5...'
                />
                <div className="mb-1"></div>
                <Input
                    type="text"
                    addonBefore="Name"
                    value={mailingPriceName}
                    onChange={({ target: {value}}) => { setMailingPriceName(value) }}
                    placeholder='Your Tier Name'
                />
                <div className="mb-1"></div>
                <Input
                    type="number"
                    addonBefore="Bill Per"
                    value={mailingPriceChargeEvery}
                    onChange={({ target: {value}}) => { setMailingPriceChargeEvery(value)}}
                    placeholder='1, 2, 3, 4, 5... Month'
                    step="1"
                />
                <div className="mb-1"></div>
                <Input
                    type="number"
                    addonBefore="Upfront"
                    value={mailingPricePrepayMonth}
                    onChange={({ target: {value}}) => { setMailingPricePrepayMonth(value)}}
                    placeholder='1, 2, 3, 4, 5... Month'
                    step="1"
                />
                <div className="mt-3 dark:text-white text-black">
                    Subscribers will be paying an extra 5% protocol fee.
                </div>
            </Modal>
        </div>
    );
}

export default Page;