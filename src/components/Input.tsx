
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