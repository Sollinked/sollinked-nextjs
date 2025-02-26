'use client';
import { LeftOutlined } from "@ant-design/icons"
import { useSollinked } from "@sollinked/sdk";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";


const Page = () => {
    const router = useRouter();
    const { user, contentPass } = useSollinked();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [valueUsd, setValueUsd] = useState("");
    const [amount, setAmount] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const { id } = useParams();

    const onSave = useCallback(async() => {
        if(!contentPass) {
            toast.error("Sollinked is not initialized");
            return;
        }

        if(!user.id) {
            toast.error('Please log in to continue');
            return;
        }

        setIsSaving(true);
        try {
            let res = await contentPass.update(Number(id), {
                name,
                description,
                value_usd: Number(valueUsd),
                amount: Number(amount),
            });

            if(!res) {
                toast.error('Unable to save');
                setIsSaving(false);
                return;
            }

            if(typeof res === "string") {
                toast.error(res);
                setIsSaving(false);
                return;
            }

            toast.success('Saved');
            setIsSaving(false);
        }

        catch(e: any){
            console.log(e)
            toast.error('Unable to save: Common error, message too large');
            setIsSaving(false);
        }

        // setIsSaving(false);

    }, [ user, id, contentPass, amount, valueUsd, name, description ]);


    useEffect(() => {
        if(!id) {
            return;
        }

        if(!user || !user.id) {
            return;
        }

        let idNum = Number(id);
        let pass = user.contentPasses?.filter(x => x.id === idNum);
        if(!pass || pass.length === 0) {
            return;
        }

        setName(pass[0].name);
        setDescription(pass[0].description);
        setAmount(pass[0].amount.toString());
        setValueUsd(pass[0].value_usd.toString());
    }, [ user, id ]);

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
                <strong className="mt-3">Name</strong>
                <input 
                    type="text" 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `} 
                    value={name} 
                    onChange={({target: { value }}) => setName(value)}
                />
                <strong className="mt-3">Description</strong>
                <textarea 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                        h-[150px]
                    `} 
                    value={description} 
                    onChange={({target: { value }}) => setDescription(value)}
                />
                <strong className="mt-3">Limit</strong>
                <input 
                    type="number" 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `}
                    value={amount}
                    placeholder="0 for unlimited mint"
                    onChange={({target: { value }}) => setAmount(value)}
                />
                <strong className="mt-3">Price</strong>
                <input 
                    type="number" 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `}
                    value={valueUsd}
                    placeholder="Price in USDC"
                    onChange={({target: { value }}) => setValueUsd(value)}
                />
                <div
                    className={`
                        flex md:flex-row flex-col
                        mt-3
                    `}
                >
                    <button 
                        className={`
                            md:mt-0 mt-3
                            md:w-[200px] w-full h-[30px] rounded
                            bg-green-500 dark:text-white text-black
                            disabled:cursor-not-allowed 
                            dark:disabled:bg-slate-500 dark:disabled:border-slate-600 disabled:bg-slate-200 disabled:border-slate-300 
                            dark:disabled:text-slate-300 disabled:text-slate-500
                        `}
                        onClick={onSave}
                        disabled={isSaving || !name || !valueUsd || !description}
                    >
                        {isSaving? 'Saving..' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Page;