import GooglePayButton from './GooglePayButton';
import type { GooglePayButtonConfig, EveryPayGooglePayError, PaymentProcessResponse, GooglePayEnvironment, CardNetwork, CardAuthMethod } from './types';
export declare const init: (environment: string, allowedCardNetworks: string[], allowedCardAuthMethods: string[]) => Promise<boolean>, isReadyToPay: () => Promise<boolean>, loadPaymentData: (request: import("./specs/NativeEverypayGpayRnBridge").GooglePayRequest) => Promise<string>;
export { GooglePayButton };
export type { GooglePayButtonConfig, EveryPayGooglePayError, PaymentProcessResponse, GooglePayEnvironment, CardNetwork, CardAuthMethod, };
//# sourceMappingURL=index.d.ts.map