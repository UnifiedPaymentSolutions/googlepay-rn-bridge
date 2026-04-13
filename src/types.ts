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
 * Estonian market specific configuration defaults
 */
export const EstonianDefaults = {
  COUNTRY_CODE: 'EE',
  CURRENCY_CODE: 'EUR',
  ALLOWED_CARD_NETWORKS: ['VISA', 'MASTERCARD'] as CardNetwork[],
  ALLOWED_AUTH_METHODS: ['CRYPTOGRAM_3DS'] as CardAuthMethod[], // Recommended for security
  GATEWAY: 'everypay',
} as const;

/**
 * ========== NEW SDK-BASED TYPES ==========
 */

/**
 * EveryPay configuration for SDK integration
 * Supports both Backend and SDK modes
 */
export interface EverypayConfig {
  environment: GooglePayEnvironment;
  countryCode: string;
  // SDK mode fields (optional - required only for SDK mode)
  apiUsername?: string;
  apiSecret?: string;
  apiUrl?: string;
  accountName?: string;
  customerUrl?: string;
  // Common fields
  currencyCode?: string;
  allowedCardNetworks?: CardNetwork[];
  allowedCardAuthMethods?: CardAuthMethod[];
  // Token request mode
  requestToken?: boolean; // If true, request MIT token instead of making payment
}

/**
 * Backend data for Google Pay integration
 * Combines open_session + create_payment responses from backend
 */
export interface GooglePayBackendData {
  merchantId: string;
  merchantName: string;
  gatewayId: string;
  gatewayMerchantId: string;
  currency: string;
  countryCode: string;
  paymentReference: string;
  mobileAccessToken: string;
  amount: number;
  label: string;
}

/**
 * Google Pay token data returned by SDK in backend mode
 * Should be sent to backend for processing
 */
export interface GooglePayTokenData {
  paymentReference: string;
  mobileAccessToken: string;
  signature: string;
  intermediateSigningKey: {
    signedKey: string;
    signatures: string[];
  };
  protocolVersion: string;
  signedMessage: string;
  tokenConsentAgreed: boolean;
}

/**
 * Token request result from SDK mode
 * Extends GooglePayTokenData with payment details containing MIT token
 */
export interface TokenRequestResult extends GooglePayTokenData {
  paymentDetails?: {
    paymentReference: string;
    paymentState: string;
    ccDetails?: {
      token?: string; // MIT token (24-char alphanumeric)
      lastFourDigits?: string; // Last 4 digits of card
      month?: string; // Expiration month
      year?: string; // Expiration year (YYYY)
    };
  };
}

/**
 * Payment data for SDK mode
 */
export interface SDKModePaymentData {
  amount: string;
  label: string;
  orderReference: string;
  customerEmail: string;
  customerIp?: string;
}

/**
 * Google Pay button types (matching SDK button types)
 */
export type GooglePayButtonType =
  | 'buy' // "Buy with Google Pay" (default)
  | 'book' // "Book with Google Pay"
  | 'checkout' // "Checkout with Google Pay"
  | 'donate' // "Donate with Google Pay"
  | 'order' // "Order with Google Pay"
  | 'pay' // Plain "Google Pay"
  | 'subscribe'; // "Subscribe with Google Pay"

/**
 * Common props for GooglePayButton (used in all variants)
 */
type GooglePayButtonCommonProps = {
  // Configuration
  config: EverypayConfig;

  /**
   * Callback for handling payment/token data
   * Receives different types based on mode and operation:
   * - Backend + payment: GooglePayTokenData
   * - Backend + token request: GooglePayTokenData
   * - SDK + payment: { status: string }
   * - SDK + token request: TokenRequestResult
   */
  onPressCallback: (paymentData: any) => Promise<any>;

  // Callbacks
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: Error) => void;
  onPaymentCanceled?: () => void;

  // Button styling
  theme?: 'dark' | 'light';
  buttonType?: GooglePayButtonType;
  disabled?: boolean;
};

/**
 * Backend Mode props
 * API credentials stay on backend (recommended)
 * backendData contains all payment info including amount and label
 */
export type GooglePayButtonBackendProps = GooglePayButtonCommonProps & {
  // Backend mode requires backendData from /create-payment endpoint
  backendData: GooglePayBackendData;

  // These props are not allowed in backend mode
  amount?: never;
  label?: never;
  orderReference?: never;
  customerEmail?: never;
  customerIp?: never;
  tokenLabel?: never;
};

/**
 * SDK Mode props for a one-time payment
 * Set `config.requestToken` to false (or omit) and provide payment details
 */
export type GooglePayButtonSDKPaymentProps = GooglePayButtonCommonProps & {
  // SDK mode requires these fields for payment
  amount: number;
  label: string;
  orderReference: string;
  customerEmail: string;
  customerIp?: string;

  // These props are not allowed in SDK payment mode
  backendData?: never;
  tokenLabel?: never;
};

/**
 * SDK Mode props for a token request (recurring payments)
 * Set `config.requestToken` to true and provide a tokenLabel
 */
export type GooglePayButtonSDKTokenProps = GooglePayButtonCommonProps & {
  // SDK mode token request requires tokenLabel
  tokenLabel: string;

  // Payment fields are not used when requesting a token
  amount?: never;
  label?: never;
  orderReference?: never;
  customerEmail?: never;
  customerIp?: never;
  backendData?: never;
};

/**
 * SDK Mode props (discriminated union of payment and token-request variants)
 */
export type GooglePayButtonSDKProps =
  | GooglePayButtonSDKPaymentProps
  | GooglePayButtonSDKTokenProps;

/**
 * GooglePayButton props (discriminated union)
 * Use Backend Mode (with backendData) or SDK Mode (payment or token request)
 */
export type GooglePayButtonProps =
  | GooglePayButtonBackendProps
  | GooglePayButtonSDKProps;
