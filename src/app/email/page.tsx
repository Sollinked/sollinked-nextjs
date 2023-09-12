'use client';
import { Table, Button, Tag, Tabs, ConfigProvider } from 'antd';

import { useContext, useMemo, useState, useCallback } from 'react';
import { copyToClipboard, toLocaleDecimal } from '../../common/utils';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import { Mail } from '../../../types';
import { SortOrder } from 'antd/es/table/interface';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useSollinked } from '@sollinked/sdk';
import { table } from 'console';
dayjs.extend(duration);

const NO_PAYMENT_AFTER_DAYS = 2;
const Page = () => {
    const {user} = useSollinked();
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

    let columns = useMemo(() => {
        return [
            {
                title: 'Expires In',
                dataIndex: 'expiry_date',
                key: 'expiry_date',
                sorter: (a: Mail, b: Mail) => moment(a.expiry_date).diff(b.expiry_date, 's'),
                sortOrder: sortedInfo.columnKey === 'expiry_date' ? sortedInfo.order : null,
                render: (data: string, row: Mail) => {
                    if(!data) {
                        return "-";
                    }

                    if(row.is_claimed) {
                        return '-';
                    }

                    let date = moment(data);
                    return <div className="d-flex flex-column">
                        <span>{date.fromNow()}</span>
                        <span style={{fontSize: 10}}>{date.format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                },
            },
            {
                title: 'From',
                dataIndex: 'from_email',
                key: 'from_email',
                sorter: (a: Mail, b: Mail) => a.from_email > b.from_email? 1 : -1,
                sortOrder: sortedInfo.columnKey === 'from_email' ? sortedInfo.order : null,
            },
            {
                title: 'BCC To',
                dataIndex: 'bcc_to_email',
                key: 'bcc_to_email',
                sorter: false,
                sortOrder: null,
                render: (data: string) => {
                    return <Button onClick={() => {
                        copyToClipboard(data);
                        toast.success('Copied');
                    }}>Copy Email Address</Button>
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
                            <Button>
                                Check on solana.fm
                            </Button>
                        </a>
                    )
                },
            },
            {
                title: 'Value (USDC)',
                dataIndex: 'value_usd',
                key: 'value_usd',
                render: (data: string) => toLocaleDecimal(Number(data), 2, 2),
                sorter: (a: Mail, b: Mail) => (a.value_usd ?? 0) - (b.value_usd ?? 0),
                sortOrder: sortedInfo.columnKey === 'value_usd' ? sortedInfo.order : null,
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
                                <Button>
                                    Claim
                                </Button>
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
                            <Button>
                                Reply
                            </Button>
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
                /* children: (
                    <table
						className={`
							w-full bg-slate-700
							text-white
							table-fixed
						`}
					>
						<thead>
							<tr>
								<th>Expires In</th>
								<th>From</th>
								<th>Trigger Email</th>
								<th>Deposit Address</th>
								<th>Value (USDC)</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{
								pendingResponse.map((r, index) => (
									<tr key={`pending-response-${index}`}>
										<td>{columns[0].render? columns[0].render(r.expiry_date ?? "", r) : r.expiry_date}</td>
										<td>{columns[1].render? columns[1].render(r.from_email ?? "", r) : r.from_email}</td>
										<td>{columns[2].render? columns[2].render(r.bcc_to_email ?? "", r) : r.bcc_to_email}</td>
										<td>{columns[3].render? columns[3].render(r.tiplink_public_key ?? "", r) : r.tiplink_public_key}</td>
										<td>{columns[4].render? columns[4].render(r.value_usd?.toString() ?? "", r) : r.value_usd}</td>
										<td>{columns[5].render? columns[5].render(r.tiplink_url ?? "", r) : r.tiplink_url}</td>
									</tr>
								))
							}
						</tbody>
					</table>
                ) */
				children: (
                    <Table
						className='w-full'
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
						className='w-full'
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
						className='w-full'
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
                        className='w-full'
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
						inkBarColor: 'rgb(99,102,241)',
						itemSelectedColor: 'rgb(255,255,255)',
						itemColor: 'rgb(100,116,139)',
					},
					Table: {
						headerBg: 'rgb(51,65,85)',
						headerColor: 'white',
						headerSortActiveBg: 'rgb(30,41,59)',
						headerSortHoverBg: 'rgb(30,41,59)',
						colorBgContainer: 'rgb(71,85,105)',
						headerSplitColor: 'rgb(100,116,139)',
						borderColor: 'rgb(100,116,139)',
					},
					Empty: {
						colorText: 'white',
						colorTextDisabled: 'white',
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
						style={{
							zIndex: -1
						}}
					/>
				</div>
			</div>
		</ConfigProvider>
    );
};

export default Page;