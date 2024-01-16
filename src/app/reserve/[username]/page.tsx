'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { UserReservation, UserReservationSetting } from '../../../../types';
import { ToastContainer, toast } from 'react-toastify';
import { copyToClipboard, getWsUrl, sendTokensTo, swapAndSendTo, toLocaleDecimal } from '../../../common/utils';
import { ConfigProvider, Progress, Select } from 'antd';
import moment, { Moment } from 'moment';
import { Socket, io } from 'socket.io-client';
import { RESERVATION_STATUS_AVAILABLE, RESERVATION_STATUS_CANCELLED, RESERVATION_STATUS_PAID, RESERVATION_STATUS_PENDING, USDC_DECIMALS, USDC_TOKEN_ADDRESS, supportedTokens } from '../../../common/constants';
import { useSollinked } from '@sollinked/sdk';
import CustomCalendar from '@/components/CustomCalendar';
import { useTheme } from '@/hooks/useTheme';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import axios from 'axios';
import { PublicKey } from '@solana/web3.js';

const EXPIRE_IN_SECONDS = 900; // 900s
const Page = ({params: { username }}: { params: { username: string }}) => {
    const socketRef = useRef<Socket>();
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [isError, setIsError] = useState(false);
    const [reservationSettings, setReservationSettings] = useState<UserReservationSetting[]>([]);
    const [reservations, setReservations] = useState<UserReservation[]>([]);
    const [displayName, setDisplayName] = useState("");
    const [calendarAdvanceDays, setCalendarAdvanceDays] = useState(0);
    const [date, setDate] = useState<Moment>(moment());
    const [selectedDate, setSelectedDate] = useState("");
    const dateStr = useMemo(() => {
        return date.format('ddd, YYYY-MM-DD');
    }, [date]);
    const [email, setEmail] = useState("");
    const [title, setTitle] = useState("");
    const [payWith, setPayWith] = useState("USDC");
    const [rate, setRate] = useState(1);
    const [isGettingRate, setIsGettingRate] = useState(false);
    const [isRateError, setIsRateError] = useState(false);
    const { theme } = useTheme();
    const wallet = useWallet();

    // after booking - maybe need separate page
    const [publicKey, setPublicKey] = useState("");
    const [valueUsd, setValueUsd] = useState(0);
    const [uuid, setUuid] = useState("");
    const [reservationStatus, setReservationStatus] = useState(RESERVATION_STATUS_AVAILABLE);
    const [timeLeft, setTimeLeft] = useState(900);
    const expireDate = useRef(moment().add(100, 'd'));

    const [isSaving, setIsSaving] = useState(false);
    const { calendar } = useSollinked();
    const isGettingData = useRef(false);

    const getData = useCallback(async() => {
        if(!calendar) {
            return;
        }

        if(isGettingData.current) {
            return;
        }

        try {
            isGettingData.current = true;
            let res = await calendar.get(username);

            if(!res) {
                toast.error('Unable to get details');
                return;
            }

            if(typeof res === "string") {
                toast.error(res);
                return;
            }

            let {
                settings,
                reservations,
                display_name,
                calendar_advance_days
            } = res;
            setReservationSettings(settings);
            setReservations(reservations ?? []);
            setDisplayName(display_name);
            setCalendarAdvanceDays(calendar_advance_days);
        }

        catch {
            toast.error('Unable to get user details');
            setIsError(true);
        }

        setIsLoading(false);
        isGettingData.current = false;
    }, [calendar, username]);

    useEffect(() => {
        if(!username) {
            return;
        }

        getData();
    }, [ username, calendar, getData ]);


    // for booking payment notifications
    useEffect(() => {
        // Create the socket connection if it doesn't exist
        if (!socketRef.current || !socketRef.current.connected) {
            // console.log('attempting connection')
            socketRef.current = io(getWsUrl());

            // upon connection
            socketRef.current.on("connect", () => {
                // console.log('connected')
                if(uuid) {
                    socketRef.current!.on(uuid, ({status}: { status: number}) => {
                        // console.log(`received ${uuid}, status: ${status}`);
                        setReservationStatus(status);
                        setIsPaying(false);

                        if(status !== RESERVATION_STATUS_PAID) {
                            toast.error("There was a problem while processing the payment.")
                        }
                    });
                }
            });

            // upon disconnection
            socketRef.current.on("disconnect", (reason: any) => {
                // console.log(`disconnected due to ${reason}`);
            });
        }

        return () => {
            // cannot off after useRef, else wont get data
            // socketRef.current!.off(`connect`);
            // socketRef.current!.off(`disconnect`);
            // socketRef.current!.off(uuid);
            socketRef.current?.disconnect();
        }

    }, [ uuid ]);

    // timer function
    const startCountdown = useCallback(() => {
        setTimeout(() => {
            let now = moment();
            if(expireDate.current.isBefore(now)) {
                return;
            }

            setTimeLeft(expireDate.current.diff(now, 's'));
            startCountdown();
        }, 50);
    }, []);

    const minDate = useMemo(() => {
        return moment().startOf('d');
    }, []);

    const maxDate = useMemo(() => {
        return moment().add(calendarAdvanceDays - 1, 'd').startOf('d');
    }, [calendarAdvanceDays]);

    const timeslots = useMemo(() => {
        let availableSlots: { value: string, time: string, value_usd: number }[] = [];
        let hours: number[] = [];

        // presets are converted to local time at this point
        let presets = reservationSettings.filter(x => date.day() === x.day);
        let selectedStartOfDate = moment(date).startOf('d');
        let today = moment();
        let startOfToday = moment().startOf('d');
        let currentHour = today.hour();

        // get custom hours
        reservations.forEach(x => {
            let currentStartOfDate = moment(x.date).startOf('d');
            let currentDate = moment(x.date);
            let hour = currentDate.hour();

            // not selected date
            if(!currentStartOfDate.isSame(selectedStartOfDate)) {
                return;
            }

            hours.push(hour);

            // not available
            if(x.status !== RESERVATION_STATUS_AVAILABLE) {
                return;
            }

            // prevent booking past hour
            if(today.isAfter(currentDate)) {
                return;
            }

            let presetPrice = presets.filter(x => x.hour === hour)[0]?.reservation_price ?? 0;
            availableSlots.push({
                // use moment for all db operations for consistency
                value: moment(`${x.date}`).format('YYYY-MM-DDTHH:mm:ssZ'),
                time: currentDate.format('HH:00'),
                value_usd: x.reservation_price ?? presetPrice
            });
        });

        presets.forEach(x => {
            if(hours.includes(x.hour)) {
                return;
            }

            // prevent booking past hours
            if(currentHour > x.hour && startOfToday.isSame(selectedStartOfDate)) {
                return;
            }

            availableSlots.push({
                // use moment for all db operations for consistency
                value: moment(`${date.format('YYYY-MM-DD')} ${x.hour.toString().padStart(2, '0')}:00:00`).format('YYYY-MM-DDTHH:mm:ssZ'),
                time: moment(`${date.format('YYYY-MM-DD')} ${x.hour.toString().padStart(2, '0')}:00:00`).format('HH:00'),
                value_usd: x.reservation_price,
            });
        });

        availableSlots.sort((a,b) => a.time > b.time? 1 : -1);

        return availableSlots;
    }, [reservationSettings, reservations, date]);

    const disabledDates = useMemo(() => {
        let availableDateStr: string[] = [];
        let currentDate = moment(minDate).startOf('d');
        let disabledDates: Moment[] = [];
        let now = moment();

        reservations.forEach(r => {
            let date = moment(r.date);
            if(date.isBefore(minDate)) {
                return;
            }

            // not available
            if(r.status !== RESERVATION_STATUS_AVAILABLE) {
                return;
            }

            if(date.isBefore(now)) {
                return;
            }
            
            // has reservation on that date
            availableDateStr.push(date.format('YYYY-MM-DD'));
        });

        for(let i = 0; i < calendarAdvanceDays; i++) {
            let currentDateStr = currentDate.format('YYYY-MM-DD');
            if(availableDateStr.includes(currentDateStr)) {
                currentDate.add(1, 'd');
                continue;
            }

            if(reservationSettings.filter(x => x.day === currentDate.day()).length === 0) {
                currentDate.add(1, 'd');
                continue;
            }

            // has preset reservation
            availableDateStr.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'd');
        }

        // has to optimize this later
        currentDate = moment(minDate).startOf('d');
        for(let i = 0; i < calendarAdvanceDays; i++) {
            let currentDateStr = currentDate.format('YYYY-MM-DD');
            if(availableDateStr.includes(currentDateStr)) {
                currentDate.add(1, 'd');
                continue;
            }

            disabledDates.push(moment(currentDate));
            currentDate.add(1, 'd');
        }
        
        return disabledDates;
    }, [reservationSettings, reservations, minDate, calendarAdvanceDays]);

    // calendar functions
    const onSelect = useCallback((value: Moment) => {
        if(value.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
            // prevent booking past hour
            setDate(moment());
            return;
        }
        setDate(value.startOf('d'));
        setSelectedDate("");
    }, []);

    // inputs
    const onScheduleButtonClick = useCallback(async() => {
        if(!calendar) {
            return;
        }

        setIsSaving(true);
        try {
            if(!email) {
                toast.error("Please input your email");
                setIsSaving(false);
                return;
            }

            if(!title) {
                toast.error("Please input the title");
                setIsSaving(false);
                return;
            }

            if(!selectedDate) {
                toast.error("Please select timeslot");
                setIsSaving(false);
                return;
            }
            let res = await calendar.reserve({username,
                date: selectedDate,
                email,
                title,
            });

            if(typeof res === "string") {
                toast.error(res);
                setIsSaving(false);
                return;
            }

            setPublicKey(res.public_key);
            setValueUsd(res.value_usd);
            setUuid(res.uuid);
            setReservationStatus(res.value_usd > 0? RESERVATION_STATUS_PENDING : RESERVATION_STATUS_PAID);
            expireDate.current = moment().add(EXPIRE_IN_SECONDS, 's');
            startCountdown();
            setEmail("");
            setTitle("");
        }

        catch(e) {
            toast.error('Unable to schedule the meeting');
            setIsSaving(false);
            return;
        }

        setIsSaving(false);
    }, [username, calendar, selectedDate, email, title, startCountdown]);

    const onEmailChange = useCallback((value: string) => {
        setEmail(value);
    }, []);

    const onTitleChange = useCallback((value: string) => {
        setTitle(value);
    }, []);

    const getRate = useCallback(async() => {
        setIsGettingRate(true);
        setIsRateError(false);
        let { address, decimals } = supportedTokens[payWith];
        try {
            let res = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${USDC_DECIMALS}&swapMode=ExactOut&slippageBps=50`);

            setRate(Math.round(Number(res.data.inAmount) * 1000 / decimals) / 1000);
        }

        catch {
            toast.error('Unable to get rate');
            setIsGettingRate(false);
            setIsRateError(true);
            return;
        }

        setIsGettingRate(false);
    }, [payWith]);

    useEffect(() => {
        if(payWith === 'USDC') {
            setRate(1);
            return;
        }

        getRate();
        let interval = setInterval(() => {
            getRate();
        }, 30000); // refresh every 30s

        return () => clearInterval(interval);
    }, [ payWith, getRate ]);
  
    const onPayClick = useCallback(async() => {

        if(!wallet || !wallet.publicKey) {
            toast.error('Please connect your wallet!');
            return;
        }

        setIsPaying(true);
        const { address } = supportedTokens[payWith];
        let responseData = {};
        if(payWith !== "USDC") {
            try {
                let res = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${Math.round(valueUsd * USDC_DECIMALS)}&swapMode=ExactOut&slippageBps=50`);
                responseData = res.data;
            }
    
            catch {
                toast.error('Unable to get rate');
                setIsPaying(false);
                return;
            }
        }

        try {
            
            if(payWith === "USDC") {
                await sendTokensTo(wallet, publicKey, USDC_TOKEN_ADDRESS, USDC_DECIMALS, valueUsd);
            }

            else {
                await swapAndSendTo(wallet, new PublicKey(USDC_TOKEN_ADDRESS), new PublicKey(publicKey), responseData);
            }

        } catch (error: any) {
            if(error.name === "WalletNotConnectedError") {
                toast.error('Please connect your wallet!');
                setIsPaying(false);
                return;
            }

            if(error.message.includes("Not enough")) {
                toast.error('Insufficient Balance');
                setIsPaying(false);
                return;
            }

            toast.error('Unable to make payment');
            setIsPaying(false);
        }
  
    }, [ publicKey, valueUsd, wallet, payWith ]);  

    if(isError) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <CloseCircleOutlined
                    style={{
                        fontSize: 80,
                        color: '#f5222d'
                    }}
                    className='mb-3'
                />
                <strong style={{color: "#f5222d", fontSize: 30}}>Error</strong>
            </div>
        );
    }

    if(isLoading) {
        return (<div className='h-[80vh] w--full flex flex-col justify-center items-center'>
            <LoadingOutlined style={{ fontSize: 80 }}/>
        </div>)
    }


    if(
        reservationStatus === RESERVATION_STATUS_CANCELLED
        || (reservationStatus === RESERVATION_STATUS_PENDING && timeLeft <= 0)    
    ) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <Progress type="circle" percent={100} size={180} status='exception'/>
                <strong className={`
                    text-red-600 dark:text-red-300
                `}>
                    Payment Expired
                </strong>
            </div>
        );
    }

    if(reservationStatus === RESERVATION_STATUS_PENDING) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <ConfigProvider
                    theme={{
                        components: {
                            Progress: {
                                circleTextColor: theme === "light"? "black" : "white",
                            }
                        }
                    }}
                >
                    <Progress 
                        type="circle" 
                        percent={(timeLeft / EXPIRE_IN_SECONDS) * 100} 
                        format={() => {
                            return `${timeLeft.toFixed(0)}s`
                        }}
                        size={180} 
                    />
                </ConfigProvider>
                <span className={`
                    mt-5 text-center w-full text-xs
                `}>
                    Please deposit <strong>{toLocaleDecimal(valueUsd ?? 0, 2, 2)} USDC</strong> to <strong>{publicKey}</strong> within <strong>15 minutes</strong> to confirm the booking.
                </span>

                <button 
                    className={`
                        mt-5 dark:bg-blue-700 bg-blue-200 px-3 py-2 rounded
                        text-sm w-[250px]
                    `}  
                    onClick={() => { 
                        copyToClipboard(publicKey);
                        toast.success('Copied');
                    }}
                >
                    Copy Address
                </button>

                <button 
                    className={`
                        mt-5 dark:bg-blue-700 bg-blue-200 px-3 py-2 rounded
                        text-sm w-[250px]
                        disabled:cursor-not-allowed
                    `}  
                    onClick={onPayClick}
                    disabled={isPaying}
                >
                    { !wallet? "Connect Wallet To Pay" : "Pay Now" }
                </button>
            </div>
        );
    }

    if(reservationStatus === RESERVATION_STATUS_PAID) {
        return (
            <div className='h-[80vh] w--full flex flex-col justify-center items-center'>
                <Progress type="circle" percent={100} size={180} />
                <strong className='mt-5'>
                    Booking Confirmed!
                </strong>

                <button
                    className={`
                        dark:bg-indigo-500 bg-indigo-200 px-3 py-2 rounded mt-5
                    `}
                    onClick={() => {
                        setReservationStatus(RESERVATION_STATUS_AVAILABLE);
                        setIsLoading(true);
                        getData();
                    }}
                >
                    Schedule Another Meeting
                </button>

                <Link
                    className={`
                        px-3 py-2 rounded mt-5 text-sm
                    `}
                    href="/"
                >
                    Return Home
                </Link>
            </div>
        );
        
    }

    return (
        <div className={`
            flex flex-col
        `}>
            {
                displayName &&
                <strong>Schedule a meeting with {displayName}</strong>
            }
            <div className={`
				flex xl:flex-row flex-col w-full items-start
				xl:p-5 p-3
				dark:bg-slate-700 rounded
				shadow
			`}>
				<CustomCalendar
                    minDate={minDate}
                    maxDate={maxDate}
                    disabledDates={disabledDates}
					onDateChange={onSelect}
                    selectedDate={date}
                    blueScheme
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
							grid md:grid-cols-4 grid-cols-3
							mt-5 mb-5 gap-2
						`}
					>
					{
						timeslots.map((d, index) => {
							let bg = d.value === selectedDate? 'dark:bg-indigo-500 dark:border-none bg-green-300 shadow border-[1px] border-slate-200' : "dark:bg-slate-500 dark:border-none shadow border-[1px] border-slate-200";
							return (
								<div
									key={`reservation-${index}`}
									className={`
										rounded md:w-[100px] w-full xl:h-[60px] h-[45px] text-xs
										${bg}
									`}
								>
									<button
										className={`
											w-full h-full flex flex-col items-center justify-center
											focus:shadow-none
										`}
                                        onClick={() => { setSelectedDate(d.value)}}
									>
                                        <span className='md:text-base text-xs'>{d.time}</span>
                                        <span className='text-xs'>{toLocaleDecimal(d.value_usd * rate, 2, 2)} {payWith}</span>
									</button>
								</div>
							)
						})
					}
					</div>
                    {
                        (date.isSame(minDate) || date.isAfter(minDate)) &&
                        (date.isSame(maxDate) || date.isBefore(maxDate)) &&
                        (
                            <>
                            <div className='flex flex-col justify-end items-center mt-10 h-full space-y-2'>
                                <input
                                    type="text"
                                    className={`
                                        w-full px-3 py-2 rounded
                                        dark:text-white dark:bg-slate-500 bg-white
                                        dark:border-none border-[1px] border-slate-300
                                        outline-none
                                    `}
                                    placeholder='your@email.com'
                                    onChange={(e) => onEmailChange(e.target.value)}
                                    value={email}
                                />
                                <input
                                    type="text"
                                    className={`
                                        w-full px-3 py-2 rounded
                                        dark:text-white dark:bg-slate-500 bg-white
                                        dark:border-none border-[1px] border-slate-300
                                        outline-none
                                    `}
                                    placeholder='Meeting Agenda'
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    value={title}
                                />
                            </div>
                            <Select 
                                className="w-full mt-3"
                                value={payWith}
                                onChange={(value) => setPayWith(value)}
                            >
                                {
                                    Object.keys(supportedTokens).map(x => {
                                        return (
                                            <Select.Option value={x} key={`pay-with-${x}`}>Pay with {x}</Select.Option>
                                        )
                                    })
                                }
                            </Select>
                            <button
                                className={`
                                    mt-8 border-[1px] dark:border-green-700 border-green-200
                                    px-3 py-2 rounded dark:bg-green-600 bg-green-300
                                    disabled:cursor-not-allowed 
                                    dark:disabled:bg-slate-500 dark:disabled:border-slate-600 disabled:bg-slate-200 disabled:border-slate-300 
                                    dark:disabled:text-slate-300 disabled:text-slate-500
                                `}
                                onClick={onScheduleButtonClick}
                                disabled={isSaving || !title || !email || !selectedDate}
                            >
                                {isSaving? 'Scheduling' : 'Schedule Now'}
                            </button>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

export default Page;