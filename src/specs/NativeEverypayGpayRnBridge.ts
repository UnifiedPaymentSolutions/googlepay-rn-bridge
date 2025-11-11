import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface EverypayConfig {
  environment: string;
  countryCode: string;
  apiUsername?: string;
  apiSecret?: string;
  apiUrl?: string;
  accountName?: string;
  customerUrl?: string;
  currencyCode?: string;
  allowedCardNetworks?: string[];
  allowedCardAuthMethods?: string[];
}

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

export interface PaymentData {
  amount: string;
  label: string;
  orderReference: string;
  customerEmail: string;
  customerIp?: string;
}

export interface Spec extends TurboModule {
  // Initialize with backend data (Backend mode - RECOMMENDED)
  // Backend makes all API calls, SDK only handles Google Pay UI
  initializeWithBackendData(
    config: EverypayConfig,
    backendData: GooglePayBackendData
  ): Promise<boolean>;

  // Initialize in SDK mode
  // SDK makes all API calls including backend calls
  initializeSDKMode(config: EverypayConfig): Promise<boolean>;

  // Make payment with backend data (Backend mode - RECOMMENDED)
  // Returns Google Pay token for backend to process
  makePaymentWithBackendData(
    backendData: GooglePayBackendData
  ): Promise<GooglePayTokenData>;

  // Make payment in SDK mode
  // SDK handles everything including backend communication
  makePaymentSDKMode(paymentData: PaymentData): Promise<{ status: string }>;

  // Check if a payment is currently being processed
  isProcessingPayment(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('EverypayGpayRnBridge');
