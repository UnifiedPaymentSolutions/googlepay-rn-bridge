import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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
  // Initialize the Google Pay client
  init(
    environment: string,
    allowedCardNetworks: string[],
    allowedCardAuthMethods: string[]
  ): Promise<boolean>;

  // Check if Google Pay is ready - returns a Promise<boolean>
  isReadyToPay(): Promise<boolean>;

  // Load payment data
  loadPaymentData(request: GooglePayRequest): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('EverypayGpayRnBridge');
