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
  COUNTRY_CODE: 'ET',
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
 * Operation modes for Google Pay integration
 */
export type GooglePayMode = 'backend' | 'sdk';

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
 * Simplified props for GooglePayButton component
 * Uses single callback pattern for ease of use
 */
export interface GooglePayButtonProps {
  // Configuration
  config: EverypayConfig;

  // Payment data
  amount: number;
  label: string;
  orderReference?: string;
  customerEmail?: string;
  customerIp?: string;

  // Backend mode support (optional)
  backendUrl?: string; // If provided, uses backend mode

  // Single callback for payment handling
  // Works for both Backend and SDK modes
  onPressCallback: (paymentData: any) => Promise<any>;

  // Callbacks
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: Error) => void;
  onPaymentCanceled?: () => void;

  // Button styling
  theme?: 'dark' | 'light';
  buttonType?: GooglePayButtonType;
  disabled?: boolean;
}

/**
 * Props for GooglePayButton with SDK support (DEPRECATED - use GooglePayButtonProps)
 * @deprecated Use simplified GooglePayButtonProps instead
 */
export interface GooglePayButtonSDKProps {
  // Mode selection
  mode: GooglePayMode;

  // Backend mode props (required when mode='backend')
  backendUrl?: string; // Base URL for backend API
  onGetBackendInitData?: () => Promise<GooglePayBackendData>;
  onGetBackendPaymentData?: (params: {
    amount: number;
    label: string;
    orderReference?: string;
  }) => Promise<GooglePayBackendData>;
  onProcessToken?: (tokenData: GooglePayTokenData) => Promise<any>;

  // SDK mode props (required when mode='sdk')
  config?: EverypayConfig;
  paymentData?: SDKModePaymentData;

  // Common props
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: Error) => void;
  onPaymentCanceled?: () => void;

  // Button styling
  buttonTheme?: 'dark' | 'light';
  buttonRadius?: number;
  disabled?: boolean;
}
