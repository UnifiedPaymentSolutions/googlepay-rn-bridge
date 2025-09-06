import React from 'react';
import {
  type GooglePayButtonConfig,
  type PaymentProcessResponse,
} from './types';
interface GooglePayButtonProps {
  onPressCallback?: (result: PaymentProcessResponse) => void;
  disabled?: boolean;
  config: GooglePayButtonConfig;
  theme?: 'light' | 'dark';
  amount: number;
  label: string;
  orderReference: string;
  customerEmail: string;
  customerIp?: string;
}
declare const GooglePayButton: React.FC<GooglePayButtonProps>;
export default GooglePayButton;
//# sourceMappingURL=GooglePayButton.d.ts.map
