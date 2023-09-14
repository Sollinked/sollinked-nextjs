'use client';
import { Table, Tag, Tabs, ConfigProvider } from 'antd';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { copyToClipboard, toLocaleDecimal } from '../../common/utils';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import { Mail } from '../../../types';
import { SortOrder } from 'antd/es/table/interface';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useSollinked } from '@sollinked/sdk';
import { useTheme } from '@/hooks/useTheme';
dayjs.extend(duration);

const NO_PAYMENT_AFTER_DAYS = 2;
const Page = () => {
    const {user} = useSollinked();
    const { theme } = useTheme();

    const [sortedInfo, setSortedInfo] = useState<{
        columnKey: string;
        order: SortOrder;
    }>({
        columnKey: "value_usd",
        order: "descend",
    });

    const handleChange = useCallback((pagination: any, filters: any, sorter: any) => {
        setSortedInfo(sorter);
    }, []);

    const columns = useMemo(() => {
        return [
            {
                title: 'Expires In',
                dataIndex: 'expiry_date',
                key: 'expiry_date',
                sorter: (a: Mail, b: Mail) => moment(a.expiry_date).diff(b.expiry_date, 's'),
                sortOrder: sortedInfo.columnKey === 'expiry_date' ? sortedInfo.order : null,
                render: (data: string, row: Mail) => {
                    if(!data) {
                        return (
							<span className={`dark:text-white text-black text-xs`}>-</span>
						);
                    }

                    if(row.is_claimed) {
                        return (
							<span className={`dark:text-white text-black text-xs`}>-</span>
						);
                    }

                    let date = moment(data);
                    return (
						<div 
							className={`
								flex flex-col
								dark:text-white text-black text-xs
							`}
						>
							<span>{date.fromNow()}</span>
							<span style={{fontSize: 10}}>{date.format('YYYY-MM-DD HH:mm:ss')}</span>
						</div>
					)
                },
            },
            {
                title: 'From',
                dataIndex: 'from_email',
                key: 'from_email',
                sorter: (a: Mail, b: Mail) => a.from_email > b.from_email? 1 : -1,
                sortOrder: sortedInfo.columnKey === 'from_email' ? sortedInfo.order : null,
				render: (data: string) => {
					return (
						<span
							className={`
								dark:text-white text-black text-xs
							`}
						>
							{data}
						</span>
					)
				}
            },
            {
                title: 'Reply To',
                dataIndex: 'bcc_to_email',
                key: 'bcc_to_email',
                sorter: false,
                sortOrder: null,
                render: (data: string, row: Mail) => {
                    return (
						<button 
							className={`
								border-[1px] border-white hover:border-indigo-300
								dark:text-white text-black text-xs hover:text-indigo-300
								px-2 py-1
								rounded-lg
							`}
							onClick={() => {
								copyToClipboard(`${row.from_email},${data}`);
								toast.success('Copied');
							}}
						>
							Copy
						</button>
					)
                }
            },
            {
                title: 'Deposit Address',
                dataIndex: 'tiplink_public_key',
                key: 'tiplink_public_key',
                sorter: false,
                sortOrder: null,
                render: (data: string) => {
                    if(!data) {
                        return "Error getting link";
                    }
                    return (
                        <a href={`https://solana.fm/address/${data}?cluster=mainnet-qn1`} target='_blank'>
							<button 
								className={`
									border-[1px] border-white hover:border-indigo-300
									dark:text-white text-black text-xs hover:text-indigo-300
									px-2 py-1
									rounded-lg
								`}
							>
								Explorer
							</button>
                        </a>
                    )
                },
            },
            {
                title: 'Value (USDC)',
                dataIndex: 'value_usd',
                key: 'value_usd',
                sorter: (a: Mail, b: Mail) => (a.value_usd ?? 0) - (b.value_usd ?? 0),
                sortOrder: sortedInfo.columnKey === 'value_usd' ? sortedInfo.order : null,
				render: (data: string) => {
					return (
						<span
							className={`
								dark:text-white text-black text-xs
							`}
						>
							{toLocaleDecimal(Number(data), 2, 2)}
						</span>
					)
				}
            },
            {
                title: 'Action',
                dataIndex: 'tiplink_url',
                key: 'tiplink_url',
                render: (data: string, row: Mail) => {
                    let createdDate = moment(row.created_at);
                    if(!row.value_usd && moment().diff(createdDate, 'd') >= NO_PAYMENT_AFTER_DAYS) {
                        return<Tag color="magenta">No Payment Received</Tag>;
                    }
                    if(row.is_claimed) {
                        return <Tag color="green">Claimed</Tag>;
                    }

                    if(row.has_responded) {
                        return (
                            <a href={data} target='_blank'>
								<button 
									className={`
										border-[1px] border-white hover:border-indigo-300
										dark:text-white text-black text-xs hover:text-indigo-300
										px-2 py-1
										rounded-lg
									`}
								>
                                    Claim
                                </button>
                            </a>
                        )
                    }

                    if(row.expiry_date && moment().isAfter(moment(row.expiry_date))) {
                        return <Tag color="red">Expired</Tag>;
                    }

                    if(!row.is_processed) {
                        return <Tag color="gold">Processing</Tag>;
                    }
                    
                    return (
                        <a href={`mailto:${row.from_email}?bcc=${row.bcc_to_email ?? ""}`} target='_blank'>
							<button 
								className={`
									border-[1px] border-white hover:border-indigo-300
									dark:text-white text-black text-xs hover:text-indigo-300
									px-2 py-1
									rounded-lg
								`}
							>
								Reply
							</button>
                        </a>
                    );
                },
                sorter: false,
            },
        ]
    }, [ sortedInfo ]);

    const tabItems = useMemo(() => {

        const pendingResponse: Mail[] = [];
        const claimed: Mail[] = [];
        const claimable: Mail[] = [];
        const pendingDeposit: Mail[] = [];
        const noPayment: Mail[] = [];
        const expiredMail: Mail[] = [];

        if(user && user.mails) {
            user.mails.forEach(mail => {
                let createdDate = moment(mail.created_at);
                if(!mail.value_usd && moment().diff(createdDate, 'd') >= NO_PAYMENT_AFTER_DAYS) {
                    noPayment.push(mail);
                    return;
                }
                if(mail.is_claimed) {
                    claimed.push(mail);
                    return;
                }
        
                if(mail.has_responded) {
                    claimable.push(mail);
                    return;
                }
        
                if(mail.expiry_date && moment().isAfter(moment(mail.expiry_date))) {
                    expiredMail.push(mail);
                    return;
                }
        
                if(!mail.is_processed) {
                    pendingDeposit.push(mail);
                    return;
                }
                
                pendingResponse.push(mail);
                return;
            });
        }

        return ([
            {
                key: '1',
                label: 'Pending Response',
                children: (
                    <Table
						className='w-full mt-3'
                        columns={columns}
                        dataSource={pendingResponse}
                        scroll={{
                            y: '65vh'
                        }}
                        onChange={handleChange}
                    />
				)
            },
            {
                key: '2',
                label: 'Claimable',
                children: (
                    <Table
						className='w-full mt-3'
                        columns={columns}
                        dataSource={claimable}
                        scroll={{
                            y: '65vh',
                        }}
                        onChange={handleChange}
                    />
                )
            },
            {
                key: '3',
                label: 'Pending Deposit',
                children: (
                    <Table
						className='w-full mt-3'
                        columns={columns}
                        dataSource={pendingDeposit}
                        scroll={{
                            y: '65vh'
                        }}
                        onChange={handleChange}
                    />
                )
            },
            {
                key: '4',
                label: 'Claimed',
                children: (
                    <Table
						className='w-full mt-3'
                        columns={columns}
                        dataSource={claimed}
                        scroll={{
                            y: '65vh'
                        }}
                        onChange={handleChange}
                    />
                )
            },
        ]);
    }, [ user, handleChange, columns ]);

    return (
		<ConfigProvider
			theme={{
				components: {
					Tabs: {
						inkBarColor: theme === "light"? '#1677ff' : 'rgb(99,102,241)',
						itemSelectedColor: theme === "light"? "#1677ff" : 'rgb(255,255,255)',
						itemColor: theme === "light"? "	rgba(0, 0, 0, 0.88)" : 'rgb(100,116,139)',
					},
					Table: {
						fontSize: 10,
						headerBg: theme === "light"? "#fafafa" : 'rgb(51,65,85)',
						headerColor: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
						headerSortActiveBg: theme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
						headerSortHoverBg: theme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
						colorBgContainer: theme === "light"? "#ffffff" : 'rgb(71,85,105)',
						headerSplitColor: theme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
						borderColor: theme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
					},
					Empty: {
						colorText: theme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
						colorTextDisabled: theme === "light"? "rgba(0, 0, 0, 0.25)" : 'white',
					}
				}
			}}
		>
			<div className={`
				flex flex-col items-center justify-start
				h-full w-full
			`}>
				<div className={`
					w-full h-[60vh]
					flex flex-col items-center justify-start
					mt-[30px]
					shadow
					rounded-md
				`}>
					<Tabs
						className='w-full flex flex-col items-center justify-center bg-transparent'
						defaultActiveKey='1'
						items={tabItems}
					/>
				</div>
			</div>
		</ConfigProvider>
    );
};

export default Page;