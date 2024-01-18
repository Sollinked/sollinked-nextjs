export const RESERVATION_STATUS_CANCELLED = -2;
export const RESERVATION_STATUS_BLOCKED = -1;
export const RESERVATION_STATUS_AVAILABLE = 0;
export const RESERVATION_STATUS_PENDING = 1;
export const RESERVATION_STATUS_PAID = 2;
export const RESERVATION_STATUS_CLAIMED = 3;
export const VERIFY_MESSAGE = `This message is to prove that you're the owner of this address!`;

//Token addresses
export const USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DECIMALS = 1000000;
export const SAMO_TOKEN_ADDRESS = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
export const SAMO_DECIMALS = 1_000_000_000;
export const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';
export const SOL_DECIMALS = 1_000_000_000;
export const MSOL_TOKEN_ADDRESS = 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So';
export const MSOL_DECIMALS = 1_000_000_000;
export const USDT_TOKEN_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
export const USDT_DECIMALS = 1_000_000;
export const BONK_TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
export const BONK_DECIMALS = 100_000;
export const WIF_TOKEN_ADDRESS = 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm';
export const WIF_DECIMALS = 1_000_000;
export const POPCAT_TOKEN_ADDRESS = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr';
export const POPCAT_DECIMALS = 1_000_000_000;
export const SILLY_TOKEN_ADDRESS = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs';
export const SILLY_DECIMALS = 1_000_000_000;

export const supportedTokens: {
    [key: string]: {
        address: string;
        decimals: number;
    }
} = {
    SOL: {
        address: SOL_TOKEN_ADDRESS,
        decimals: SOL_DECIMALS,
    },
    mSOL: {
        address: MSOL_TOKEN_ADDRESS,
        decimals: MSOL_DECIMALS,
    },
    USDC: {
        address: USDC_TOKEN_ADDRESS,
        decimals: USDC_DECIMALS,
    },
    USDT: {
        address: USDT_TOKEN_ADDRESS,
        decimals: USDT_DECIMALS,
    },
    SAMO: {
        address: SAMO_TOKEN_ADDRESS,
        decimals: SAMO_DECIMALS,
    },
    BONK: {
        address: BONK_TOKEN_ADDRESS,
        decimals: BONK_DECIMALS,
    },
    WIF: {
        address: WIF_TOKEN_ADDRESS,
        decimals: WIF_DECIMALS,
    },
    POPCAT: {
        address: POPCAT_TOKEN_ADDRESS,
        decimals: POPCAT_DECIMALS,
    },
    SILLY: {
        address: SILLY_TOKEN_ADDRESS,
        decimals: SILLY_DECIMALS,
    },
}