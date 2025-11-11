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
  SDKModePaymentData,
} from './types';

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
): Promise<boolean> => {
  ensureAndroid();
  return NativeModule!.initializeWithBackendData(config, backendData);
};

/**
 * Initialize Google Pay in SDK mode
 * SDK makes all API calls including backend calls
 */
export const initializeSDKMode = (config: EverypayConfig): Promise<boolean> => {
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

// Export constants
export { EstonianDefaults, GooglePayErrorCodes } from './types';
