'use client';
import { ConfigProvider, Empty, Modal } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import moment, { Moment } from 'moment';
import { UserReservation } from '../../../types';
import { RESERVATION_STATUS_BLOCKED, RESERVATION_STATUS_AVAILABLE, RESERVATION_STATUS_PAID, RESERVATION_STATUS_PENDING, RESERVATION_STATUS_CLAIMED } from '../../common/constants';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useSollinked } from '@sollinked/sdk';
import { Input } from '@/components/Input';
import { toLocaleDecimal } from '@/common/utils';
import { useTheme } from '@/hooks/useTheme';
import CustomCalendar from '@/components/CustomCalendar';

const Page = () => {
    const { user, calendar } = useSollinked();
    const [date, setDate] = useState(() => moment());
    const [dateStr, setDateStr] = useState(() => moment().format('YYYY-MM-DD'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState(RESERVATION_STATUS_BLOCKED);
    const [reservationPrice, setReservationPrice] = useState("");
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
                reservation_price: Number(reservationPrice),
            });

            toast.success('Updated');
            setReservationPrice("");
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

	const upcomingReservations = useMemo(() => {
		let now = moment();
        return user.reservations?.filter(
			x => 
				x.status === (RESERVATION_STATUS_PAID || x.status === RESERVATION_STATUS_CLAIMED) && 
				moment(x.date).add(30, 'm').isAfter(now) // add 30 minute leeway
			) ?? [];
	}, [ user ]);

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
					minDate={moment().add(-1, 'd')}
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
							grid 2xl:grid-cols-6 grid-cols-4
							mt-5 gap-2
						`}
					>
					{
						data.map((d, index) => {
							let disabled = moment(d.date).isBefore(moment());
							let bg = "dark:bg-slate-500 bg-slate-200";
							if(!disabled) {
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
									case RESERVATION_STATUS_CLAIMED:
										bg = "dark:bg-green-500 bg-green-200";
										break;
								}
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
											disabled:cursor-not-allowed
										`}
										onClick={() => {
											setIsModalOpen(true);
											setCurrentStatus(d.status);
											setSelectedStatus(d.status === RESERVATION_STATUS_AVAILABLE || d.status === RESERVATION_STATUS_BLOCKED? d.status : RESERVATION_STATUS_BLOCKED)
											setReservationPrice(d.reservation_price?.toString() ?? "");
											setSelectedHour(moment(d.date).hour());
										}}
										disabled={disabled}
									>
										{moment(d.date).format('HH:00')}
									</button>
								</div>
							)
						})
					}
					</div>

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
                            onChange={({target: {value}}) => setReservationPrice(value)}
                        />
                    </Modal>
                </div>
            </div>
            <h2 className='mt-10'>Upcoming Reservations</h2>
			{
				unclaimedData.length === 0?
				<div className={`
					flex items-center justify-center
					dark:bg-slate-700 rounded mt-5 mb-5
					h-[30vh]
					shadow
				`}>
					<Empty/>
				</div> :
				<div
					className={`
						grid 2xl:grid-cols-3 md:grid-cols-2 grid-cols-1 xl:gap-2 gap-1
						dark:bg-transparent bg-transparent rounded mt-3 mb-5
						min-h-[30vh]
						shadow
					`}
				>
					{
						upcomingReservations.map((d, index) => (
							<div 
								key={`unclaimed-data-${index}`}
								className={`
									flex flex-col items-start justify-start p-3
									xl:text-base text-xs shadow dark:bg-slate-700
									rounded
								`}
							>
								<strong>{moment(d.date).format('ddd, YYYY-MM-DD h:mmA')}</strong>
								<span className='mt-1'>{d.reserve_email}</span>
								<span className='mt-5'>{d.reserve_title}</span>
							</div>
						))
					}
				</div>
			}
            <h2 className='mt-10'>Unclaimed Tiplinks</h2>
			{
				unclaimedData.length === 0?
				<div className={`
					flex items-center justify-center
					dark:bg-slate-700 bg-slate-500 rounded mt-5 mb-5
					h-[30vh]
					shadow
				`}>
					<Empty/>
				</div> :
				<div
					className={`
						grid xl:grid-cols-5 md:grid-cols-4 grid-cols-3 xl:gap-2 gap-1
						dark:bg-slate-700 bg-slate-500 rounded p-3 mt-3 mb-5
						min-h-[30vh]
						shadow
					`}
				>
					{
						unclaimedData.map((d, index) => (
							<div 
								key={`unclaimed-data-${index}`}
								className={`
									flex flex-row items-center justify-center
									xl:text-base text-xs shadow dark:bg-green-500 bg-green-200
									h-[30px] rounded
								`}
							>
								<Link href={d.tiplink_url!} target='_blank'>
									{d.value_usd?  toLocaleDecimal(d.value_usd ?? 0, 2, 2) : toLocaleDecimal(d.reservation_price ?? 0, 2, 2)} USDC
								</Link>
							</div>
						))
					}
				</div>
			}
        </div>
    );
}

export default Page;