'use client';

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MailingListPriceTier, User, UserReservationSetting, UserTier } from '../../../types';
import { useSollinked } from '@sollinked/sdk';
import { cloneObj, getDappDomain, getEmailDomain, getMd5, getRPCEndpoint, toLocaleDecimal } from '@/common/utils';
import { UserDetailsKeys } from './types';
import Image from 'next/image';
import Icon from '@mdi/react';
import { mdiCameraPlus } from '@mdi/js';
import { toast } from 'react-toastify';
import { Table, Modal } from 'antd';
import { Input } from '@/components/Input';
import { LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import logo from '../../../public/logo.png';
import { ElusivViewer, SEED_MESSAGE, Elusiv } from '@elusiv/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';

const Page = () => {
    const { user, account, calendar, mail } = useSollinked();
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingTags, setIsUpdatingTags] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    //inputs
    const [userDetails, setUserDetails] = useState<User>(user);
    const [pfpFile, setPfpFile] = useState<File>();
    const [pfp, setPfp] = useState<string>(user.profile_picture ?? "");
	const [respondDay, setRespondDay] = useState("");
	const [respondPrice, setRespondPrice] = useState("");
	const [day, setDay] = useState(0);
	const [hour, setHour] = useState(0);
	const [reservationPrice, setReservationPrice] = useState("");

    let inputRef = useRef<any>(null);
    const domain = useMemo(() => getEmailDomain(), []);
    const connection = useMemo(() => {
      return new Connection(getRPCEndpoint());
    }, []);
    const wallet = useWallet();
	const router = useRouter();

    /**
     * Input fields
     */
    const onSetPfpClick = useCallback(() => {
        if(!inputRef || !inputRef.current) {
            return;
        }

        inputRef.current.click();
    }, []);

    const onPfpValueChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setPfp(URL.createObjectURL(event.target.files[0]));
            setPfpFile(event.target.files[0]);
        }
    }, []);

    const onUserDetailsChanged = useCallback((value: string | number, param: UserDetailsKeys) => {
        let cloned = cloneObj(userDetails) as any; // must do this cause of typing error
        cloned[param] = value;
        setUserDetails(cloned);
    }, [ userDetails ]);

	const onDeleteMessageIndex = useCallback((index: number) => {
		let cloned = cloneObj(userDetails);
		if(!cloned || !cloned.tiers) {
			return;
		}

		cloned.tiers = cloned.tiers.filter((x, i) => i !== index);
		setUserDetails(cloned);
	}, [userDetails]);

	const onDeleteCalendarIndex = useCallback((index: number) => {
		let cloned = cloneObj(userDetails);
		if(!cloned || !cloned.reservationSettings) {
			return;
		}
		
		cloned.reservationSettings = cloned.reservationSettings.filter((x, i) => i !== index);
		setUserDetails(cloned);
	}, [userDetails]);

    const mailTierColumns = useMemo(() => {
        return [
            {
                title: 'Value (USDC)',
                dataIndex: 'value_usd',
                key: 'value_usd',
                render: (data: string, row: UserTier) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{toLocaleDecimal(data, 2, 2)}
						</div>
					)
                },
            },
            {
                title: 'Respond In (Days)',
                dataIndex: 'respond_days',
                key: 'respond_days',
                render: (data: string, row: UserTier) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{data}
						</div>
					)
                },
            },
            {
                title: 'Action',
                dataIndex: 'id',
                key: 'id',
                render: (data: string, row: UserTier, index: number) => {
                    return (
						<button 
							className={`
								dark:text-white text-black text-xs dark:bg-red-500 bg-red-200
								px-2 py-1
								rounded-lg
							`}
							onClick={() => onDeleteMessageIndex(index)}
						>
							Delete
						</button>
                    );
                },
                sorter: false,
            },
        ]
    }, [ onDeleteMessageIndex ]);

    const calendarTierColumn = useMemo(() => {
        return [
            {
                title: 'Day',
                dataIndex: 'day',
                key: 'day',
                render: (data: string, row: UserReservationSetting) => {
					let dayStr = "Monday";
					switch(Number(data)) {
						case 0:
							dayStr = "Sunday";
							break;
						case 1:
							dayStr = "Monday";
							break;
						case 2:
							dayStr = "Tuesday";
							break;
						case 3:
							dayStr = "Wednesday";
							break;
						case 4:
							dayStr = "Thursday";
							break;
						case 5:
							dayStr = "Friday";
							break;
						case 6:
							dayStr = "Saturday";
							break;
					}
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{dayStr}
						</div>
					)
                },
            },
            {
                title: 'Hour',
                dataIndex: 'hour',
                key: 'hour',
                render: (data: string, row: UserReservationSetting) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{data.toString().padStart(2, '0')}:00
						</div>
					)
                },
            },
            {
                title: 'Value (USDC)',
                dataIndex: 'reservation_price',
                key: 'reservation_price',
                render: (data: string, row: UserReservationSetting) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{toLocaleDecimal(data, 2, 2)}
						</div>
					)
                },
            },
            {
                title: 'Action',
                dataIndex: 'id',
                key: 'id',
                render: (data: string, row: UserReservationSetting, index: number) => {
                    return (
						<button 
							className={`
								dark:text-white text-black text-xs dark:bg-red-500 bg-red-200
								px-2 py-1
								rounded-lg
							`}
							onClick={() => onDeleteCalendarIndex(index)}
						>
							Delete
						</button>
                    );
                },
                sorter: false,
            },
        ]
    }, [ onDeleteCalendarIndex ]);

    // save button
    const onSaveClick = useCallback(async() => {
        if(!userDetails) {
            toast.error('Empty user details');
            return;
        }

        if(!account) {
            return;
        }

        if(!mail) {
            return;
        }

        if(!calendar) {
            return;
        }

		if(!user.address) {
            toast.error('Please connect your wallet');
            return;
		}

        setIsSaving(true);
        try {

			// trim it so that it wont bug out in the backend
			let trimmedUserDetails: { [key: string]: any } = {};
			for(const [key, value] of Object.entries(userDetails)) {
				let altered = value;
				if(typeof(altered) === 'string') {
					altered = altered.trim();
				}
				trimmedUserDetails[key] = altered;
			}

			let username: string = trimmedUserDetails.username;
			if((username.match(/\s/g)?.length ?? 0) > 0) {
                toast.error("Invalid receiver address: please remove the space(s)");
                setIsSaving(false);
                return;
			}

            let res = await account.update({
                ...trimmedUserDetails,
                profile_picture: pfpFile,
            });
    
            if(res && (typeof res === 'string' || typeof res.data === 'string')) {
                let errMessage = typeof res === 'string'? res : res.data.data;
                toast.error(errMessage ?? "Error saving data");
                setIsSaving(false);
                return;
            }

            // update user tiers
            let res2 = await mail.setTiers(userDetails.tiers ?? []);
            if(res2 && (typeof res2 === 'string' || typeof res2.data === 'string')) {
                let errMessage = typeof res2 === 'string'? res2 : res2.data.data;
                toast.error(errMessage ?? "Error saving data");
                setIsSaving(false);
                return;
            }


            // update user tiers
            let res3 = await calendar.setPresetPrice(userDetails.reservationSettings ?? []);
            if(res3 && (typeof res3 === 'string' || typeof res3.data === 'string')) {
                let errMessage = typeof res3 === 'string'? res3 : res3.data.data;
                toast.error(errMessage ?? "Error saving data");
                setIsSaving(false);
                return;
            }

            setTimeout(() => {
                toast.success("Updated");
                // getData();
                setIsSaving(false);
            }, 300);
        }

        catch(e) {
            console.log(e);

            setTimeout(() => {
                toast.error("Error saving data");
                setIsSaving(false);
            }, 300);
            return;
        }
        return;
    }, [ calendar, mail, account, userDetails, pfpFile, user ]);


	// user tags
	const onRefreshUserTag = useCallback(async() => {
        if(!userDetails) {
            toast.error('Empty user details');
            return;
        }

        if(!account) {
            return;
        }

		if(!user.address) {
            toast.error('Please connect your wallet');
            return;
		}

		if(!wallet) {
            toast.error('Please connect your wallet');
            return;
		}

        if(!wallet.signMessage) {
            console.error('Verification error: no sign message function');
            return;
        }

		setIsUpdatingTags(true);

		const getRank = (number: BigNumber) => {
			if(number.isGreaterThan(1e15)) {
				return "> 1,000T";
			}

			if(number.isGreaterThan(1e12)) {
				return "> 1T";
			}

			if(number.isGreaterThan(1e9)) {
				return "> 1B";
			}

			if(number.isGreaterThan(1e6)) {
				return "> 1M";
			}

			if(number.isGreaterThan(1e3)) {
				return "> 1k";
			}

			if(number.isGreaterThan(1e2)) {
				return "> 100";
			}


			if(number.isGreaterThan(1e1)) {
				return "> 10";
			}


			if(number.isGreaterThan(1)) {
				return "> 1";
			}

			return "<= 1";
		}

		try {           
			// symbol : decimals
			let supportedTokens = {
				"LAMPORTS": 1e9, 
				"USDC": 1e6, 
				"USDT": 1e6, 
				"mSOL": 1e9, 
				"BONK": 1e9, 
				"SAMO": 1e9, 
				"stSOL": 1e9, 
				"ORCA": 1e6, 
				"RAY": 1e6,
			};
			
			let tags = [];

			toast.info("Getting Elusiv Balances");
            const msg = Buffer.from(SEED_MESSAGE, 'utf-8');
            const seed = await wallet.signMessage(msg);

			// Create the elusiv instance
			const elusiv = await Elusiv.getElusivInstance(
				seed,
				new PublicKey(user.address),
				connection,
				"mainnet-beta",
			);
		
			// Get the root viewing key for the user
			const rvk = elusiv.getRootViewingKey();
		
			// Create ElusivViewer instance
			const viewer = await ElusivViewer.getElusivViewerInstance(
				rvk,
				connection,
				"mainnet-beta",
			);
		
			for(let [symbol, decimals] of Object.entries(supportedTokens)) {
				// Fetch our current private balance (with ElusivViewer)
				const viewerBalance = await viewer.getLatestPrivateBalance(symbol);
				const tokenBalance = new BigNumber(viewerBalance).div(new BigNumber(decimals));
				console.log(`Current private ${symbol} balance (with ElusivViewer): ${viewerBalance} : ${tokenBalance.toString()}`);
				if(tokenBalance.isEqualTo(0)) {
					continue;
				}
				const rank = getRank(tokenBalance);
				symbol = symbol === "LAMPORTS"? "SOL" : symbol;
				console.log(`Current Rank: ${rank} ${symbol}`);
				tags.push(`${rank} ${symbol}`);
			}

			let hash = getMd5(JSON.stringify(tags));
			
			// update user tiers
			let res = await account.updateTags({ tags, hash });
			if(res && (typeof res === 'string' || typeof res.data === 'string')) {
				let errMessage = typeof res === 'string'? res : res.data.data;
				toast.error(errMessage ?? "Error saving data");
				setIsUpdatingTags(false);
				return;
			}

			setTimeout(() => {
				toast.success("Updated Tags");
				// getData();
				setIsUpdatingTags(false);
			}, 300);
		}

        catch(e: any) {
            setTimeout(() => {
                toast.error("Error saving data");
                setIsUpdatingTags(false);
            }, 300);
            return;
        }
	}, [ account, userDetails, user, connection, wallet ]);

	const onNewMailTier = useCallback(() => {
		let cloned = cloneObj(userDetails);
		if(!cloned.tiers) {
			cloned.tiers = [];
		}

		cloned.tiers.push({
			id: cloned.tiers.length + 1,
			value_usd: Number(respondPrice),
			respond_days: Number(respondDay),
		});

		setUserDetails(cloned);
		setIsModalOpen(false);
		setRespondDay("");
		setRespondPrice("");
	}, [ userDetails, respondDay, respondPrice ]);

	const onNewCalendarPreset = useCallback(() => {
		let cloned = cloneObj(userDetails);
		if(!cloned.reservationSettings) {
			cloned.reservationSettings = [];
		}

		if(!reservationPrice) {
			return;
		}

		// replace the current setting
		let hasDuplicate = false;
		cloned.reservationSettings.forEach((r, index) => {
			if(r.day !== day || r.hour !== hour) {
				return
			}

			hasDuplicate = true;
			cloned.reservationSettings![index].reservation_price = Number(reservationPrice);
		});

		// if doesn't have the setting, add setting
		if(!hasDuplicate) {
			cloned.reservationSettings.push({
				user_id: userDetails.id,
				day,
				hour,
				reservation_price: Number(reservationPrice)
			});
		}

		setUserDetails(cloned);
		setIsCalendarModalOpen(false);
		setDay(0);
		setHour(0);
		setReservationPrice("");
	}, [ userDetails, day, hour, reservationPrice ]);

    // whenever user updates
    useEffect(() => {
		setPfp(user.profile_picture ?? "");
        setUserDetails(user);
    }, [user]);

	// modal functions
	const handleCancel = useCallback(() => {
		setIsModalOpen(false);
	}, []);

	const handleCalendarCancel = useCallback(() => {
		setIsCalendarModalOpen(false);
	}, []);


	return (
		<div
		>
			<div className={`
				${user.id === 0? 'hidden' : ''}
				flex flex-row px-3 items-center justify-between
				md:h-[60px] h-[70px]
				md:sticky fixed top-0 left-0 right-0 md:w-full w-[100vw]
				md:backdrop-blur-none backdrop-blur-sm md:bg-transparent dark:md:bg-transparent dark:bg-slate-300/10
				z-10 animate-fade-in
			`}>
				<div>
					<button
						className={`
							flex items-center justify-start
							w-[60px] md:hidden
						`}
						onClick={() => router.back()}
					>
						<LeftOutlined/>
					</button>
				</div>
				<div className="space-x-2">
					<button
						className={`
							rounded dark:bg-green-600 bg-green-300
							md:w-[120px] w-[80px] py-2
							md:text-sm text-xs drop-shadow-lg
							dark:text-white text-black
						`}
						onClick={onSaveClick}
						disabled={isSaving}
					>
						{ isSaving? 'Saving..' : 'Save' }
					</button>
				</div>
			</div>
			<div 
				className={`
					flex xl:flex-row flex-col items-center justify-center
					my-auto ml-auto md:mt-[30px] mt-[70px]
				`}
			>
            	<input ref={inputRef} type="file" className='hidden' name="profile" onChange={onPfpValueChanged} accept='image/jpeg, image/png'></input>
                <button 
					onClick={onSetPfpClick}
					className='relative mb-5 xl:mb-0'
				>
					<Image 
						src={pfp? pfp : logo} 
						alt="pfp"
						width={120}
						height={120}
						className='rounded-full bg-white'
					/>
					<div 
						className={`
							absolute inset-0
							rounded-full bg-gray-950/30
							text-[10px] text-white
							flex items-center justify-center
						`}
					>
						<Icon path={mdiCameraPlus} size={1.5}/>
					</div>
                </button>

                <div 
					className={`
						flex flex-col md:w-[500px] xl:w-[28vw] w-[90vw]
						xl:ml-[50px] space-y-1
					`}
				>
					<Input
						addonBefore='Display Name'
						type="text"
						placeholder='Display Name'
						value={userDetails.display_name ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "display_name")}
					/>
					<Input
						addonBefore='Username'
						type="text"
						placeholder='username'
						value={userDetails.username ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "username")}
					/>
					<Input
						addonBefore='Your Real Email'
						type="text"
						placeholder='your_real_email@domain.com'
						value={userDetails.email_address ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "email_address")}
					/>
                </div>
            </div>

			<div className={`
				xl:w-[40vw] md:w-[500px] w-[90vw] m-auto
				space-y-1 mt-5
			`}>
				<Input
					addonBefore='Public Address'
					type="text"
					placeholder=''
					value={`${userDetails.username}@${domain}`} 
					readOnly
				/>
				<Input
					addonBefore='Calendar'
					type="text"
					placeholder=""
					value={`${getDappDomain()}/${userDetails.username}/reserve`}
					readOnly
				/>
				<Input
					addonBefore='Subscription'
					type="text"
					placeholder=""
					value={`${getDappDomain()}/${userDetails.username}/subscribe`}
					readOnly
				/>
				<Input
					addonBefore='Blog'
					type="text"
					placeholder=""
					value={`${getDappDomain()}/${userDetails.username}/blog`}
					readOnly
				/>
			</div>
			
			{/* <h2 className='m-auto mt-10 text-center'>Social Accounts</h2>
			<div className={`
				xl:w-[40vw] md:w-[500px] w-[90vw] m-auto
				space-y-1 mt-3
			`}>
				<Input 
					type="text" 
					addonBefore="Twitter"
					placeholder="https://twitter.com/username" 
					value={userDetails.twitter ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "twitter")}
				/>
				<Input 
					type="text" 
					addonBefore="Facebook"
					placeholder="https://facebook.com/username" 
					value={userDetails.facebook ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "facebook")}
				/>
				<Input 
					type="text" 
					addonBefore="Twitch"
					placeholder="https://twitch.tv/username" 
					value={userDetails.twitch ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "twitch")}
				/>
				<Input 
					type="text" 
					addonBefore="Instagram"
					placeholder="https://instagram.com/username" 
					value={userDetails.instagram ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "instagram")}
				/>
				<Input 
					type="text" 
					addonBefore="Tiktok"
					placeholder="https://tiktok.com/username" 
					value={userDetails.tiktok ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "tiktok")}
				/>
				<Input 
					type="text" 
					addonBefore="Youtube"
					placeholder="https://youtube.com/username" 
					value={userDetails.youtube ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "youtube")}
				/>
			</div> */}

			<div className={`
				m-auto mt-10 
				text-center
				flex flex-row justify-center align-center
			`}>
				<span>Chat Tags</span>
				<button
					className={`
						ml-3 my-auto border-[1px]
						h-7 w-7 text-[20px]
						rounded
						flex items-center justify-center
						dark:text-white text-white bg-green-500
						border-none
					`}
					onClick={onRefreshUserTag}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
						className={`w-4 h-4 ${isUpdatingTags? 'animate-spin' : ''}`}
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
					</svg>
				</button>
			</div>
			
			<div className={`
				text-center mt-1
				flex flex-col justify-center align-center
			`}>
				<div className="xl:w-[40vw] md:w-[500px] w-[90vw] m-auto text-xs">
					<span>* Chat tags are generated based on your private balances on Elusiv.</span>
				</div>
				<div className="xl:w-[40vw] md:w-[500px] w-[90vw] m-auto text-xs space-y-2 mt-3">
				{
					user.tags?.map((tag, index) => (
						<div className="px-3 py-2 dark:bg-yellow-600 bg-yellow-400 rounded" key={`tag-${index}`}>
							{tag.name}
						</div>
					))
				}
				</div>
			</div>

			<div className={`
				m-auto mt-10 
				text-center
				flex flex-row justify-center align-center
			`}>
				<span>Mail Settings</span>
				<button
					className={`
						ml-3 my-auto border-[1px]
						h-7 w-7 text-[20px]
						rounded
						flex items-center justify-center
						dark:text-white text-white bg-green-500
						border-none
					`}
					onClick={() => { setIsModalOpen(true) }}
				>
					<span>+</span>
				</button>
			</div>
			<div className={`
				flex flex-col items-center justify-start
				w-full
				mt-3 mb-3
			`}>
				<div className={`
					flex flex-col items-center justify-start
					shadow
					rounded-md
				`}>
					<Table
						className='xl:w-[40vw] md:w-[500px] w-[90vw]'
						columns={mailTierColumns}
						dataSource={userDetails.tiers}
						pagination={false}
						rowKey={(r) => `mail-tier-${r.id}`}
					/>
				</div>
			</div>

			<div className={`
				m-auto mt-10 
				text-center
				flex flex-row justify-center align-center
			`}>
				<span>Calendar Settings</span>
				<button
					className={`
						ml-3 my-auto border-[1px]
						h-7 w-7 text-[20px]
						rounded
						flex items-center justify-center
						dark:text-white text-white bg-green-500
						border-none
					`}
					onClick={() => { setIsCalendarModalOpen(true) }}
				>
					<span>+</span>
				</button>
			</div>

			<div className={`
				flex flex-col items-center justify-start
				w-full
				mt-3 mb-3
			`}>

				<div className="xl:w-[40vw] md:w-[500px] w-[90vw] mb-2">
					<Input
						addonBefore='Max'
						addonAfter='Days In Advance'
						type="number"
						placeholder='100'
						value={userDetails.calendar_advance_days.toString() ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "calendar_advance_days")}
					/>
				</div>

				<div className={`
					flex flex-col items-center justify-start
					shadow
					rounded-md
				`}>
					<Table
						className='xl:w-[40vw] md:w-[500px] w-[90vw]'
						columns={calendarTierColumn}
						dataSource={userDetails.reservationSettings}
						pagination={false}
						rowKey={(r) => `calendar-tier-${r.day}-${r.hour}`}
					/>
				</div>
			</div>
			<Modal
				title="New Mail Tier" 
				open={isModalOpen} 
				onOk={onNewMailTier} 
				onCancel={handleCancel}
				footer={[
					<button 
						key="submit" 
						onClick={onNewMailTier}
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
					addonBefore="Respond In Days"
					value={respondDay.toString()}
					onChange={({ target: {value}}) => { setRespondDay(value) }}
					placeholder='0'
				/>
				<div className="mb-1"></div>
				<Input
					type="number"
					addonBefore="Price"
					value={respondPrice.toString()}
					onChange={({ target: {value}}) => { setRespondPrice(value)}}
					placeholder='0'
					step="0.01"
				/>
			</Modal>

			<Modal
				title="New Calendar Preset" 
				open={isCalendarModalOpen} 
				onOk={onNewCalendarPreset} 
				onCancel={handleCalendarCancel}
				footer={[
					<button 
						key="submit" 
						onClick={onNewCalendarPreset}
						className={`
							bg-green-500 dark:text-white text-black rounded
							px-3 py-2
						`}
					>
						Add
					</button>,
				]}
			>
				<select
					className={`
						w-full border-[1px] rounded
						px-3 py-1 mb-1 mt-3
						dark:bg-slate-700 dark:text-white text-black border-slate-600
					`}
					onChange={({target: {value}}) => { setDay(Number(value)) }}
				>
					<option value="0">Sunday</option>
					<option value="1">Monday</option>
					<option value="2">Tuesday</option>
					<option value="3">Wednesday</option>
					<option value="4">Thursday</option>
					<option value="5">Friday</option>
					<option value="6">Saturday</option>
				</select>
				<select
					className={`
						w-full border-[1px] rounded
						px-3 py-1 mb-1
						outline-none 
						dark:bg-slate-700 dark:text-white text-black border-slate-600
					`}
					onChange={({target: {value}}) => { setHour(Number(value)) }}
				>
					<option value="0">12 AM</option>
					<option value="1">1 AM</option>
					<option value="2">2 AM</option>
					<option value="3">3 AM</option>
					<option value="4">4 AM</option>
					<option value="5">5 AM</option>
					<option value="6">6 AM</option>
					<option value="7">7 AM</option>
					<option value="8">8 AM</option>
					<option value="9">9 AM</option>
					<option value="10">10 AM</option>
					<option value="11">11 AM</option>
					<option value="12">12 PM</option>
					<option value="13">1 PM</option>
					<option value="14">2 PM</option>
					<option value="15">3 PM</option>
					<option value="16">4 PM</option>
					<option value="17">5 PM</option>
					<option value="18">6 PM</option>
					<option value="19">7 PM</option>
					<option value="20">8 PM</option>
					<option value="21">9 PM</option>
					<option value="22">10 PM</option>
					<option value="23">11 PM</option>
				</select>
				<Input
					type="number"
					addonBefore="Price"
					value={reservationPrice ?? ""}
					onChange={({ target: {value}}) => { setReservationPrice(value)}}
					placeholder='0'
				/>
			</Modal>
		</div>
	);
};

export default Page;
