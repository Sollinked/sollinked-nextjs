'use client';
import { LeftOutlined } from "@ant-design/icons"
import { useSollinked } from "@sollinked/sdk";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import { ContentStatus } from "@sollinked/sdk/dist/src/Content/types";

const CustomEditor = dynamic(
    async () => (await import('../../../components/CkEditor')),
    { ssr: false }
);


const Page = () => {
    const router = useRouter();
    const { user, content: contentAPI } = useSollinked();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentPassIds, setContentPassIds] = useState<number[]>([]);
    const [status, setStatus] = useState<ContentStatus>("draft");
    const [valueUsd, setValueUsd] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const saveDraft = useCallback(async() => {
        if(!contentAPI) {
            toast.error("Sollinked is not initialized");
            return;
        }

        if(!user.id) {
            toast.error('Please log in to continue');
            return;
        }

        setIsSaving(true);
        try {
            let res = await contentAPI.create({
                content,
                title,
                description,
                content_pass_ids: contentPassIds,
                status,
                value_usd: valueUsd !== ""? Number(valueUsd) : 0,
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

            if(!res.data.data) {
                toast.error('Unable to save');
                setIsSaving(false);
                return;
            }

            toast.success('Saved');
            router.push(`/content/edit/${res.data.data}`)
        }

        catch(e: any){
            console.log(e)
            toast.error('Unable to save: Common error, message too large');
            setIsSaving(false);
        }

        // setIsSaving(false);

    }, [ user, content, title, description, contentPassIds, status, valueUsd, contentAPI, router ]);

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
                <strong>Allowed Passes</strong>
                <Select
                    className={`
                        w-full mt-3
                    `}
                    mode="multiple"
                    onChange={(value) => { setContentPassIds(value) }}
                >
                    {
                        user.contentPasses?.map(x => {
                            return (
                                <Select.Option value={x.id} key={`allowed-passes-${x.id}`}>{x.name}</Select.Option>
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
                <strong className="mt-10">Description</strong>
                <textarea 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `} 
                    value={description} 
                    onChange={({target: { value }}) => setDescription(value)}
                />
                <strong className="mt-10">Price</strong>
                <input 
                    type="number" 
                    className={`
                        dark:bg-slate-800 bg-white rounded
                        px-3 py-2
                        outline-none disabled:cursor-not-allowed
                    `}
                    value={valueUsd}
                    placeholder="0 for free content"
                    onChange={({target: { value }}) => setValueUsd(value)}
                />
                <strong className="mt-10">Status</strong>
                <Select
                    className={`
                        w-full mt-3
                    `}
                    onChange={(value) => { setStatus(value) }}
                    value={status}
                >
                    <Select.Option value="draft">Draft</Select.Option>
                    <Select.Option value="published">Published</Select.Option>
                </Select>
                <strong className="mt-10">Content</strong>
                <span className="mt-3">* Note: Tables don&apos;t have borders in the actual email.</span>
                <span>* Note: Drafts don&apos;t save &quot;Targets&quot;.</span>
                <CustomEditor
                    setContent={setContent}
                    initialContent={content}
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
                        onClick={saveDraft}
                        disabled={isSaving || !title || !content || !description}
                    >
                        {isSaving? 'Saving..' : 'Save Draft'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Page;