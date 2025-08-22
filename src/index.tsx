import EverypayGpayRnBridge from './specs/NativeEverypayGpayRnBridge';
import GooglePayButton from './GooglePayButton';
import type {
  GooglePayButtonConfig,
  EveryPayGooglePayError,
  PaymentProcessResponse,
  GooglePayEnvironment,
  CardNetwork,
  CardAuthMethod,
} from './types';

export const { init, isReadyToPay, loadPaymentData } = EverypayGpayRnBridge;

export { GooglePayButton };

export type {
  GooglePayButtonConfig,
  EveryPayGooglePayError,
  PaymentProcessResponse,
  GooglePayEnvironment,
  CardNetwork,
  CardAuthMethod,
};
