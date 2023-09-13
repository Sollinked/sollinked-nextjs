export type IntegrationButtonType = "discord" | "custom";

export type WebhookType = "discord" | "custom";
export type WebhookStatus = "active" | "inactive";
export type Webhook = {
    id: number;
    user_id: number;
    type: WebhookType;
    value: string;
    template: string;
    status: WebhookStatus;
    created_at: string;
    updated_at: string;
}