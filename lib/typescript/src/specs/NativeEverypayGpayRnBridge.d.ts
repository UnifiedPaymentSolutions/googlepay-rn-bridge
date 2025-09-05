import type { TurboModule } from 'react-native';
export interface GooglePayRequest {
    apiVersion: number;
    apiVersionMinor: number;
    allowedPaymentMethods: Array<{
        type: string;
        parameters: {
            allowedAuthMethods: string[];
            allowedCardNetworks: string[];
        };
    }>;
    merchantInfo: {
        merchantId: string;
        merchantName: string;
    };
    transactionInfo: {
        totalPriceStatus: string;
        totalPriceLabel: string;
        totalPrice: string;
        currencyCode: string;
        countryCode: string;
    };
}
export interface Spec extends TurboModule {
    init(environment: string, allowedCardNetworks: string[], allowedCardAuthMethods: string[]): Promise<boolean>;
    isReadyToPay(): Promise<boolean>;
    loadPaymentData(request: GooglePayRequest): Promise<string>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeEverypayGpayRnBridge.d.ts.map