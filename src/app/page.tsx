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
	}, [search, account]);

	return (
		<div className={'min-h-[80vh] px-2 pb-10'}>
			<h1 className='md:text-left text-center mb-5' style={{ fontSize: 30 }}>Announcements</h1>
			<ul>
				<li>
					<div style={{textDecoration: 'underline'}}>Feb 1, 2024</div>
					<ul className='ml-10' style={{
						listStyle: 'decimal'
					}}>
						<li>Separated retail and superuser pages</li>
						<li>UI Overhaul</li>
					</ul>
				</li>
			</ul>
		</div>
	);
};

export default Page;
