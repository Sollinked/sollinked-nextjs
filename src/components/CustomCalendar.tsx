import { LeftCircleFilled, RightCircleFilled } from "@ant-design/icons";
import moment, { Moment } from "moment";
import { useCallback, useMemo, useState } from "react";

type CalendarParams = {
    minDate?: Moment;
    maxDate?: Moment;
    markedDates?: Moment[];
    disabledDates?: Moment[];
    selectedDate?: Moment;
	onDateChange: (date: Moment) => void;
}

const CustomCalendar = ({
    minDate,
    maxDate,
    markedDates,
    disabledDates,
	onDateChange,
	selectedDate,
}: CalendarParams) => {
	const [currentDate, setCurrentDate] = useState(selectedDate ?? moment());
	const {offset, daysInMonth} = useMemo(() => {
		return {
			offset: moment(currentDate).startOf('M').day(),
			daysInMonth: moment(currentDate).startOf('M').daysInMonth(),
		}
	}, [currentDate]);

    const disabledDatesStr = useMemo(() => {
        if(!disabledDates) {
            return undefined;
        }

        let dates: string[] = [];
        disabledDates.forEach(d => {
            let dateStr = d.format('YYYY-MM-DD');
            if(dates.includes(dateStr)) {
                return;
            }

            dates.push(dateStr);
        });

        return dates;
    }, [ disabledDates ]);

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
        let rowDate = moment(currentDate).startOf('M');

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

            let disabled = false;
            if(minDate && rowDate.isBefore(minDate)) {
                disabled = true;
            }

            if(maxDate && rowDate.isAfter(maxDate)) {
                disabled = true;
            }

            if(
                disabledDatesStr 
                && disabledDatesStr.length > 0 
                && disabledDatesStr.includes(rowDate.format('YYYY-MM-DD'))
            ) {
                disabled = true;
            }

			tds.push(<td key={`custom-calendar-${i + offset}`} className='w-[14.28%]'>
						<button
							onClick={() => onDateClick(i)}
							className={`
								md:w-[50px] md:h-[50px] h-[5vh] w-[5vh] rounded-full 
								outline-none ${currentDate.date() === i + 1? 'dark:bg-indigo-500 bg-indigo-200' : "dark:bg-slate-600 bg-white"}
								active:outline-none
								focus:shadow-transparent focus:outline-none
                                dark:disabled:bg-red-500 bg-red-200 disabled:cursor-not-allowed
							`}
                            disabled={disabled}
						>
							{i + 1}
						</button>
					</td>);

            rowDate.add(1, 'd');
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
	}, [offset, daysInMonth, currentDate, disabledDatesStr]);

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
								font-normal md:text-base text-xs
							`}
						>
							SUN
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
							`}
						>
							MON
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
							`}
						>
							TUE
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
							`}
						>
							WED
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
							`}
						>
							THU
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
							`}
						>
							FRI
						</th>
						<th
							className={`
								font-normal md:text-base text-xs
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

export default CustomCalendar;