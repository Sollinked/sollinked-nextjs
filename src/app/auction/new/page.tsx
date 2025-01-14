'use client';
import { LeftOutlined } from "@ant-design/icons"
import { useSollinked } from "@sollinked/sdk";
import { Select } from "antd";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import DatePicker from 'react-datepicker';

import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";


const Page = () => {
    const router = useRouter();
    const { user, auction } = useSollinked();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [minBid, setMinBid] = useState("");

    const handleDateChange = useCallback((date: Date | null) => {
        setStartDate(date ?? new Date())
    }, []);

    const handleEndDateChange = useCallback((date: Date | null) => {
        setEndDate(date ?? new Date())
    }, []);

    const onSave = useCallback(async() => {
        if(!auction) {
            return;
        }

        try {
            await auction.create({ 
                start_date: moment(startDate).unix(), 
                end_date: moment(endDate).unix(), 
                min_bid: minBid? Number(minBid) : 0,
            });

            toast.success("Auction created");
            router.push("/auction");
        }

        catch {
            toast.error("Unable to save");
        }
    }, [startDate, endDate, minBid, auction, router]);

    return (
        <div className={`
            flex flex-col items-center justify-start
            min-h-[75vh]
        `}>
            
			<div className={`
				flex flex-row px-3 items-center justify-between  md:hidden
				md:h-[60px] h-[70px]
				md:sticky fixed top-0 left-0 right-0 md:w-full w-[100vw]
				dark:bg-black bg-white
				z-10 animate-fade-in
                md:hidden
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
            </div>
            <div className={`
                flex flex-col w-full
            `}>
                <div className="relative flex flex-col items-start">
                    <div className="relative flex flex-col items-start">
                        <strong>Start Date</strong>
                        <DatePicker 
                            selected={startDate} 
                            onChange={handleDateChange}
                            showTimeInput
                            dateFormat={"YYYY-MM-DD HH:mm:ss"}
                            className="outline-none text-black px-2 py-1 rounded mt-1"
                        />
                    </div>
                    <div className="relative flex flex-col items-start mt-5">
                        <strong>End Date</strong>
                        <DatePicker 
                            selected={endDate} 
                            onChange={handleEndDateChange}
                            showTimeInput
                            dateFormat={"YYYY-MM-DD HH:mm:ss"}
                            className="outline-none text-black px-2 py-1 rounded mt-1"
                        />
                    </div>
                    <div className="relative flex flex-col items-start mt-5">
                        <strong>Min Bid (USDC)</strong>
                        <input 
                            className="outline-none text-black px-2 py-1 rounded mt-1" 
                            placeholder="0"
                            onChange={({target: {value}}) => { setMinBid(value) }}
                        ></input>
                    </div>
                    <button className="mt-5 rounded px-3 py-2 bg-green-700" onClick={onSave}>Save</button>
                </div>
            </div>
        </div>
    )
}

export default Page;