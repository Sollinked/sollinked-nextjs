'use client';
import { useCallback, useEffect, useState } from 'react';
import { copyToClipboard, ellipsizeThis } from '../../common/utils';
import _ from 'lodash';
import { toast } from 'react-toastify';
import { Button, ConfigProvider, Modal } from 'antd';
import { CopyOutlined, DeleteOutlined, LoadingOutlined, PoweroffOutlined } from '@ant-design/icons';
import Link from 'next/link';
import moment from 'moment';
import { useSollinked } from '@sollinked/sdk';
import { Input } from '@/components/Input';

const Page = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [repoLink, setRepoLink] = useState("");
    const {user, github } = useSollinked();

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    // save button
    const handleCancel = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const onSaveClick = useCallback(async() => {
        if(!github) {
            return;
        }
        
        setIsSaving(true);
        try {
			let splitStr = repoLink.split("/");
			if(splitStr.length !== 3) {
				toast.error('Invalid format, please follow the /{owner}/{repo} format');
                setIsSaving(false);
                setIsModalOpen(false);
				return;
			}
            // update user tiers
            await github.create({
                repo_link: repoLink
            });

			toast.success("Updated");
			setIsSaving(false);
			setIsModalOpen(false);
			setRepoLink("");
        }

        catch(e) {
            console.log(e);

            setTimeout(() => {
                toast.error("Error saving data");
                setIsSaving(false);
            }, 300);
            return;
        }
        return;
    }, [repoLink, github]);

    const onActivateToggle = useCallback(async(user_github_id: number) => {
        if(!github) {
            return;
        }

        try {
            // update user tiers
            await github.toggle(user_github_id);
			toast.success('Updated');
        }

        catch(e) {
            console.log(e);

            setTimeout(() => {
                toast.error("Error saving data");
                setIsSaving(false);
            }, 300);
            return;
        }
        return;
    }, [github]);

    const onDelete = useCallback(async(user_github_id: number) => {
        if(!github) {
            return;
        }

        try {
            // update user tiers
            await github.delete(user_github_id);
			toast.success('Deleted');
        }

        catch(e) {
            console.log(e);

            setTimeout(() => {
                toast.error("Error deleting");
                setIsSaving(false);
            }, 300);
            return;
        }
        return;
    }, [github]);


    if(isLoading) {
        return (
            <div className="h-[80vh] w-full flex items-center justify-center">
                <LoadingOutlined style={{ fontSize: 80 }}/>
            </div>
        );
    }

    return (
        <div 
			className={`
				flex flex-col justify-center items-center
				w-full h-full pt-5
			`}
		>

            <div className={`
				flex flex-row items-center justify-center
			`}>
                <strong className='mr-3'>Github Profiles</strong>
                <button
                    onClick={() => setIsModalOpen(true)}
					className={`
						rounded bg-green-500
						w-5 h-5
						flex items-center justify-center
					`}
                >
                    <span>+</span>
                </button>
            </div>

            <div className={`
					mt-5 flex flex-col xl:items-center space-y-3 p-3
					bg-slate-700 rounded min-h-[70vh] xl:min-w-[45vw] md:w-[500px] w-full
				`}
			>
                {
                    user?.githubSettings?.map((x, index) => (
                        <div 
							className={`
								flex flex-row justify-center items-center
								border-[1px] p-3 rounded
								${x.last_synced_at? 'bg-green-800/80 border-green-700' : 'bg-red-800/80 border-red-700'}
							`}
                            key={`github-link-${index}`} 
                        >
                            <Link 
                                href={`/github/${x.id}`}
								className={`
									xl:w-[500px] w-full flex items-center
								`}
                            >
                                <button
                                    className={`
										w-full mr-5
									`}
                                >
                                    <div 
										className={`
											flex xl:flex-row flex-col-reverse xl:justify-between justify-center xl:items-center items-start
											w-full h-full
										`}
									>
                                        <span className='md:text-lg text-xs'>{ellipsizeThis(x.repo_link, 12, 12)}</span>
                                        {
                                            x.last_synced_at?
                                            <span className={`text-[10px]`}>{moment(x.last_synced_at).format('YYYY-MM-DD HH:mm:ss')}</span> :
                                            <span className={`text-[10px]`}>Copy UUID and paste it into a new issue in your repo</span>
                                        }
                                    </div>
                                </button>
                            </Link>
                            {
                                x.last_synced_at?
                                <button
                                    className={`
										h-[30px] min-w-[30px] rounded
										ml-2 flex items-center justify-center
										${x.is_active? "border-red-500 bg-red-500" : "border-green-500 bg-green-500"} border-[1px]
									`}
                                    onClick={() => {
                                        onActivateToggle(x.id);
                                    }}
                                >
                                    <PoweroffOutlined
										className={`
											text-[17px]
											${x.is_active? "text-red-200" : "text-green-200"}
										`}
                                    />
                                </button>:
                                <button
                                    className={`
										flex items-center justify-center
										text-white bg-slate-500 min-w-[30px] h-[30px] rounded
									`}
                                    onClick={() => {
                                        copyToClipboard(x.uuid);
                                        toast.success('Copied');
                                    }}
                                >
                                    <CopyOutlined 
                                        className={`
											text-[17px]
										`}
                                    />
                                </button>
                            }
                            <button
                                className={`
									ml-2 border-[1px] border-red-500 bg-red-500
									text-white min-w-[30px] h-[30px] rounded
								`}
                                onClick={() => {
                                    onDelete(x.id)
                                }}
                            >
                                <DeleteOutlined
                                    style={{
                                        fontSize: 17,
                                    }}
                                />
                            </button>

                        </div>
                    ))
                }
            </div>

            {/** Change to modal */}

			<ConfigProvider
				theme={{
					components: {
						Modal: {
							contentBg: 'rgb(30,41,59)',
							headerBg: 'rgb(30,41,59)',
							titleColor: 'white',
							colorIcon: 'white',
						}
					}
				}}
			>
				<Modal
					title="New Github Profile" 
					className='github-profile-modal'
					open={isModalOpen} 
					onOk={onSaveClick} 
					onCancel={handleCancel}
					footer={[
						<button 
							key="submit"
							onClick={onSaveClick}
							className={`
								w-[100px] h-[30px] rounded
								bg-green-500 text-white
							`}
						>
							{isSaving? 'Saving..' : 'Save'}
						</button>,
						]}
				>
					<Input
						type="text"
						addonBefore="Repo Link"
						value={repoLink}
						onChange={({ target: {value}}) => setRepoLink(value)}
						placeholder='/{owner}/{repo}'
					/>
				</Modal>
			</ConfigProvider>
        </div>
    );
}

export default Page;