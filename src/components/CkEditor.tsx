import { CKEditor } from '@ckeditor/ckeditor5-react';
import Editor from 'ckeditor5-custom-build/build/ckeditor';

const CustomEditor = ({
    setContent,
}: {
    setContent: (value: string) => void;
}) => {
    return (
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
                            '|',
                            'outdent',
                            'indent',
                            'bulletedList',
                            'numberedList',
                            'insertTable',
                            '|',
                            // 'codeBlock',
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
                    setContent(data);
                } }
            />
        </div>
    )
}

export default CustomEditor;