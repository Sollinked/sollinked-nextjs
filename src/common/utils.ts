import { SignerWalletAdapterProps, WalletNotConnectedError, WalletNotReadyError } from '@solana/wallet-adapter-base';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, GetProgramAccountsFilter, PublicKey, Transaction, TransactionInstruction, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';
import moment, { Moment } from 'moment';

export function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

/**
 * Returns the number with 'en' locale settings, ie 1,000
 * @param x number
 * @param minDecimal number
 * @param maxDecimal number
 */
 export function toLocaleDecimal(x: number | string, minDecimal: number, maxDecimal: number) {
    x = Number(x);
    return x.toLocaleString('en', {
        minimumFractionDigits: minDecimal,
        maximumFractionDigits: maxDecimal,
    });
}

/**
 * Runs the function if it's a function, returns the result or undefined
 * @param fn
 * @param args
 */
export const runIfFunction = (fn: any, ...args: any): any | undefined => {
    if(typeof(fn) == 'function'){
        return fn(...args);
    }

    return undefined;
}

/**
 * Returns the ellipsized version of string
 * @param x string
 * @param leftCharLength number
 * @param rightCharLength number
 */
export function ellipsizeThis(x: string, leftCharLength: number, rightCharLength: number) {
    if(!x) {
        return x;
    }

    let totalLength = leftCharLength + rightCharLength;

    if(totalLength >= x.length) {
        return x;
    }

    return x.substring(0, leftCharLength) + "..." + x.substring(x.length - rightCharLength, x.length);
}

/**
 * Returns the new object that has no reference to the old object to avoid mutations.
 * @param obj
 */
export const cloneObj = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @returns string
 */
export const getRandomColor = () => {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const getRandomNumber = (min: number, max: number, isInteger = false) => {
    let rand = min + (Math.random() * (max - min));
    if(isInteger) {
        rand = Math.round(rand);
    }

    else {
        // to 3 decimals
        rand = Math.floor(rand * 1000) / 1000;
    }

    return rand;
}

export const getRandomChance = () => {
    return getRandomNumber(0, 100);
}

export const getRandomNumberAsString = (min: number, max: number, isInteger = false) => {
    return getRandomNumber(min, max, isInteger).toString();
}

export const getRandomChanceAsString = () => {
    return getRandomNumberAsString(0, 100);
}

export const getUTCMoment = () => {
    return moment().utc();
}

export const getUTCDatetime = () => {
    return getUTCMoment().format('YYYY-MM-DD HH:mm:ss');
}

export const getUTCDate = () => {
    return getUTCMoment().format('YYYY-MM-DD');
}

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_BASE_URL!;
}

export const getDappDomain = () => {
    return process.env.NEXT_PUBLIC_DAPP_DOMAIN!;
}

export const getWsUrl = () => {
    return process.env.NEXT_PUBLIC_WS_URL!;
}

export const getEmailDomain = () => {
    return process.env.NEXT_PUBLIC_EMAIL_DOMAIN!;
}

export const getRPCEndpoint = (): string => {
    return process.env.NEXT_PUBLIC_RPC_URL? process.env.NEXT_PUBLIC_RPC_URL : clusterApiUrl("devnet");
}

export const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
}

export const ucFirst = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const isWeekend = (moment: Moment) => {
    let day = moment.get('day');
    return day === 5 || day === 6; // friday or saturday
}

// converts the day of week and hour to utc time
export const convertToLocalDayAndHour = (day: number, hour: number) => {
    let hourOffset = moment().utcOffset() / 60;
    hour = hour + hourOffset;
            
    if(hour > 23) {
        day++;
        hour -= 24;
    }

    // 
    day = day > 6? 0 : day;
    return { day, hour };
}

// converts the day of week and hour to the local time
export const convertToUtcDayAndHour = (day: number, hour: number) => {
    let hourOffset = moment().utcOffset() / 60;
    hour = hour - hourOffset;
            
    if(hour < 0) {
        day--;
        hour += 24;
    }

    // 
    day = day < 0? 6 : day;
    return { day, hour };
}

// wallet utils
//get associated token accounts that stores the SPL tokens
const getTokenAccounts = async(connection: Connection, address: string) => {
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

        return accounts;
    }

    catch {
        return [];
    }
}
export const getUserTokens = async(connection: Connection, userAccount: PublicKey) => {
    let mintObject: {[mintAddress: string]: number} = {};
    let userAccounts = await getTokenAccounts(connection, userAccount.toString());
    for(let account of userAccounts) {
      let anyAccount = account.account as any;
      let mint: string = anyAccount.data["parsed"]["info"]["mint"];
      let accountAmount: number = anyAccount.data["parsed"]["info"]["tokenAmount"]["uiAmount"];

      mintObject[mint] = accountAmount;
    }

    return mintObject;
}

export const getAddressTokenBalance = async(connection: Connection, tokenPublicKey: string, publicKey: string) => {
    const balances = await getUserTokens(connection, new PublicKey(publicKey));
    return balances[tokenPublicKey] ?? 0;
}

export const configureAndSendCurrentTransaction = async (
  transaction: Transaction,
  connection: Connection,
  feePayer: PublicKey,
  signTransaction: SignerWalletAdapterProps['signTransaction']
) => {
  const blockHash = await connection.getLatestBlockhash();
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockHash.blockhash;
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
    signature
  });
  return signature;
};

export const sendTokensTo = async(wallet: WalletContextState, sendTo: string, token: string, tokenDecimals: number, amount: number) => {
    let { publicKey, signTransaction } = wallet;
    if (!publicKey || !signTransaction) {
      throw new WalletNotConnectedError();
    }

    const connection = new Connection(getRPCEndpoint());

    //check if user has bonks
    let usdcAmount = await getAddressTokenBalance(connection, token, publicKey.toBase58())

    if(usdcAmount < amount) {
      // await swapUSDC();
      throw new Error("Not enough USDC");
    }

    const mintToken = new PublicKey(token);
    const recipientAddress = new PublicKey(sendTo);

    const transactionInstructions: TransactionInstruction[] = [];

    // get the sender's token account
    const associatedTokenFrom = await getAssociatedTokenAddress(
      mintToken,
      publicKey
    );

    const fromAccount = await getAccount(connection, associatedTokenFrom);
    let {
        associatedTokenTo,
        transaction: createTransaction,
    } = await getOrCreateAssociatedAccount(mintToken, publicKey, recipientAddress);

    if(createTransaction) {
        transactionInstructions.push(createTransaction);
    }

    // the actual instructions
    transactionInstructions.push(
      createTransferInstruction(
        fromAccount.address, // source
        associatedTokenTo, // dest
        publicKey,
        amount * tokenDecimals,
      )
    );

    // send the transactions
    const transaction = new Transaction().add(...transactionInstructions);
    const signature = await configureAndSendCurrentTransaction(
      transaction,
      connection,
      publicKey,
      signTransaction
    );

    return signature;
}

// return associatedTokenAddress and transaction
// if associatedTokenAddress exists, transaction is null
export const getOrCreateAssociatedAccount = async(mintToken: PublicKey, payer: PublicKey, recipient: PublicKey) => {
    const connection = new Connection(getRPCEndpoint());

    // get the recipient's token account
    const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipient
    );

    let transaction = null;

    // if recipient doesn't have token account
    // create token account for recipient
    if (!(await connection.getAccountInfo(associatedTokenTo))) {
        console.log(recipient.toString());
        console.log(await connection.getAccountInfo(associatedTokenTo));
        transaction =
            createAssociatedTokenAccountInstruction(
                payer,
                associatedTokenTo,
                recipient,
                mintToken
            );
    }

    return {
        associatedTokenTo,
        transaction,
    };
}


// quote response = response from jupiter
export const swapAndSendTo = async(wallet: WalletContextState, mintToken: PublicKey, recipient: PublicKey, quoteResponse: any) => {
    if(!wallet) {
        throw new WalletNotReadyError();
    }
    let { publicKey, signTransaction } = wallet;
    if (!publicKey || !signTransaction) {
        throw new WalletNotConnectedError();
    }

    // get associated account
    let {
        associatedTokenTo,
        transaction: createTransaction
    } = await getOrCreateAssociatedAccount(mintToken, wallet.publicKey!, recipient);

    const transactions = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse,
            // Bob will receive the 5 USDC
            destinationTokenAccount: associatedTokenTo.toString(),
            userPublicKey: wallet.publicKey!.toString(),
          })
        })
      ).json();
      
      const { swapTransaction } = transactions;
      let txBuf = Buffer.from(swapTransaction, 'base64');
      let tx = VersionedTransaction.deserialize(txBuf);
      const connection = new Connection(getRPCEndpoint(), "confirmed");

      const transactionInstructions: TransactionInstruction[] = [];
      if(createTransaction) {
        console.log(createTransaction);
        transactionInstructions.push(createTransaction);
        const transaction = new Transaction().add(...transactionInstructions);
        const signature = await configureAndSendCurrentTransaction(
          transaction,
          connection,
          wallet.publicKey!,
          signTransaction
        );
      }

      const blockHash = await connection.getLatestBlockhash('confirmed');
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction({
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
          signature,
      });
      console.log(signature);
      return signature;
}