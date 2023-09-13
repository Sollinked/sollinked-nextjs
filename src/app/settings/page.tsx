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

type InputParams = {
	placeholder: string;
	addonBefore?: string;
	addonAfter?: string;
	type: string;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	readOnly?: boolean;
	step?: string;
}

const Input = ({
	placeholder,
	addonAfter,
	addonBefore,
	type,
	value,
	onChange,
	readOnly,
	step,
}: InputParams) => {
	return (
		<div
			className={`
				flex flex-row
				w-full
			`}
		>
			{
				addonBefore &&
				<div className={`
					flex justify-center items-center bg-slate-600
					min-w-[120px] h-[30px]
					text-white text-xs
					border-slate-700 border-t-[1px] border-l-[1px] border-b-[1px] rounded-l
				`}>
					{addonBefore}
				</div>
			}
			<input
				type={type}
				placeholder={placeholder}
				value={value} 
				onChange={onChange}
				className={`
					w-full ${!addonAfter? 'rounded-r' : ''}
					text-xs text-white bg-slate-700
					pl-3
					focus:outline-none
				`}
				readOnly={readOnly}
				step={step}
			/>
			{
				addonAfter &&
				<div className={`
					flex justify-center items-center bg-slate-600
					min-w-[120px] h-[30px]
					text-white text-xs
					border-slate-700 border-t-[1px] border-r-[1px] border-b-[1px] rounded-[1px] rounded-r
				`}>
					{addonAfter}
				</div>
			}
		</div>
	)
}

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
	const [reservationPrice, setReservationPrice] = useState(0);

    let inputRef = useRef<any>(null);
    const domain = useMemo(() => getEmailDomain(), []);

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
								text-white text-xs
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
								text-white text-xs
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
								text-white text-xs bg-red-500
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
								text-white text-xs
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
								text-white text-xs
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
								text-white text-xs
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
								text-white text-xs bg-red-500
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
		setReservationPrice(0);
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
				flex flex-row px-3 items-center justify-end
				h-[60px]
				sticky top-0 left-0 right-0 
				z-10
			`}>
				<button
					className={`
						rounded bg-green-600
						w-[120px] py-2
						text-sm
					`}
					onClick={onSaveClick}
					disabled={isSaving}
				>
					{ isSaving? 'Saving..' : 'Save' }
				</button>
			</div>
			<div 
				className={`
					flex flex-row items-center justify-center
					my-auto ml-auto mr-[20px] mt-[30px]
				`}
			>
            	<input ref={inputRef} type="file" className='hidden' name="profile" onChange={onPfpValueChanged} accept='image/jpeg, image/png'></input>
                <button 
					onClick={onSetPfpClick}
					className='relative'
				>
					<Image 
						src={pfp? pfp : '/logo.png'} 
						alt="pfp"
						width={120}
						height={120}
						className='rounded-full bg-white'
					/>
					<div 
						className={`
							absolute inset-0
							rounded-full bg-gray-950/30
							text-[10px]
							flex items-center justify-center
						`}
					>
						<Icon path={mdiCameraPlus} size={1.5}/>
					</div>
                </button>

                <div 
					className={`
						flex flex-col w-[30vw]
						ml-[50px] space-y-1
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
						value={`${getDappDomain()}/booking/${user.id}`}
						readOnly
					/>
                </div>
            </div>
			
			<h2 className='m-auto mt-10 text-center'>Social Accounts</h2>
			<div className={`
				w-[40vw] m-auto
				space-y-1 mt-3
			`}>
				<Input 
					type="text" 
					addonBefore="Twitter"
					placeholder="Twitter" 
					value={userDetails.twitter ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "twitter")}
				/>
				<Input 
					type="text" 
					addonBefore="Facebook"
					placeholder="Facebook" 
					value={userDetails.facebook ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "facebook")}
				/>
				<Input 
					type="text" 
					addonBefore="Twitch"
					placeholder="Twitch" 
					value={userDetails.twitch ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "twitch")}
				/>
				<Input 
					type="text" 
					addonBefore="Instagram"
					placeholder="Instagram" 
					value={userDetails.instagram ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "instagram")}
				/>
				<Input 
					type="text" 
					addonBefore="Tiktok"
					placeholder="Tiktok" 
					value={userDetails.tiktok ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "tiktok")}
				/>
				<Input 
					type="text" 
					addonBefore="Youtube"
					placeholder="Youtube" 
					value={userDetails.youtube ?? ""} 
					onChange={(e) => onUserDetailsChanged(e.target.value, "youtube")}
				/>
			</div>

			<ConfigProvider
				theme={{
					components: {
						Tabs: {
							inkBarColor: 'rgb(99,102,241)',
							itemSelectedColor: 'rgb(255,255,255)',
							itemColor: 'rgb(100,116,139)',
						},
						Table: {
							fontSize: 12,
							headerBg: 'rgb(51,65,85)',
							headerColor: 'white',
							headerSortActiveBg: 'rgb(30,41,59)',
							headerSortHoverBg: 'rgb(30,41,59)',
							colorBgContainer: 'rgb(71,85,105)',
							headerSplitColor: 'rgb(100,116,139)',
							borderColor: 'rgb(100,116,139)',
						},
						Empty: {
							colorText: 'white',
							colorTextDisabled: 'white',
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
						text-white bg-green-500
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
						w-full
						flex flex-col items-center justify-start
						shadow
						rounded-md
					`}>
						<Table
							className='w-[40vw]'
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
							text-white bg-green-500
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

					<div className="w-[40vw] mb-2">
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
						w-full
						flex flex-col items-center justify-start
						shadow
						rounded-md
					`}>
						<Table
							className='w-[40vw]'
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
							contentBg: 'rgb(30,41,59)',
							headerBg: 'rgb(30,41,59)',
							titleColor: 'white',
							colorIcon: 'white',
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
								bg-green-500 text-white rounded
								px-3 py-2
							`}
						>
							Submit
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
								bg-green-500 text-white rounded
								px-3 py-2
							`}
						>
							Submit
						</button>,
					]}
				>
					<select
						className={`
							w-full border-[1px] rounded
							px-3 py-1 mb-1 mt-3
							bg-slate-700 text-white border-slate-600
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
							bg-slate-700 text-white border-slate-600
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
						value={reservationPrice.toString()}
						onChange={({ target: {value}}) => { setReservationPrice(Number(value))}}
						placeholder='0'
					/>
				</Modal>
			</ConfigProvider>
		</div>
	);
};

export default Page;
