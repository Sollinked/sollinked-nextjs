'use client';
import { ConfigProvider, Empty, InputNumber, Modal, Select } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import moment, { Moment } from 'moment';
import { UserReservation } from '../../../types';
import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import { RESERVATION_STATUS_BLOCKED, RESERVATION_STATUS_AVAILABLE, RESERVATION_STATUS_PAID, RESERVATION_STATUS_PENDING, RESERVATION_STATUS_CLAIMED } from '../../common/constants';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useSollinked } from '@sollinked/sdk';
import { Input } from '@/components/Input';
import { toLocaleDecimal } from '@/common/utils';
import { useTheme } from '@/hooks/useTheme';

type CalendarParams = {
	onDateChange: (date: Moment) => void;
	// reservations?: UserReservation[];
}

const CustomCalendar = ({
	onDateChange,
	// reservations
}: CalendarParams) => {
	const [currentDate, setCurrentDate] = useState(moment());
	const {offset, daysInMonth} = useMemo(() => {
		return {
			offset: moment(currentDate).startOf('M').day(),
			daysInMonth: moment(currentDate).startOf('M').daysInMonth(),
		}
	}, [currentDate]);

	const onLeftClick = useCallback(() => {
		let newMoment = moment(currentDate).add(-1, 'M');
		setCurrentDate(newMoment);
	}, [ currentDate ]);

	const onRightClick = useCallback(() => {
		let newMoment = moment(currentDate).add(1, 'M');
		setCurrentDate(newMoment);
	}, [currentDate]);

	const onDateClick = useCallback((i: number) => {
		let date = moment(currentDate).startOf('M').add(i, 'd');
		onDateChange(date);
		setCurrentDate(date);
	}, [onDateChange, currentDate]);

	const rows = useMemo(() => {
		let rows: JSX.Element[] = [];
		let tds: JSX.Element[] = [];

		// empty dates at the beginning
		for(let i = 0; i < offset; i++) {
			tds.push(<td key={`custom-calendar-${i}`} className='w-[14.28%]'></td>);
		}

		// dates
		for(let i = 0; i < daysInMonth; i++) {
			if(tds.length === 7) {
				rows.push(
					<tr 
						key={`customer-calendar-tr-${rows.length}`}
						className={`
							md:h-[50px] h-[5vh]
						`}
					>
						{tds}
					</tr>
				);
				tds = [];
			}

			tds.push(<td key={`custom-calendar-${i + offset}`} className='w-[14.28%]'>
						<button
							onClick={() => onDateClick(i)}
							className={`
								md:w-[50px] md:h-[50px] h-[5vh] w-[5vh] rounded-full 
								outline-none ${currentDate.date() === i + 1? 'dark:bg-indigo-500 bg-indigo-200' : "dark:bg-slate-600 bg-white"}
								active:outline-none
								focus:shadow-transparent focus:outline-none
							`}
						>
							{i + 1}
						</button>
					</td>);
		}

		// last row
		if(tds.length > 0) {
			rows.push(<tr 
							key={`customer-calendar-tr-${rows.length}`}
							className={`
								md:h-[50px] h-[5vh]
							`}
					>
						{tds}
					</tr>);
			tds = [];
		}
		return rows;
	}, [offset, daysInMonth, currentDate]);

	return (
		<div
			className={`
				flex flex-col justify-center
				md:min-w-[500px] w-full text-center
			`}
		>
			<div 
				className={`
					flex flex-row items-center justify-center
				`}
			>
				<button
					onClick={onLeftClick}
					className={`
						mr-3
					`}
				>
					<LeftCircleFilled />
				</button>
				<strong>
					{currentDate.format('YYYY-MM-DD')}
				</strong>
				<button
					onClick={onRightClick}
					className={`
						ml-3
					`}
				>
					<RightCircleFilled />
				</button>
			</div>
			<table
				className={`
					mt-5 mb-5
					text-sm w-full
					border-spacing-y-1 xl:border-spacing-y-3
					border-separate
				`}
			>
				<thead>
					<tr>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							SUN
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							MON
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							TUE
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							WED
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							THU
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							FRI
						</th>
						<th
							className={`
								font-normal md:text-md text-xs
							`}
						>
							SAT
						</th>
					</tr>
				</thead>
				<tbody>
					{rows}
				</tbody>
			</table>
		</div>
	);
}

const Page = () => {
    const { user, calendar } = useSollinked();
    const [date, setDate] = useState(() => moment());
    const [dateStr, setDateStr] = useState(() => moment().format('YYYY-MM-DD'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState(RESERVATION_STATUS_BLOCKED);
    const [reservationPrice, setReservationPrice] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(RESERVATION_STATUS_BLOCKED);
	const { theme } = useTheme();

    const onSelect = (newValue: Moment) => {
        setDate(newValue);
        setDateStr(newValue.format('ddd, YYYY-MM-DD'));
    };

    const handleOk = useCallback(async() => {
        if(!calendar) {
            return;
        }

        try {
            setIsSaving(true);
            await calendar.setCustomPrice({
                status: selectedStatus === RESERVATION_STATUS_BLOCKED? "blocked" : "available",
                date: moment(`${dateStr} ${selectedHour.toString().padStart(2, '0')}:00:00`),
                reservation_price: reservationPrice,
            });

            toast.success('Updated');
            setReservationPrice(0);
            setSelectedStatus(RESERVATION_STATUS_BLOCKED);
        }

        catch(e) {
            toast.error("Unable to update reservation");
            setIsSaving(false);
            return;
        }

        setIsModalOpen(false);
        setIsSaving(false);
        return;
    }, [ selectedHour, selectedStatus, dateStr, reservationPrice, calendar ]);
  
    const handleCancel = () => {
      setIsModalOpen(false);
    };

    const data = useMemo(() => {
        let ret: UserReservation[] = [];
        let hours: number[] = [];
		let dateStr = moment(date).format('YYYY-MM-DD');
        user.reservations?.forEach(x => {
            let date = moment(x.date);
            if(date.format('YYYY-MM-DD') !== dateStr) {
                return;
            }

            hours.push(date.hour());
            ret.push(x);
        });

        let day = moment(dateStr).day();
        let reservationSettingObj: { [hour: number]: number } = {};
        user.reservationSettings?.forEach(x => {
            if(x.day !== day) {
                return;
            }

            reservationSettingObj[x.hour] = x.reservation_price;
        });
        // fill up the rest
        for(let i = 0; i < 24; i++) {
            if(hours.includes(i)) {
                continue;
            }

            let reservation_price = reservationSettingObj[i] ?? 0;
            let isBlocked = !reservationSettingObj[i];

            ret.push({
                date: dateStr + ` ${i.toString().padStart(2, '0')}:00:00`,
                user_id: user.id,
                reservation_price,
                reserve_email: "",
                reserved_at: "",
                reserve_title: "",
                tiplink_public_key: "",
                value_usd: reservation_price,
                status: isBlocked? RESERVATION_STATUS_BLOCKED : RESERVATION_STATUS_AVAILABLE,
            });
        }

		ret = ret.sort((a,b) => moment(a.date).isAfter(moment(b.date))? 1 : -1);
        return ret;
    }, [ user, date ]);

    const unclaimedData = useMemo(() => {
        return user.reservations?.filter(x => x.status === RESERVATION_STATUS_PAID) ?? [];
    }, [ user ]);

    return (
        <div className={`
			flex flex-col w-full
		`}>
            <div className={`
				flex xl:flex-row flex-col w-full items-start
				xl:p-5 p-3
				dark:bg-slate-700 rounded
				shadow
			`}>
				<CustomCalendar
					onDateChange={onSelect}
				/>
                <div className={`
					flex flex-col
					w-full xl:ml-5
				`}>
					<div
						className={`
							h-[20px] w-full
						`}
					>
						<span>{dateStr}</span>
					</div>
					<div
						className={`
							grid grid-cols-4
							mt-5 gap-2
						`}
					>
					{
						data.map((d, index) => {
							let bg = "dark:bg-slate-500";
							switch(d.status) {
								case RESERVATION_STATUS_PENDING:
									bg = "dark:bg-yellow-500 bg-yellow-200";
									break;
								case RESERVATION_STATUS_BLOCKED:
									bg = "dark:bg-red-500 bg-red-200";
									break;
								case RESERVATION_STATUS_PAID:
									bg = "dark:bg-green-500 bg-green-200";
									break;
							}
							return (
								<div
									key={`reservation-${index}`}
									className={`
										rounded md:w-[100px] w-full xl:h-[45px] h-[30px] text-xs
										${bg}
									`}
								>
									<button
										className={`
											w-full h-full
											focus:shadow-none
										`}
										onClick={() => {
											setIsModalOpen(true);
											setCurrentStatus(d.status);
											setSelectedStatus(d.status === RESERVATION_STATUS_AVAILABLE || d.status === RESERVATION_STATUS_BLOCKED? d.status : RESERVATION_STATUS_BLOCKED)
											setReservationPrice(d.reservation_price ?? 0);
											setSelectedHour(moment(d.date).hour());
										}}
									>
										{moment(d.date).format('HH:00')}
									</button>
								</div>
							)
						})
					}
					</div>

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
                        title={`${dateStr} ${selectedHour.toString().padStart(2, '0')}:00`}
                        open={isModalOpen} 
                        onOk={handleOk} 
                        onCancel={handleCancel}
                        footer={[
                            <button 
								key="submit" 
								onClick={handleOk}
								className={`
									px-3 py-2 rounded w-[100px]
									bg-green-500 dark:text-white text-black
									disabled:cursor-not-allowed disabled:bg-green-900 disabled:text-zinc-500
								`}
								disabled={currentStatus !== RESERVATION_STATUS_AVAILABLE && currentStatus !== RESERVATION_STATUS_BLOCKED}
							>
                              {isSaving? 'Saving..' : 'Save'}
                            </button>,
                          ]}
                    >
                        <div className="flex flex-row relative">
                            <span className='
							 	py-1 px-2 text-xs
								dark:text-white text-black
								absolute left-2 top-3.5 rounded'
							>
								Status
							</span>

							<select
								className={`
									w-full border-[1px] rounded
									px-3 py-1 mb-1 mt-3
									dark:bg-slate-700 dark:text-white text-black border-slate-600
									outline-none text-center
								`}
                                onChange={({target: {value}}) => setSelectedStatus(Number(value))}
								value={selectedStatus.toString()}
							>
								<option value={RESERVATION_STATUS_BLOCKED}>Blocked</option>
								<option value={RESERVATION_STATUS_AVAILABLE}>Avaliable</option>
							</select>
                        </div>
                        <Input
							type="number"
                            addonBefore={"Price"}
							placeholder='0'
                            value={reservationPrice.toString()}
                            onChange={(value) => setReservationPrice(Number(value) ?? 0)}
                        />
                    </Modal>
				</ConfigProvider>
                </div>
            </div>
            <h2 className='mt-10'>Unclaimed Tiplinks</h2>
			{
				unclaimedData.length === 0?
				<ConfigProvider
					theme={{
						components: {
							Empty: {
								colorText: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
								colorTextDisabled: theme === "light"? "rgba(0, 0, 0, 0.25)" : 'white',
							}
						}
					}}
				>
					<div className={`
						flex items-center justify-center
						dark:bg-slate-700 rounded mt-5 mb-5
						h-[30vh]
						shadow
					`}>
						<Empty/>
					</div>
				</ConfigProvider> :
				<div
					className={`
						grid xl:grid-cols-5 grid-cols-4 xl:gap-2 gap-1
						dark:bg-slate-700 rounded p-3 mt-3 mb-5
						min-h-[30vh]
						shadow
					`}
				>
					{
						unclaimedData.map((d, index) => (
							<div 
								key={`unclaimed-data-${index}`}
								className={`
									flex flex-row items-start
									xl:text-md text-xs
								`}
							>
								<div className={`
									flex flex-col items-center
									dark:bg-slate-500 px-3 py-2 rounded
									w-100
								`}>
									<Link href={d.tiplink_url!} target='_blank'>
										Claim {d.value_usd?  toLocaleDecimal(d.value_usd ?? 0, 2, 2) : toLocaleDecimal(d.reservation_price ?? 0, 2, 2)} USDC
									</Link>
								</div>
							</div>
						))
					}
				</div>
			}
        </div>
    );
}

export default Page;