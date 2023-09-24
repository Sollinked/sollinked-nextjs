'use client';
import { useSollinked } from "@sollinked/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserGithubSetting, UserGithubTier } from "../../../../types";
import { cloneObj, toLocaleDecimal } from "@/common/utils";
import { toast } from "react-toastify";
import { CloseCircleOutlined, LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { Input } from "@/components/Input";
import { ConfigProvider, Modal, Table } from "antd";
import { useRouter } from 'next/navigation';
import { useTheme } from "@/hooks/useTheme";

const Page = ({params: { id }}: { params: { id: string }}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);
    const { user, github } = useSollinked();
    const router = useRouter();

    //inputs
    const [githubSetting, setGithubSetting] = useState<UserGithubSetting | undefined>(user?.githubSettings?.filter(x => x.id === Number(id))[0] ?? undefined);
    const [whitelists, setWhitelists] = useState(githubSetting?.whitelists ?? []);
    const [behavior, setBehavior] = useState<"close" | "mark">(githubSetting?.behavior ?? "mark");
    const [tiers, setTiers] = useState(githubSetting?.tiers ?? []);
    const [valueUsd, setValueUsd] = useState(0);
    const [label, setLabel] = useState("");
    const [color, setColor] = useState("#000000");
    const [whitelist, setWhitelist] = useState("");

    const {theme} = useTheme();
    const hasError = useMemo(() => !githubSetting, [githubSetting]);

    const whitelistObject = useMemo(() => {
        return whitelists.map((x, index) => ({
            id: index,
            contributor: x,
        }));
    }, [whitelists]);

    /**
     * Input fields
     */

    // whenever user updates
    useEffect(() => {
        setGithubSetting(user?.githubSettings?.filter(x => x.id === Number(id))[0] ?? undefined);
    }, [user, id]);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    // tiers
    const onAddTierClick = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const onAddTier = useCallback(() => {
        let newTiers = [
            ...tiers,
            {
                id: 0,
                user_github_id: Number(id!),
                label,
                color,
                value_usd: valueUsd,
            }
        ];

        setTiers(newTiers);
        setLabel("");
        setColor("#000000");
        setValueUsd(0);
        setIsModalOpen(false);
    }, [tiers, id, color, label, valueUsd]);

	const onDeleteTierIndex = useCallback((index: number) => {
        let clonedTiers = cloneObj(tiers);
		if(!clonedTiers) {
			return;
		}

		clonedTiers = clonedTiers.filter((x, i) => i !== index);
		setTiers(clonedTiers);
	}, [tiers]);

    const githubTierColumns = useMemo(() => {
        return [
            {
                title: 'Value (USDC)',
                dataIndex: 'value_usd',
                key: 'value_usd',
                render: (data: string, row: UserGithubTier) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{toLocaleDecimal(data, 2, 2)}
						</div>
					)
                },
            },
            {
                title: 'Label',
                dataIndex: 'label',
                key: 'label',
                render: (data: string, row: UserGithubTier) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{data}
						</div>
					)
                },
            },
            {
                title: 'Color',
                dataIndex: 'color',
                key: 'color',
                render: (data: string, row: UserGithubTier, index: number) => {
                    return (
                        <div
                            className={`
                                w-3 h-3 rounded-full
                            `}
                            style={{
                                backgroundColor: data? data : "#000000"
                            }}
                        >

                        </div>
					)
                },
            },
            {
                title: 'Action',
                dataIndex: 'id',
                key: 'id',
                render: (data: string, row: UserGithubTier, index: number) => {
                    return (
						<button 
							className={`
								dark:text-white text-black text-xs dark:bg-red-500 bg-red-200
								px-2 py-1
								rounded-lg
							`}
							onClick={() => onDeleteTierIndex(index)}
						>
							Delete
						</button>
                    );
                },
                sorter: false,
            },
        ]
    }, [ onDeleteTierIndex ]);

    // whitelist button
    const onAddWhitelistClick = useCallback(() => {
        setIsWhitelistModalOpen(true);
    }, []);

    const onAddWhitelist = useCallback(() => {
        let newWhitelists = [
            ...whitelists,
            whitelist
        ];

        setWhitelists(newWhitelists);
        setWhitelist("");
        setIsWhitelistModalOpen(false);
    }, [whitelists, whitelist]);

    const onDeleteWhitelistIndex = useCallback((filterIndex: number) => {
        let newWhitelists = whitelists.filter((x, index) => index !== filterIndex);
        setWhitelists(newWhitelists);
    }, [ whitelists ]);

    const githubWhitelistColumns = useMemo(() => {
        return [
            {
                title: 'Contributor',
                dataIndex: 'contributor',
                key: 'contributor',
                render: (data: string) => {
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							{data}
						</div>
					)
                },
            },
            {
                title: 'Action',
                dataIndex: 'id',
                key: 'id',
                render: (data: string, row: any, index: number) => {
                    return (
						<button 
							className={`
								dark:text-white text-black text-xs bg-red-500
								px-2 py-1
								rounded-lg
							`}
							onClick={() => onDeleteWhitelistIndex(index)}
						>
							Delete
						</button>
                    );
                },
                sorter: false,
            },
        ]
    }, [ onDeleteWhitelistIndex ]);

    // save button
    const onSaveClick = useCallback(async() => {
        if(!github) {
            return;
        }

        if(!id) {
            return;
        }

        setIsSaving(true);
        try {
            // update user tiers
            await github.update(Number(id), {
                tiers: tiers ?? [],
                whitelists: whitelists ?? [],
                repo_link: githubSetting?.repo_link ?? "",
                behavior,
            });

            setTimeout(() => {
                toast.success("Updated");
                setIsSaving(false);
            }, 300);
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
    }, [id, github, tiers, whitelists, githubSetting, behavior]);

    const onActivateToggle = useCallback(async() => {
        if(!github) {
            toast.error('Not logged in');
            return;
        }

        if(!id) {
            return;
        }

        try {
            // toggle active status
            await github.toggle(Number(id));
            /* let res = await axios({
                url: `/gitgud/toggle/${id}`,
                method: 'POST',
                data: {
                    address,
                    signature,
                },
            });
    
            if(!res.data.success) {
                toast.error("Error saving data");
                return;
            } */

            setTimeout(() => {
                toast.success("Updated");
                // getData();
            }, 300);
        }

        catch(e) {
            console.log(e);

            setTimeout(() => {
                toast.error("Error saving data");
            }, 300);
            return;
        }
        return;
    }, [id, github]);
	// modal functions
	const handleCancel = useCallback(() => {
		setIsModalOpen(false);
	}, []);

	const handleWhitelistCancel = useCallback(() => {
		setIsWhitelistModalOpen(false);
	}, []);

    if(isLoading) {
        return (
            <div className="h-[80vh] w-full flex items-center justify-center">
                <LoadingOutlined
                    style={{fontSize: 80}}
                />
            </div>
        );
    }

    if(hasError) {
        return (
            <div className="h-[80vh] w-full flex flex-col items-center justify-center text-red-400">
                <CloseCircleOutlined
                    style={{fontSize: 80}}
                    color='red'
                />

                <strong className="mt-5">Unable to load setting!</strong>
            </div>
        );
    }


    return (
        <div 
            className={`
                flex flex-col justify-center w-full
                md:p-3 min-h-[70vh]
                relative
            `}
        >
            <div className={`
                ${user.id === 0? 'hidden' : ''}
                flex flex-row px-3 items-center justify-between
                md:h-[60px] h-[70px]
                md:sticky fixed top-0 left-0 right-0 md:backdrop-blur-none backdrop-blur-sm md:bg-transparent dark:bg-slate-300/10
                z-10
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
                <div className="space-x-2">
                    <button
                        className={`
                            rounded 
                            ${githubSetting?.is_active? "dark:bg-red-600 bg-red-200" : "dark:bg-green-600 bg-green-200"}
                            md:w-[120px] w-[80px] py-2
                            md:text-sm text-xs drop-shadow-lg
                        `}
                        onClick={onActivateToggle}
                        disabled={isSaving}
                    >
                        {githubSetting?.is_active? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        className={`
                            rounded dark:bg-green-600 bg-green-200
                            md:w-[120px] w-[80px] py-2
                            md:text-sm text-xs drop-shadow-lg
                        `}
                        onClick={onSaveClick}
                        disabled={isSaving}
                    >
                        { isSaving? 'Saving..' : 'Save' }
                    </button>
                </div>
            </div>
            <h1 className="text-center md:mt-8 mt-[80px]">{githubSetting?.repo_link}</h1>

            <div className="mt-5"></div>
            <div 
                className={`
                    relative
                    flex items-center justify-center
                `}
            >
                <div className="relative">
                    <select
                        className={`
                            dark:bg-slate-500 dark:border-none border-[1px] border-slate-300 rounded px-3 py-2
                            outline-none
                            text-center xl:w-[40vw] md:w-[500px] w-[90vw]
                        `}
                        value={behavior}
                        onChange={({target: {value}}) => setBehavior(value as "mark" | "close")}
                    >
                        <option value="mark">Mark As Unpaid</option>
                        <option value="close">Close Issue</option>
                    </select>
                    <div 
                        className={`
                            text-xs absolute top-2.5 left-2
                        `}
                    >
                        Behavior
                    </div>
                </div>
            </div>
            <div className={`
                m-auto mt-10 
                text-center
                flex flex-row justify-center align-center
            `}>
                <span>Tiers</span>
                <button
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-white bg-green-500
                        border-none
                    `}
                    onClick={onAddTierClick}
                >
                    <span>+</span>
                </button>
            </div>

            <div className={`
                flex flex-col items-center justify-start
                w-full
                mt-3 mb-3
            `}>
                <div className={`
                    flex flex-col items-center justify-start
                    shadow
                    rounded-md
                `}>
                    <Table
                        className='xl:w-[40vw] w-[500px]'
                        columns={githubTierColumns}
                        dataSource={tiers}
                        pagination={false}
                        rowKey={(r) => `github-tier-${r.id}`}
                    />
                </div>
            </div>


            <div className={`
                m-auto mt-10 
                text-center
                flex flex-row justify-center align-center
            `}>
                <span>Whitelists</span>
                <button
                    className={`
                        ml-3 my-auto border-[1px]
                        h-7 w-7 text-[20px]
                        rounded
                        flex items-center justify-center
                        dark:text-white text-white bg-green-500
                        border-none
                    `}
                    onClick={onAddWhitelistClick}
                >
                    <span>+</span>
                </button>
            </div>

            <div className={`
                flex flex-col items-center justify-start
                w-full
                mt-3 mb-3
            `}>
                <div className={`
                    flex flex-col items-center justify-start
                    shadow
                    rounded-md
                `}>
                    <Table
                        className='xl:w-[40vw] w-[500px]'
                        columns={githubWhitelistColumns}
                        dataSource={whitelistObject}
                        pagination={false}
                        rowKey={(r) => `github-tier-${r.id}`}
                    />
                </div>
            </div>
            <Modal
                title="New Issue Tier" 
                open={isModalOpen} 
                onOk={onAddTier} 
                onCancel={handleCancel}
                footer={[
                    <button 
                        key="submit" 
                        onClick={onAddTier}
                        className={`
                            bg-green-500 dark:text-white text-black rounded
                            px-3 py-2
                        `}
                    >
                        Add
                    </button>,
                ]}
            >
                <Input
                    type="text"
                    addonBefore="Label"
                    value={label.toString()}
                    onChange={({ target: {value}}) => { setLabel(value)}}
                    placeholder='your label'
                />
                <div className="mb-1"></div>
                <Input
                    type="number"
                    addonBefore="Value (USDC)"
                    value={valueUsd.toString()}
                    onChange={({ target: {value}}) => { setValueUsd(Number(value)) }}
                    placeholder='0'
                    step="0.01"
                />
                <div className="mb-1"></div>
                <Input
                    type="color"
                    addonBefore="Color"
                    value={color}
                    onChange={({ target: {value}}) => { setColor(value) }}
                    placeholder='0'
                    step="0.01"
                />
            </Modal>
            <Modal
                title="New Whitelist" 
                open={isWhitelistModalOpen} 
                onOk={onAddWhitelist} 
                onCancel={handleWhitelistCancel}
                footer={[
                    <button 
                        key="submit" 
                        onClick={onAddWhitelist}
                        className={`
                            bg-green-500 dark:text-white text-black rounded
                            px-3 py-2
                        `}
                    >
                        Add
                    </button>,
                ]}
            >
                <Input
                    type="text"
                    addonBefore="Whitelist"
                    value={whitelist.toString()}
                    onChange={({ target: {value}}) => { setWhitelist(value)}}
                    placeholder='contributer_username or contributor@email.com'
                />
            </Modal>
        </div>
    );
}

export default Page;