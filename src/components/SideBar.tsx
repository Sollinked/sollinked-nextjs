'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSollinked } from '@sollinked/sdk';
import { useMemo } from 'react';
import moment from 'moment';
import { ellipsizeThis } from '@/common/utils';
import { CloseOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { RESERVATION_STATUS_PAID } from '@/common/constants';
import logo from '../../public/logo.png';

type LinkParams = {
    link: string;
    text: string;
    active?: boolean;
    notification?: boolean;
  }
  
const SideBarItem = ({ link, text, active, notification }: LinkParams) => {
    return (
      <Link href={link}>
        <div className={`
          w-100 
          ${active? `border-l-[2px] border-indigo-500 dark:text-white text-black`: `border-l-[1px] dark:border-zinc-700 border-zinc-400 dark:text-slate-500 text-slate-400`}
          ml-5 pl-5 py-2 mt-2
          flex flex-row items-center
        `}>
          {text}
          {
            notification &&
            <span className='ml-3 w-2 h-2 rounded-full bg-red-500'></span>
          }
        </div>
      </Link>
    )
}

type SidebarParams = {
  isActive?: boolean;
  onCloseClick: () => void;
}
  
const SideBar = ({ isActive, onCloseClick }: SidebarParams) => {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    let { user } = useSollinked();

    const hasUnrespondedMail = useMemo(() => {
      if(!user) {
        return false;
      }

      if(!user.mails) {
        return false;
      }

      if(user.mails.length === 0) {
        return false;
      }

      return user.mails.filter(x => (
        x.is_processed &&
        x.value_usd &&
        !x.has_responded && 
        !x.is_claimed && 
        moment(x.expiry_date).isAfter(moment())
      )).length > 0;
    }, [ user ]);

    const hasUnclaimedReservation = useMemo(() => {
      if(!user) {
        return false;
      }

      if(!user.reservations) {
        return false;
      }

      if(user.reservations.length === 0) {
        return false;
      }

      return user.reservations.filter(x => x.status === RESERVATION_STATUS_PAID).length > 0;
    }, [ user ]);
  
    return (
      <>
        {/* Veil */}
        <div
          className={`md:hidden ${isActive? '' : 'hidden'} bg-gray-950/70 fixed h-screen w-screen z-40`}
        >
          <button className='h-full w-full' onClick={onCloseClick}>

          </button>
        </div>
        <div className={`
          md:relative fixed left-0
          flex flex-col flex-1 md:w-[0px] md:min-w-[250px] w-3/4 h-screen
          md:border-r-[0.5px] md:border-indigo-500
          md:translate-x-0 ${isActive? 'translate-x-[0vw]' : 'translate-x-[-75vw]'} transition-all
          z-50 
          dark:bg-gray-950 bg-zinc-50 dark:text-white text-black
        `}>
          <div className={`
            flex flex-row pl-3 items-center
            dark:bg-slate-700 bg-indigo-200
            h-[60px]
          `}>
            <Image
              src={user.profile_picture? user.profile_picture : logo}
              alt="null"
              width={30}
              height={30}
              className={`
                h-10 w-10 rounded-full dark:border-none border-2 border-black bg-slate-700
              `}
            />
            <strong className='ml-3 w-full'>
              { user.display_name? ellipsizeThis(user.display_name, 15, 0) : "User" }
            </strong>
            <button
              className='md:hidden h-10 w-10 mr-4'
              onClick={onCloseClick}
            >
              <CloseOutlined/>
            </button>
          </div>
          <div className="mt-5"></div>
          <SideBarItem
            link="/"
            text="Home"
            active={pathname === "/"}
          />
          <SideBarItem
            link="/email"
            text="Email"
            active={pathname === "/email"}
            notification={hasUnrespondedMail}
          />
          <SideBarItem
            link="/broadcast"
            text="Broadcast"
            active={pathname.search(/\/broadcast/g) !== -1}
          />
          <SideBarItem
            link="/content"
            text="Blog"
            active={pathname.search(/\/content/g) !== -1}
          />
          <SideBarItem
            link="/calendar"
            text="Calendar"
            active={pathname === "/calendar"}
            notification={hasUnclaimedReservation}
          />
          {/* <SideBarItem
            link="/chat"
            text="Chat"
            active={pathname === "/chat"}
          /> */}
          <SideBarItem
            link="/webhooks"
            text="Webhooks"
            active={pathname === "/webhooks"}
          />
          <SideBarItem
            link="/settings"
            text="Settings"
            active={pathname === "/settings"}
          />
          <button
            className={`
              absolute md:bottom-5 bottom-[65px] left-[45%]
              h-5 w-5
            `}
            onClick={toggleTheme}
          >
            {
              theme === "light"?
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg> :
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            }
          </button>
        </div>
      </>
    )
}

export default SideBar;