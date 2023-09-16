'use client';
import { useSollinked } from '@sollinked/sdk';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HomepageUser } from './types';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Link from 'next/link';
import { SearchOutlined } from '@ant-design/icons';
import { ellipsizeThis } from '@/common/utils';
import logo from '../../public/logo.png';

const Page = () => {
	const [users, setUsers] = useState<HomepageUser[]>([]);
	const [searchedUsers, setSearchedUsers] = useState<HomepageUser[]>([]);
	const [search, setSearch] = useState("");
	const { account } = useSollinked();
	const lastSearch = useRef("");

	const displayUsers = useMemo(() => {
		if(searchedUsers.length > 0) {
			return searchedUsers;
		}

		return users;
	}, [users, searchedUsers]);
	
	useEffect(() => {
		if(!account) {
			return;
		}

		const getData = async() => {
			let res = await account.getHomepageUsers();
			if(typeof res === 'string') {
				toast.error(res);
				return;
			}

			setUsers(res);
		}

		getData();
	}, [ account ]);
	

	useEffect(() => {
		if(!account) {
			return;
		}

		lastSearch.current = search;

		if(!search) {
			setSearchedUsers([]);
			return;
		}
		
		setTimeout(async() => {
			if(search !== lastSearch.current) {
				return;
			}

			if(!account.search) {
				return
			}

			let res = await account.search(search);
			if(typeof res === "string") {
				toast.error('Unable to search');
				return;
			}

			setSearchedUsers(res);
		}, 200);
	}, [search]);

	return (
		<div className={'min-h-[80vh] px-2 pb-10'}>
			<h1 className='mt-10 md:text-left text-center mb-5'>Get Connected on Sollinked</h1>
			<div
				className={`
					md:fixed top-3
					flex flex-row items-center justify-center
					rounded dark:border-slate-500 border-slate-400 border-[1px]
					dark:bg-slate-700 bg-white
					px-3 py-2 z-50
				`}
			>
				<SearchOutlined
					style={{
						fontSize: 20
					}}
				/>
				<input 
					type="text" 
					className={`
						flex-1 ml-2
						dark:bg-slate-700 bg-white outline-none
						md:transition-all md:duration-300 md:w-[200px] md:focus:w-[300px]
					`}
					placeholder='Name'
					onChange={({target: {value}}) => { setSearch(value)}}
				/>
			</div>
			<div className={`
				grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-2 gap-1
				pt-5
			`}>
			{
				displayUsers.map((user, index) => (
					<Link 
						href={`/user/${user.username}`}
						key={`user-${index}`}
						className={`
							flex flex-col justify-center items-center
							w-full
							rounded p-3
							dark:bg-slate-700 bg-white shadow
							dark:border-none border-[1px] border-slate-300
						`}
					>
						<Image
							src={user.profile_picture? user.profile_picture : logo}
							alt="null"
							width={125}
							height={125}
							className={`
								md:h-[125px] md:w-[125px] h-[75px] w-[75px]
								rounded-full dark:border-none border-2 border-black bg-slate-700
							`}
						/>
						<span className='mt-5 flex flex-row items-center justify-center'>
							<span>{ellipsizeThis(user.display_name ?? user.username, 12, 12)}</span>
							{
								user.is_verified &&
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-1 dark:text-yellow-300 text-yellow-700">
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
								</svg>
							}
						</span>
					</Link>
				))
			}
			</div>
			<div className='w-full px-2 mt-10 text-sm text-center'>Can't find the person you're looking for?<br />Try searching for them!</div>
		</div>
	);
};

export default Page;
