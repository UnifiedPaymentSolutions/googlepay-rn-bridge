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
export type CardAuthMethod =
  | 'PAN_ONLY' // Card number only
  | 'CRYPTOGRAM_3DS'; // 3D Secure authentication (recommended)

/**
 * Google Pay Error Codes
 */
export enum GooglePayErrorCodes {
  // Platform errors
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM', // iOS calls

  // Initialization errors
  INVALID_CONFIG = 'INVALID_CONFIG', // Missing config
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED', // SDK init failed

  // Payment errors
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED', // User cancelled
  PAYMENT_FAILED = 'PAYMENT_FAILED', // Payment failed
  INVALID_PAYMENT_DATA = 'INVALID_PAYMENT_DATA', // Invalid request
  NOT_INITIALIZED = 'NOT_INITIALIZED', // Not initialized
  PAYMENT_ERROR = 'PAYMENT_ERROR', // General error
  PAYMENT_PARSE_ERROR = 'PAYMENT_PARSE_ERROR', // Parse error

  // Service errors
  GOOGLE_PAY_UNAVAILABLE = 'GOOGLE_PAY_UNAVAILABLE', // Service unavailable
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
  locality: string; // City (e.g., 'Tallinn')
  administrativeArea: string; // County (e.g., 'Harju County')
  countryCode: string; // 'ET' for Estonia
  postalCode: string; // Estonian postal code (5 digits)
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
  countryCode?: string; // Default: 'ET' (Estonia)
  currencyCode?: string; // Default: 'EUR' (Euro)
  allowedCardNetworks?: CardNetwork[]; // Default: ['VISA', 'MASTERCARD']
  allowedCardAuthMethods?: CardAuthMethod[]; // Default: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
}

/**
 * Payment request data
 */
export interface PaymentData {
  transactionId?: string; // Optional transaction ID
  amount: string; // Payment amount as string (e.g., "29.99")
  currencyCode: string; // Currency code (e.g., "EUR")
  countryCode?: string; // Country code (default from config or "ET")
  merchantInfo?: MerchantInfo; // Merchant info (optional, uses config if not provided)
  allowedPaymentMethods?: PaymentMethod[]; // Payment methods (optional, uses config defaults)
}

/**
 * Card information from payment result
 */
export interface CardInfo {
  cardNetwork: string; // 'VISA' or 'MASTERCARD'
  cardDetails: string; // Last 4 digits
}

/**
 * Tokenization data from payment result
 */
export interface TokenizationData {
  type: string;
  token: string; // Payment token for processing
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
  token: string; // EveryPay payment token
  paymentMethodData: PaymentMethodData;
  shippingAddress?: Address;
  email?: string;
}

/**
 * Estonian market specific configuration defaults
 */
export const EstonianDefaults = {
  COUNTRY_CODE: 'ET',
  CURRENCY_CODE: 'EUR',
  ALLOWED_CARD_NETWORKS: ['VISA', 'MASTERCARD'] as CardNetwork[],
  ALLOWED_AUTH_METHODS: ['CRYPTOGRAM_3DS'] as CardAuthMethod[], // Recommended for security
  GATEWAY: 'everypay',
} as const;

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
