'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRPCEndpoint, sendTokensTo, toLocaleDecimal } from '../../../common/utils';
import _ from 'lodash';
import { ToastContainer, toast } from 'react-toastify';
import { UserGithubTier } from '../../../../types';
import { Button, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TextArea from 'antd/es/input/TextArea';
import { Connection, GetProgramAccountsFilter, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { SignerWalletAdapterProps, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSollinked } from '@sollinked/sdk';

const USDC_TOKEN_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 1000000;
const Page = ({ params: { repolink }}: { params: { repolink: string[] }}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [paymentAddress, setPaymentAddress] = useState("");
    const [tiers, setTiers] = useState<UserGithubTier[]>();
    
    const { github } = useSollinked();
    
    const [isPaying, setIsPaying] = useState(false);
    const wallet = useWallet();
    const connection = useMemo(() => {
      return new Connection(getRPCEndpoint());
    }, []);

    const [owner, repo] = useMemo(() => {
      return repolink;
    }, [repolink])

    //inputs
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [fromUser, setFromUser] = useState("");
    const [fromEmail, setFromEmail] = useState("");

    // whenever user updates
    useEffect(() => {
        const getData = async() => {
            if(!owner || !repo) {
                return;
            }

            if(!github) {
              return;
            }

            // public profile only
            let res = await github.get(owner, repo);
            
            if(!res.data || !res.data.data) {
                toast.error("Unable to get user");
                setIsLoading(false);
                return;
            }

            if(!res.data.success) {
                toast.error("Unable to get user");
                setIsLoading(false);
                return;
            }

            setTiers(res.data.data.tiers);
            setPaymentAddress(res.data.data.address);
            setIsLoading(false);
        }

        getData();
    }, [ owner, repo, github ]);

    //get associated token accounts that stores the SPL tokens
    const getTokenAccounts = useCallback(async(address: string) => {
      try {
        const filters: GetProgramAccountsFilter[] = [
            {
              dataSize: 165,    //size of account (bytes), this is a constant
            },
            {
              memcmp: {
                offset: 32,     //location of our query in the account (bytes)
                bytes: address,  //our search criteria, a base58 encoded string
              },            
            }];
  
        const accounts = await connection.getParsedProgramAccounts(
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), //Associated Tokens Program
            {filters: filters}
        );
  
        /* accounts.forEach((account, i) => {
            //Parse the account data
            const parsedAccountInfo:any = account.account.data;
            const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
            const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
            //Log results
            console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
            console.log(`--Token Mint: ${mintAddress}`);
            console.log(`--Token Balance: ${tokenBalance}`);
        }); */
        return accounts;
      }
  
      catch {
        return [];
      }
    }, [connection]);

    const onPayClick = useCallback(async(amount: number) => {
      if(!title) {
        toast.error('Please set the title');
        return;
      }

      if(!body) {
        toast.error('Please fill up the message');
        return;
      }

      if(!github) {
        return;
      }

        try {
          setIsPaying(true);

          let signature = await sendTokensTo(wallet, paymentAddress, USDC_TOKEN_ADDRESS, USDC_DECIMALS, amount);
        
          await github.newIssue({
            repo_link: `/${owner}/${repo}`,
            txHash: signature,
            title,
            body,
            fromEmail,
            fromUser
          });

          toast.success("Created Issue");
          setTitle("");
          setBody("");
          setIsPaying(false);
    
        } catch (error: any) {
          if(error.name === "WalletNotConnectedError") {
            toast.error('Please connect your wallet!');
            setIsPaying(false);
            return;
          }

          if(error.message.includes("Not enough")) {
            toast.error('Insufficient Balance');
            setIsPaying(false);
            return;
          }

          console.log(error);
          toast.error('Unable to make payment');
          setIsPaying(false);
        }
        setIsPaying(false);

    }, [connection, wallet, getTokenAccounts, paymentAddress, fromEmail, fromUser, title, body, owner, repo, github]);


    if(isLoading) {
        return (
          <div className="h-[80vh] w-full flex items-center justify-center">
            <LoadingOutlined style={{ fontSize: 80 }}/>
        </div>)
    }


    return (
        <div className={`flex flex-col`}>
            <strong className={`flex flex-col justify-center items-center`}>
              <span>New Issue</span> 
              <span>/{owner}/{repo}</span> 
            </strong>

            <div className={`
              w-full flex flex-col space-y-2 mb-2 mt-10
            `}>
                <input 
                  className={`
                    dark:bg-slate-800 rounded
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none
                  `} 
                    placeholder='Your Github Username (Optional)'
                    onChange={({ target: {value}}) => setFromUser(value)}
                    value={fromUser}
                    disabled={isPaying}
                />
                <input 
                  className={`
                    dark:bg-slate-800 rounded
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none
                  `} 
                    placeholder='Your Email (Optional)'
                    onChange={({ target: {value}}) => setFromEmail(value)}
                    value={fromEmail}
                    disabled={isPaying}
                />
                <input 
                  className={`
                    dark:bg-slate-800 rounded
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none
                  `} 
                    placeholder='Title'
                    onChange={({ target: {value}}) => setTitle(value)}
                    value={title}
                    disabled={isPaying}
                />
                <textarea 
                  className={`
                    dark:bg-slate-800 rounded min-h-[30vh]
                    px-3 py-2
                    dark:border-none border-[1px] border-slate-300
                    outline-none
                  `} 
                    placeholder="Message (Supports Markdown)"
                    onChange={({ target: {value}}) => setBody(value)}
                    value={body}
                    disabled={isPaying}
                />
            </div>
            <div className={`
              flex flex-row justify-end space-x-2
            `}>
                {
                  isPaying &&
                  <div className={`mr-5 items-center justify-center md:flex hidden`}>
                    <LoadingOutlined/>
                  </div>
                }
                {
                    tiers?.map((x, index) => (
                        <button 
                            key={`book-button-${index}`}
                            onClick={() => { onPayClick(x.value_usd) }}
                            disabled={isPaying}
                            className={`
                              dark:bg-indigo-800 rounded px-3 py-2 text-xs
                              dark:border-none shadow border-[1px] border-slate-300
                            `}
                        >{x.label} (${toLocaleDecimal(x.value_usd, 2, 2)})
                        </button>
                    ))
                }
            </div>
            {
              isPaying &&
              <div className={`w-full items-center justify-center mt-10 md:hidden flex`}>
                <LoadingOutlined/>
              </div>
            }
        </div>
    );
}

export default Page;