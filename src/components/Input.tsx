
import React from 'react';

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

export const Input = ({
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
				w-full max-w-[90vw]
			`}
		>
			{
				addonBefore &&
				<div className={`
					flex justify-center items-center dark:bg-slate-600 bg-slate-200
					min-w-[100px] h-[30px]
					dark:text-white text-black text-xs 
					dark:border-slate-700 border-slate-300 border-t-[1px] border-l-[1px] border-b-[1px] rounded-l
				`}>
					<span className="text-center">{addonBefore}</span>
				</div>
			}
			<input
				type={type}
				placeholder={placeholder}
				value={value} 
				onChange={onChange}
				className={`
					h-[30px] w-full ${!addonAfter? 'rounded-r' : ''}
					text-xs dark:text-white text-black dark:bg-slate-700 dark:border-none border-[1px] border-slate-200
					pl-3
					focus:outline-none
				`}
				readOnly={readOnly}
				step={step}
			/>
			{
				addonAfter &&
				<div className={`
					flex justify-center items-center dark:bg-slate-600 bg-slate-200
					min-w-[120px] h-[30px]
					dark:text-white text-black text-xs
					dark:border-slate-700 border-slate-300 border-t-[1px] border-r-[1px] border-b-[1px] rounded-[1px] rounded-r
				`}>
					{addonAfter}
				</div>
			}
		</div>
	)
}