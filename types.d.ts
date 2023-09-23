import { Webhook } from "./Pages/Integration/types";

export type ApiResult<T> = {
    success: boolean;
    message?: string;
    data?: T
}

export type UserTier = {
    id?: number;
    value_usd: number;
    respond_days: number;
}

export type UserReservationSetting = {
    user_id: number;
    day: number;
    hour: number;
    reservation_price: number;
}

export type UserReservation = {
    date: string;
    user_id: number;
    reservation_price?: number;
    reserve_email?: string;
    reserved_at?: string;
    reserve_title?: string;
    tiplink_url?: string;
    tiplink_public_key: string;
    value_usd?: number;
    status: number;
}

export type Mail = {
    key: number;
    user_id: number;
    from_email: string;
    to_email: string;
    bcc_to_email?: string;
    message_id: string;
    tiplink_url: string;
    tiplink_public_key: string;
    is_processed: boolean;
    has_responded: boolean;
    is_claimed: boolean;
    created_at: string;
    processed_at?: string;
    value_usd?: number;
    expiry_date?: string;
}

export type UserGithubSetting = {
    id: number;
    user_id: number;
    repo_link: string;
    uuid: string;
    last_synced_at?: string;
    is_active: boolean;
    behavior: "mark" | "close";
    whitelists: string[];
    tiers: UserGithubTier[];
    logs: UserGithubIssueLog[];
}

export type UserGithubTier = {
    id: number;
    user_github_id: number;
    value_usd: number;
    label: string;
    color: string;
}

export type UserGithubIssueLog = {
    id: number;
    user_github_id: number;
    value_usd: string;
    tx_hash: string;
    from_user: string;
    from_email: string;
    title: string;
    body: string;
}

export type MailingList = {
    id: number;
    user_id: number;
    product_id: string;
    tiers: MailingListPriceTier[];
}

export type MailingListPriceTier = {
    id: number;
    mailing_list_id: number;
    price_id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    charge_every: number;
    prepay_month: number;
    is_active: boolean;
}

export type User = {
    id: number;
    address: string;
    username: string;
    calendar_advance_days: number;
    display_name: string;
    email_address: string;
    profile_picture: string;
    facebook: string;
    instagram: string;
    twitter: string;
    twitch: string;
    tiktok: string;
    youtube: string;
    tiers?: UserTier[];
    mails?: Mail[];
    mailingList?: MailingList;
    reservations?: UserReservation[];
    reservationSettings?: UserReservationSetting[];
    webhooks?: Webhook[];
    githubSettings?: UserGithubSetting[];
    is_verified: boolean;
}

export type PublicUser = {
    username: string;
    display_name: string;
    profile_picture?: string;
    facebook: string;
    instagram: string;
    twitter: string;
    twitch: string;
    tiktok: string;
    youtube: string;
    calendar_advance_days: number;
    tiers?: UserTier[];
    is_verified: boolean;
}

export type ContextUser = {
    user: User;
    getData: () => void;
    signature?: string;
}