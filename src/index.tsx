/**
 * EveryPay Google Pay React Native Bridge
 *
 * @module @everypay/googlepay-rn-bridge
 * @description Android-only Google Pay integration using EveryPay SDK
 */

import { Platform } from 'react-native';
import type {
  EverypayConfig,
  GooglePayBackendData,
  GooglePayTokenData,
  TokenRequestResult,
  SDKModePaymentData,
} from './types';
import type { GooglePayInitResult } from './specs/NativeEverypayGpayRnBridge';

// Conditionally import native module (Android only)
const NativeModule =
  Platform.OS === 'android'
    ? require('./specs/NativeEverypayGpayRnBridge').default
    : null;

// Helper to ensure Android platform
const ensureAndroid = (): void => {
  if (Platform.OS !== 'android') {
    throw new Error(
      '[GooglePay] Google Pay is only supported on Android. ' +
        'This library cannot be used on iOS.'
    );
  }
};

// Export native module for direct access
export const NativeEverypayGpayRnBridge = NativeModule;

// Export GooglePayButton component
export { default as GooglePayButton } from './GooglePayButton';

// ========== Exported SDK Methods ==========

/**
 * Initialize Google Pay with backend data (Backend mode - RECOMMENDED)
 * Backend makes all API calls, SDK only handles Google Pay UI
 */
export const initializeWithBackendData = (
  config: EverypayConfig,
  backendData: GooglePayBackendData
): Promise<GooglePayInitResult> => {
  ensureAndroid();
  return NativeModule!.initializeWithBackendData(config, backendData);
};

/**
 * Initialize Google Pay in SDK mode
 * SDK makes all API calls including backend calls
 */
export const initializeSDKMode = (
  config: EverypayConfig
): Promise<GooglePayInitResult> => {
  ensureAndroid();
  return NativeModule!.initializeSDKMode(config);
};

/**
 * Make payment with backend data (Backend mode - RECOMMENDED)
 * Returns Google Pay token for backend to process
 */
export const makePaymentWithBackendData = (
  backendData: GooglePayBackendData
): Promise<GooglePayTokenData> => {
  ensureAndroid();
  return NativeModule!.makePaymentWithBackendData(backendData);
};

/**
 * Make payment in SDK mode
 * SDK handles everything including backend communication
 */
export const makePaymentSDKMode = (
  paymentData: SDKModePaymentData
): Promise<{ status: string }> => {
  ensureAndroid();
  return NativeModule!.makePaymentSDKMode(paymentData);
};

/**
 * Request recurring payment token with backend data (Backend mode - RECOMMENDED)
 * Backend makes all API calls, SDK only handles Google Pay UI
 *
 * @param backendData - Backend data containing session info and zero-amount payment reference
 * @returns Promise resolving to GooglePayTokenData to send to backend
 *
 * @example
 * ```ts
 * const tokenData = await requestTokenWithBackendData(backendData);
 * // Send tokenData to backend for processing and MIT token extraction
 * await fetch('/api/process-token', {
 *   method: 'POST',
 *   body: JSON.stringify(tokenData)
 * });
 * ```
 */
export const requestTokenWithBackendData = (
  backendData: GooglePayBackendData
): Promise<GooglePayTokenData> => {
  ensureAndroid();
  return NativeModule!.requestTokenWithBackendData(backendData);
};

/**
 * Request recurring payment token in SDK mode
 * SDK makes all API calls including backend communication and MIT token retrieval
 *
 * @param label - User-facing label shown in Google Pay sheet (e.g., "Card verification", "Save card for subscriptions")
 * @returns Promise resolving to token data including MIT token in paymentDetails.ccDetails.token
 *
 * @example
 * ```ts
 * const result = await requestTokenSDKMode("Card verification");
 * const mitToken = result.paymentDetails?.ccDetails?.token;
 * // Store MIT token for future recurring payments
 * if (mitToken) {
 *   await saveMitToken(mitToken);
 * }
 * ```
 */
export const requestTokenSDKMode = (
  label: string
): Promise<TokenRequestResult> => {
  ensureAndroid();
  return NativeModule!.requestTokenSDKMode(label);
};

/**
 * Check if a payment is currently being processed
 */
export const isProcessingPayment = (): boolean => {
  ensureAndroid();
  return NativeModule!.isProcessingPayment();
};

// Export all TypeScript types
export type {
  // SDK types
  EverypayConfig,
  GooglePayBackendData,
  GooglePayTokenData,
  TokenRequestResult,
  SDKModePaymentData,
  GooglePayMode,
  GooglePayButtonType,
  GooglePayButtonProps,
  GooglePayButtonSDKProps,

  // Base types
  GooglePayEnvironment,
  CardNetwork,
  CardAuthMethod,
} from './types';

// Export types from native spec
export type { GooglePayInitResult } from './specs/NativeEverypayGpayRnBridge';

// Export constants
export { EstonianDefaults, GooglePayErrorCodes } from './types';
