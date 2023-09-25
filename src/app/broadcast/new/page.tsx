'use client';
import { LeftOutlined } from "@ant-design/icons"
import { useSollinked } from "@sollinked/sdk";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { toast } from "react-toastify";
import dynamic from "next/dynamic";

const CustomEditor = dynamic(
    async () => (await import('../../../components/CkEditor')),
    { ssr: false }
);


const Page = () => {
    const router = useRouter();
    const { user, mailingList } = useSollinked();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [tierIds, setTierIds] = useState<number[]>([]);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const publish = useCallback(async() => {
        if(!mailingList) {
            toast.error("Sollinked is not initialized");
            return;
        }


        setIsBroadcasting(true);
        try {
            let res = await mailingList.broadcast({
                tier_ids: tierIds,
                content,
                title,
            });

            if(!res) {
                toast.error('Unable to broadcast');
                setIsBroadcasting(false);
                return;
            }

            if(typeof res === "string") {
                toast.error(res);
                setIsBroadcasting(false);
                return;
            }

            toast.success('Broadcast in progress');
        }

        catch(e: any){
            toast.error('Unable to broadcast: Common error, message too large');
        }

        setIsBroadcasting(false);

    }, [ content, title, tierIds ]);

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
                <strong>Targets</strong>
                <Select
                    className={`
                        w-full mt-3
                    `}
                    mode="multiple"
                    onChange={(value) => { setTierIds(value) }}
                >
                    {
                        user.mailingList?.tiers.map(x => {
                            return (
                                <Select.Option value={x.id} key={`price-tier-option-${x.id}`}>{x.name} ({x.subscriber_count} subscribers)</Select.Option>
                            )
                        })
                    }
                </Select>
                <strong className="mt-10">Title</strong>
                <input 
                    type="text" 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `} 
                    value={title} 
                    onChange={({target: { value }}) => setTitle(value)}
                />
                <strong className="mt-10">Content</strong>
                <span className="mt-3">* Note: Tables don't have borders in the actual email.</span>
                <CustomEditor
                    setContent={setContent}
                />
                <button 
                    className={`
                        mt-3
                        w-[200px] h-[30px] rounded
                        bg-green-500 dark:text-white text-black
                        disabled:cursor-not-allowed 
                        dark:disabled:bg-slate-500 dark:disabled:border-slate-600 disabled:bg-slate-200 disabled:border-slate-300 
                        dark:disabled:text-slate-300 disabled:text-slate-500
                    `}
                    onClick={publish}
                    disabled={isBroadcasting || !title || !content || tierIds.length === 0}
                >
                    {isBroadcasting? 'Broadcasting..' : 'Broadcast'}
                </button>
            </div>
        </div>
    )
}

export default Page;