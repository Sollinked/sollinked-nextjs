import { UserTag } from "../../types";

export type HomepageUser = {
    id: number;
    username: string;
    display_name: string;
    profile_picture?: string;
    value_usd: number;
    is_verified: boolean;
    tags?: UserTag[];
}