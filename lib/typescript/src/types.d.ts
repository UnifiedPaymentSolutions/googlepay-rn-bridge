/**
 * Google Pay Environment constants
 */
export type GooglePayEnvironment = 'TEST' | 'PRODUCTION';
/**
 * Supported card networks for Estonian market
 */
export type CardNetwork = 'MASTERCARD' | 'VISA';
/**
 * Card authentication methods
 */
export type CardAuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
/**
 * Google Pay Error Codes
 */
export declare enum GooglePayErrorCodes {
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM', // iOS calls
  INVALID_CONFIG = 'INVALID_CONFIG', // Missing config
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED', // SDK init failed
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED', // User cancelled
  PAYMENT_FAILED = 'PAYMENT_FAILED', // Payment failed
  INVALID_PAYMENT_DATA = 'INVALID_PAYMENT_DATA', // Invalid request
  NOT_INITIALIZED = 'NOT_INITIALIZED', // Not initialized
  PAYMENT_ERROR = 'PAYMENT_ERROR', // General error
  PAYMENT_PARSE_ERROR = 'PAYMENT_PARSE_ERROR', // Parse error
  GOOGLE_PAY_UNAVAILABLE = 'GOOGLE_PAY_UNAVAILABLE',
}
/**
 * Google Pay specific error interface
 */
export interface GooglePayError extends Error {
  code: GooglePayErrorCodes | string;
  message: string;
  details?: any;
}
/**
 * Address information for shipping/billing
 */
export interface Address {
  name: string;
  address1: string;
  address2?: string;
  locality: string;
  administrativeArea: string;
  countryCode: string;
  postalCode: string;
  phoneNumber?: string;
}
/**
 * Merchant information
 */
export interface MerchantInfo {
  merchantId: string;
  merchantName: string;
}
/**
 * Tokenization specification for payment gateway
 */
export interface TokenizationSpecification {
  type: 'PAYMENT_GATEWAY';
  parameters: {
    gateway: string;
    gatewayMerchantId: string;
  };
}
/**
 * Payment method configuration
 */
export interface PaymentMethod {
  type: 'CARD';
  parameters: {
    allowedCardNetworks: CardNetwork[];
    allowedAuthMethods: CardAuthMethod[];
  };
  tokenizationSpecification: TokenizationSpecification;
}
/**
 * Google Pay configuration
 */
export interface GooglePayConfig {
  environment: GooglePayEnvironment;
  merchantId: string;
  merchantName: string;
  countryCode?: string;
  currencyCode?: string;
  allowedCardNetworks?: CardNetwork[];
  allowedCardAuthMethods?: CardAuthMethod[];
}
/**
 * Payment request data
 */
export interface PaymentData {
  transactionId?: string;
  amount: string;
  currencyCode: string;
  countryCode?: string;
  merchantInfo?: MerchantInfo;
  allowedPaymentMethods?: PaymentMethod[];
}
/**
 * Card information from payment result
 */
export interface CardInfo {
  cardNetwork: string;
  cardDetails: string;
}
/**
 * Tokenization data from payment result
 */
export interface TokenizationData {
  type: string;
  token: string;
}
/**
 * Payment method data from result
 */
export interface PaymentMethodData {
  type: string;
  description: string;
  info: CardInfo;
  tokenizationData: TokenizationData;
}
/**
 * Payment result from successful Google Pay transaction
 */
export interface PaymentResult {
  token: string;
  paymentMethodData: PaymentMethodData;
  shippingAddress?: Address;
  email?: string;
}
/**
 * Estonian market specific configuration defaults
 */
export declare const EstonianDefaults: {
  readonly COUNTRY_CODE: 'ET';
  readonly CURRENCY_CODE: 'EUR';
  readonly ALLOWED_CARD_NETWORKS: CardNetwork[];
  readonly ALLOWED_AUTH_METHODS: CardAuthMethod[];
  readonly GATEWAY: 'everypay';
};
export interface GooglePayButtonConfig {
  apiUsername: string;
  apiSecret: string;
  apiUrl: string;
  environment: GooglePayEnvironment;
  countryCode: string;
  currencyCode?: string;
  accountName: string;
  allowedCardNetworks?: CardNetwork[];
  allowedCardAuthMethods?: CardAuthMethod[];
}
export interface GooglePayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: Array<{
    type: string;
    parameters: {
      allowedAuthMethods: string[];
      allowedCardNetworks: string[];
    };
    tokenizationSpecification: {
      type: string;
      parameters: {
        gateway: string;
        gatewayMerchantId: string;
      };
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
export interface EveryPayGooglePayError extends Error {
  code: string;
  message: string;
  details?: any;
}
export interface PaymentProcessResponse {
  state: string;
  error?: EveryPayGooglePayError;
}
//# sourceMappingURL=types.d.ts.map
