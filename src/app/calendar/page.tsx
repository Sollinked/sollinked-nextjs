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
							h-[50px]
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
								w-[50px] h-[50px] rounded-full 
								outline-none ${currentDate.date() === i + 1? 'bg-indigo-500' : "bg-slate-600"}
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
								h-[50px]
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
				min-w-[500px] text-center
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
								font-normal
							`}
						>
							SUN
						</th>
						<th
							className={`
								font-normal
							`}
						>
							MON
						</th>
						<th
							className={`
								font-normal
							`}
						>
							TUE
						</th>
						<th
							className={`
								font-normal
							`}
						>
							WED
						</th>
						<th
							className={`
								font-normal
							`}
						>
							THU
						</th>
						<th
							className={`
								font-normal
							`}
						>
							FRI
						</th>
						<th
							className={`
								font-normal
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
				bg-slate-700 rounded
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
							let bg = "bg-slate-500";
							switch(d.status) {
								case RESERVATION_STATUS_PENDING:
									bg = "bg-yellow-500";
									break;
								case RESERVATION_STATUS_BLOCKED:
									bg = "bg-red-500";
									break;
								case RESERVATION_STATUS_PAID:
									bg = "bg-green-500";
									break;
							}
							return (
								<div
									key={`reservation-${index}`}
									className={`
										rounded w-[100px] xl:h-[45px] h-[30px] text-xs
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
								contentBg: 'rgb(30,41,59)',
								headerBg: 'rgb(30,41,59)',
								titleColor: 'white',
								colorIcon: 'white',
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
									bg-green-500 text-white
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
								text-white
								absolute left-2 top-3.5 rounded'
							>
								Status
							</span>

							<select
								className={`
									w-full border-[1px] rounded
									px-3 py-1 mb-1 mt-3
									bg-slate-700 text-white border-slate-600
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
								colorText: 'white',
								colorTextDisabled: 'white',
							}
						}
					}}
				>
					<div className={`
						flex items-center justify-center
						bg-slate-700 rounded mt-5 mb-5
						h-[30vh]
					`}>
						<Empty/>
					</div>
				</ConfigProvider> :
				<div
					className={`
						grid xl:grid-cols-5 grid-cols-4 xl:gap-2 gap-1
						bg-slate-700 rounded p-3 mt-3 mb-5
						min-h-[30vh]
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
									bg-slate-500 px-3 py-2 rounded
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