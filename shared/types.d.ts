export interface ShoplineAuthParams {
    appkey: string;
    handle: string;
    timestamp: string;
    sign: string;
}
export interface ShoplineTokenResponse {
    success: boolean;
    data?: {
        accessToken: string;
        expireTime: string;
        refreshToken: string;
        refreshExpireTime: string;
        scope: string;
    };
    error?: string;
}
export interface ShoplineWebhookHeaders {
    'x-shopline-topic': string;
    'x-shopline-hmac-sha256': string;
    'x-shopline-shop-domain': string;
    'x-shopline-shop-id': string;
    'x-shopline-merchant-id': string;
    'x-shopline-api-version': string;
    'x-shopline-webhook-id': string;
}
export interface ShoplineWebhookPayload {
    [key: string]: any;
}
export interface StoreInfo {
    id: string;
    shoplineId: string;
    handle?: string;
    name?: string;
    domain?: string;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
//# sourceMappingURL=types.d.ts.map