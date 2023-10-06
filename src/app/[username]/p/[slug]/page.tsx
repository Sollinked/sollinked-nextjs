'use client';
import { useSollinked } from "@sollinked/sdk";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOMServer from 'react-dom/server';
const HtmlToReactParser = require('html-to-react').Parser;
import moment from 'moment';
import { toast } from "react-toastify";
import dynamic from "next/dynamic";

const CustomEditor = dynamic(
    async () => (await import('../../../../components/CkEditor')),
    { ssr: false }
);
const parser = new HtmlToReactParser();

const Page = () => {
    const { user, mailingList } = useSollinked();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [tierIds, setTierIds] = useState<number[]>([]);
    const [lastUpdated, setLastUpdated] = useState("");
    const [executedAt, setExecutedAt] = useState("");
    const { slug: id } = useParams();
	const lastContent = useRef("");
    const hasInitiated = useRef(false);

    const getData = useCallback(async() => {

        if(!mailingList) {
            return;
        }

        if(!id) {
            return;
        }

        if(!user.id) {
            return;
        }

        if(hasInitiated.current) {
            return;
        }

        // hasInitiated.current = true;
        let res = await mailingList.getDraft(Number(id));
        if(!res) {
            toast.error("Unable to get draft");
            return;
        }

        if(typeof res === 'string') {
            toast.error(res);
            return;
        }

        setTitle(res.data.data?.title ?? "");
        setContent(res.data.data?.content ?? "");
        setLastUpdated(res.data.data?.updated_at? moment(res.data.data.updated_at).format('YYYY-MM-DD HH:mm:ss') : "");
        setExecutedAt(res.data.data?.execute_at? moment(res.data.data.execute_at).format('YYYY-MM-DD HH:mm:ss') : "");
        setTierIds(res.data.data?.tier_ids ?? []);
    }, [ mailingList, id, user ]);

    useEffect(() => {
        getData();
    }, [ mailingList, id, user, getData ]);

    return (
        <div className="flex flex-col">
            <button onClick={getData}>
                refresh
            </button>
            {/** have to import this here cause we need the css */}
            <div className="hidden">
                <CustomEditor
                    setContent={setContent}
                    initialContent={content}
                />
            </div>
            <div className={`
                ck ck-content no-tailwindcss-base
            `}>
                {
                    parser.parse(content)
                }
                
            </div>
        </div>
    )
}

export default Page;