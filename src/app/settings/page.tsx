'use client';

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User, UserReservationSetting, UserTier } from '../../../types';
import { useSollinked } from '@sollinked/sdk';
import { cloneObj, getDappDomain, getEmailDomain, toLocaleDecimal } from '@/common/utils';
import { UserDetailsKeys } from './types';
import Image from 'next/image';
import Icon from '@mdi/react';
import { mdiCameraPlus } from '@mdi/js';
import { toast } from 'react-toastify';
import { ConfigProvider, Table, Modal } from 'antd';
import { Input } from '@/components/Input';
import { LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import logo from '../../public/logo.png';

const Page = () => {
    const { user, account, calendar, mail } = useSollinked();
    const [isSaving, setIsSaving] = useState(false);
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
	const [reservationPrice, setReservationPrice] = useState<number>();

    let inputRef = useRef<any>(null);
    const domain = useMemo(() => getEmailDomain(), []);
	const router = useRouter();
	const { theme } = useTheme();

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
    }, [ onDeleteMessageIndex ]);

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


        setIsSaving(true);
        try {
            let res = await account.update({
                ...userDetails,
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
    }, [ calendar, mail, account, userDetails, pfpFile]);

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
			cloned.reservationSettings![index].reservation_price = reservationPrice;
		});

		// if doesn't have the setting, add setting
		if(!hasDuplicate) {
			cloned.reservationSettings.push({
				user_id: userDetails.id,
				day,
				hour,
				reservation_price: reservationPrice
			});
		}

		setUserDetails(cloned);
		setIsCalendarModalOpen(false);
		setDay(0);
		setHour(0);
		setReservationPrice(undefined);
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
				md:sticky fixed top-0 left-0 right-0 md:backdrop-blur-none backdrop-blur-sm md:bg-transparent dark:bg-slate-300/10
				z-10
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
						addonBefore='Receiver'
						addonAfter={`@${domain}`}
						type="text"
						placeholder='Receiver'
						value={userDetails.username ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "username")}
					/>
					<Input
						addonBefore='Send To'
						type="text"
						placeholder='your_real_email@domain.com'
						value={userDetails.email_address ?? ""} 
						onChange={(e) => onUserDetailsChanged(e.target.value, "email_address")}
					/>
					<Input
						addonBefore='Link'
						type="text"
						placeholder=""
						value={`${getDappDomain()}/reserve/${user.username}`}
						readOnly
					/>
                </div>
            </div>
			
			<h2 className='m-auto mt-10 text-center'>Social Accounts</h2>
			<div className={`
				w-[500px] xl:w-[40vw] m-auto
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
			</div>

			<ConfigProvider
				theme={{
					components: {
						Tabs: {
							inkBarColor: theme === "light"? '#1677ff' : 'rgb(99,102,241)',
							itemSelectedColor: theme === "light"? "#1677ff" : 'rgb(255,255,255)',
							itemColor: theme === "light"? "	rgba(0, 0, 0, 0.88)" : 'rgb(100,116,139)',
						},
						Table: {
							fontSize: 10,
							headerBg: theme === "light"? "#fafafa" : 'rgb(51,65,85)',
							headerColor: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
							headerSortActiveBg: theme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
							headerSortHoverBg: theme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
							colorBgContainer: theme === "light"? "#ffffff" : 'rgb(71,85,105)',
							headerSplitColor: theme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
							borderColor: theme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
						},
						Empty: {
							colorText: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
							colorTextDisabled: theme === "light"? "rgba(0, 0, 0, 0.25)" : 'white',
						}
					}
				}}
			>

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
							className='xl:w-[40vw] w-[500px]'
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

					<div className="xl:w-[40vw] md:w-[500px] w-full mb-2">
						<Input
							addonBefore='Max'
							addonAfter='Days In Advance'
							type="number"
							placeholder='0'
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
							className='xl:w-[40vw] w-[500px]'
							columns={calendarTierColumn}
							dataSource={userDetails.reservationSettings}
							pagination={false}
							rowKey={(r) => `calendar-tier-${r.day}-${r.hour}`}
						/>
					</div>
				</div>
			</ConfigProvider>

			<ConfigProvider
				theme={{
					components: {
						Modal: {
							contentBg: theme === "light"? "#ffffff" : 'rgb(30,41,59)',
							headerBg: theme === "light"? "#ffffff" : 'rgb(30,41,59)',
							titleColor: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
							colorIcon: theme === "light"? "rgba(0, 0, 0, 0.45)" : 'white',
						}
					}
				}}
			>
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
						value={reservationPrice?.toString() ?? ""}
						onChange={({ target: {value}}) => { setReservationPrice(Number(value))}}
						placeholder='0'
					/>
				</Modal>
			</ConfigProvider>
		</div>
	);
};

export default Page;
