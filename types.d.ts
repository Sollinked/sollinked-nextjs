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
    wallet_id: string;
    tiers: MailingListPriceTier[];
}

export type PastBroadcast = {
    id: number;
    user_id: number;
    username: string;
    title: string;
    created_at: string;
}

export type MailingListPriceTier = {
    id: number;
    mailing_list_id: number;
    price_id: string;
    paymentlink_id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    charge_every: number;
    prepay_month: number;
    subscriber_count: number;
    is_active: boolean;

    // generated
    username?: string;
    past_broadcasts: PastBroadcast[];
}

export type Content = {
    id: number;
    user_id: number;
    content_pass_ids: number[];
    content: string;
    title: string;
    slug: string;
    description: string;
    value_usd: number;
    is_free: boolean;
    status: 'draft' | 'published';
    deleted_at?: string;
    updated_at: string;

    // generated
    contentPasses?: ContentPass[];
}

export type ContentPass = {
    id: number;
    user_id: number;
    name: string;
    description: string;
    amount: number; // limited amount
    value_usd: number; // price per pass
    cnft_count: number; // how many miinted
}

export type ContentCNFT = {
    id: number;
    mint_address: string;
    nft_id: number;
    content_pass_id: number;
    created_at: string;
}

export type MailingListBroadcast = {
    id: number;
    user_id: number;
    title: string;
    content: string;
    created_at: string;
    execute_at: string;
    is_executing: boolean;
    is_draft: boolean;
    updated_at: string;
    tier_ids?: number[];
    success_count: number;
    total_count: number;
}

export type MailingListSubscriber = {
    id: number;
    mailing_list_price_tier_id: number;
    user_id: number;
    price_id: string;
    value_usd: number;
    email_address: string;
    expiry_date: string;
    is_cancelled: boolean;

    // generated
    price_tier?: MailingListPriceTier;
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
    broadcasts?: MailingListBroadcast[];
    subscriptions?: MailingListSubscriber[];
    reservations?: UserReservation[];
    reservationSettings?: UserReservationSetting[];
    contents?: Content[];
    contentPasses?: ContentPass[];
    webhooks?: Webhook[];
    githubSettings?: UserGithubSetting[];
    is_verified: boolean;
    tags?: UserTag[];
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
    mailingList?: MailingList;
    contents?: Content[];
    contentPasses?: ContentPass[];
    is_verified: boolean;
    tags?: UserTag[];
}

export type UserTag = {
    user_id: number;
    name: string;
}

export type ContextUser = {
    user: User;
    getData: () => void;
    signature?: string;
}