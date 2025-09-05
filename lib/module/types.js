"use strict";

/**
 * Google Pay Environment constants
 */

/**
 * Supported card networks for Estonian market
 */

/**
 * Card authentication methods
 */

// 3D Secure authentication (recommended)

/**
 * Google Pay Error Codes
 */
export let GooglePayErrorCodes = /*#__PURE__*/function (GooglePayErrorCodes) {
  // Platform errors
  GooglePayErrorCodes["UNSUPPORTED_PLATFORM"] = "UNSUPPORTED_PLATFORM";
  // iOS calls
  // Initialization errors
  GooglePayErrorCodes["INVALID_CONFIG"] = "INVALID_CONFIG";
  // Missing config
  GooglePayErrorCodes["INITIALIZATION_FAILED"] = "INITIALIZATION_FAILED";
  // SDK init failed
  // Payment errors
  GooglePayErrorCodes["PAYMENT_CANCELLED"] = "PAYMENT_CANCELLED";
  // User cancelled
  GooglePayErrorCodes["PAYMENT_FAILED"] = "PAYMENT_FAILED";
  // Payment failed
  GooglePayErrorCodes["INVALID_PAYMENT_DATA"] = "INVALID_PAYMENT_DATA";
  // Invalid request
  GooglePayErrorCodes["NOT_INITIALIZED"] = "NOT_INITIALIZED";
  // Not initialized
  GooglePayErrorCodes["PAYMENT_ERROR"] = "PAYMENT_ERROR";
  // General error
  GooglePayErrorCodes["PAYMENT_PARSE_ERROR"] = "PAYMENT_PARSE_ERROR";
  // Parse error
  // Service errors
  GooglePayErrorCodes["GOOGLE_PAY_UNAVAILABLE"] = "GOOGLE_PAY_UNAVAILABLE"; // Service unavailable
  return GooglePayErrorCodes;
}({});

/**
 * Google Pay specific error interface
 */

/**
 * Address information for shipping/billing
 */

/**
 * Merchant information
 */

/**
 * Tokenization specification for payment gateway
 */

/**
 * Payment method configuration
 */

/**
 * Google Pay configuration
 */

/**
 * Payment request data
 */

/**
 * Card information from payment result
 */

/**
 * Tokenization data from payment result
 */

/**
 * Payment method data from result
 */

/**
 * Payment result from successful Google Pay transaction
 */

/**
 * Estonian market specific configuration defaults
 */
export const EstonianDefaults = {
  COUNTRY_CODE: 'ET',
  CURRENCY_CODE: 'EUR',
  ALLOWED_CARD_NETWORKS: ['VISA', 'MASTERCARD'],
  ALLOWED_AUTH_METHODS: ['CRYPTOGRAM_3DS'],
  // Recommended for security
  GATEWAY: 'everypay'
};
//# sourceMappingURL=types.js.map