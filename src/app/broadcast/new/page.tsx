'use client';
import { LeftOutlined } from "@ant-design/icons"
import { useSollinked } from "@sollinked/sdk";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Editor from 'ckeditor5-custom-build/build/ckeditor';
import { Title } from '@ckeditor/ckeditor5-heading';

const Page = () => {
    const router = useRouter();
    const { user } = useSollinked();
    const [content, setContent] = useState("");
    const publish = useCallback(() => {
      console.log(content);
    }, [ content ]);

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
                >
                    {
                        user.mailingList?.tiers.map(x => {
                            return (
                                <Select.Option value={x.id} key={`price-tier-option-${x.id}`}>{x.name} ({x.subscriber_count} subscribers)</Select.Option>
                            )
                        })
                    }
                </Select>
                <strong className="mt-10">Content</strong>
                <div className="no-tailwindcss-base text-black">
                    <CKEditor
                        editor={ Editor }
                        data=""
                        config={{
                            toolbar: {
                                items: [
                                    'undo',
                                    'redo',
                                    'heading',
                                    '|',
                                    'bold',
                                    'italic',
                                    'fontBackgroundColor',
                                    'fontColor',
                                    'fontFamily',
                                    'fontSize',
                                    'highlight',
                                    'strikethrough',
                                    'subscript',
                                    'superscript',
                                    'underline',
                                    "-",
                                    'link',
                                    'imageInsert',
                                    'outdent',
                                    'indent',
                                    'bulletedList',
                                    'numberedList',
                                    '|',
                                    'blockQuote',
                                    'insertTable',
                                    'mediaEmbed',
                                    'codeBlock',
                                    'findAndReplace',
                                    'selectAll',
                                ],
                                shouldNotGroupWhenFull: true
                            },
                        }}
                        onReady={ editor => {
                            // You can store the "editor" and use when it is needed.
                            // console.log( 'Editor is ready to use!', editor );
                        } }
                        onChange={ ( event, editor: any ) => {
                            const data = editor.getData();
                            console.log( { data } );
                        } }
                    />
                </div>
                <button 
                    className={`
                        mt-3
                        w-[100px] h-[30px] rounded
                        bg-green-500 dark:text-white text-black
                    `}
                    onClick={publish}
                >Publish</button>
            </div>
        </div>
    )
}

export default Page;