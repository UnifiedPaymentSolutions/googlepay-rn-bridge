import React, { useEffect, useState /* , useMemo */ } from 'react';
import {
  // NativeModules,
  requireNativeComponent,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import uuid from 'react-native-uuid';

import { isReadyToPay, init, loadPaymentData } from './index';
import {
  EstonianDefaults,
  type GooglePayButtonConfig,
  type GooglePayRequest,
  type PaymentProcessResponse,
} from './types';
import {
  getMerchantInfo,
  openEPSession,
  processPayment,
  type GetMerchantInfoResponse,
  type OpenEPSessionResponse,
} from './EveryPayUtil/EveryPayRequests';
import { EveryPayGooglePayError } from './everyPayError';
import { ERROR_CODES } from './constants';

// Only require the native component on Android
const NativeGooglePayButton =
  Platform.OS === 'android'
    ? (() => {
        try {
          // @ts-ignore
          const isFabricEnabled = global.nativeFabricUIManager != null;
          return isFabricEnabled
            ? require('./specs/GooglePayButtonNativeComponent').default
            : requireNativeComponent('EveryPayGooglePayButton');
        } catch (error) {
          console.warn('Native Google Pay component not available:', error);
          return null;
        }
      })()
    : null;

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

const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  onPressCallback,
  disabled = false,
  config,
  theme = 'dark',
  amount,
  label,
  orderReference,
  customerEmail,
  customerIp,
}) => {
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [EPSessionInfo, setEPSessionInfo] =
    useState<OpenEPSessionResponse | null>(null);

  const initGooglePay = async () => {
    if (Platform.OS === 'ios') {
      console.log('GooglePayButton is not supported on iOS');
      return;
    }

    if (!NativeGooglePayButton) {
      console.warn('Google Pay native component is not available');
      return;
    }

    try {
      await init(
        config.environment,
        config?.allowedCardNetworks || ['MASTERCARD', 'VISA'],
        config?.allowedCardAuthMethods || ['PAN_ONLY', 'CRYPTOGRAM_3DS']
      );

      const readyToPay = await isReadyToPay();

      const body = {
        api_username: config.apiUsername,
        account_name: 'EUR3D1',
      };

      const sessionInfo = await openEPSession(
        config.apiUrl,
        config.apiUsername,
        config.apiSecret,
        body
      );

      if (readyToPay && sessionInfo) {
        setEPSessionInfo(sessionInfo);
        setIsReady(readyToPay);
      } else {
        console.log('Google Pay is not available');
      }
    } catch (error: any) {
      console.error('Error initializing Google Pay', error);
      onPressCallback?.({
        state: 'failed',
        error: new EveryPayGooglePayError(
          ERROR_CODES.GOOGLE_PAY_INITIALIZATION_FAILED,
          error?.message
        ),
      });
    }
  };

  useEffect(() => {
    initGooglePay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAllowedPaymentMethods = () => {
    // Don't create payment methods if we don't have merchant info yet
    if (!EPSessionInfo) {
      return [];
    }

    return [
      {
        type: 'CARD',
        parameters: {
          allowedCardNetworks: config?.allowedCardNetworks || [
            'MASTERCARD',
            'VISA',
          ],
          allowedAuthMethods: config?.allowedCardAuthMethods || [
            'PAN_ONLY',
            'CRYPTOGRAM_3DS',
          ],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: EPSessionInfo.google_pay_gateway_id.toLowerCase(),
            gatewayMerchantId:
              EPSessionInfo.googlepay_merchant_identifier.toLowerCase(),
          },
        },
      },
    ];
  };

  const onPress = async () => {
    let merchantInfo: GetMerchantInfoResponse | null = null;

    try {
      const body = {
        api_username: config.apiUsername,
        account_name: config.accountName,
        amount: amount,
        label,
        currency_code: config.currencyCode || EstonianDefaults.CURRENCY_CODE,
        country_code: config.countryCode,
        order_reference: orderReference,
        nonce: uuid.v4(),
        mobile_payment: true,
        customer_url: 'https://www.lhv.ee',
        customer_ip: customerIp || '',
        customer_email: customerEmail,
        timestamp: new Date().toISOString(),
      };

      merchantInfo = await getMerchantInfo(
        config.apiUrl,
        config.apiUsername,
        config.apiSecret,
        body
      );
    } catch (error: any) {
      console.error('Error making merchant info request', error);
      onPressCallback?.({
        state: 'failed',
        error: new EveryPayGooglePayError(
          ERROR_CODES.MERCHANT_INFO_REQUEST_ERROR,
          error?.message
        ),
      });
    }

    if (!EPSessionInfo) {
      await initGooglePay();
    }

    if (!EPSessionInfo) {
      console.log('EPSessionInfo is not set');
      return;
    }

    try {
      const googlePayRequest: GooglePayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: config?.allowedCardAuthMethods || [
                'PAN_ONLY',
                'CRYPTOGRAM_3DS',
              ],
              allowedCardNetworks: config?.allowedCardNetworks || [
                'MASTERCARD',
                'VISA',
              ],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: EPSessionInfo.google_pay_gateway_id.toLowerCase(),
                gatewayMerchantId:
                  EPSessionInfo.googlepay_gateway_merchant_id.toLowerCase(),
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: EPSessionInfo.googlepay_merchant_identifier.toLowerCase(),
          merchantName: EPSessionInfo.merchant_name || '-',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: merchantInfo?.currency || 'EUR',
          countryCode: merchantInfo?.descriptor_country || 'EE',
          totalPriceLabel: label,
        },
      };

      const paymentData = await loadPaymentData(googlePayRequest);

      const token = JSON.parse(
        JSON.parse(paymentData).paymentMethodData.tokenizationData.token
      );

      const paymentProcessRequestBody = {
        payment_reference: merchantInfo?.payment_reference || '',
        token_consent_agreed: false,
        signature: token.signature,
        intermediateSigningKey: {
          signedKey: token.intermediateSigningKey.signedKey,
          signatures: token.intermediateSigningKey.signatures,
        },
        protocolVersion: token.protocolVersion,
        signedMessage: token.signedMessage,
      };

      const paymentProcessResponse = await processPayment(
        config.apiUrl,
        merchantInfo?.mobile_access_token || '',
        paymentProcessRequestBody
      );

      if (onPressCallback) {
        onPressCallback({
          state: paymentProcessResponse.state,
        });
      }
    } catch (e: any) {
      if (e.code && e.message) {
        console.error(
          'GooglePayButton error',
          `code: ${e.code}, message: ${e.message}`
        );
        onPressCallback?.({
          state: 'failed',
          error: new EveryPayGooglePayError(e.code, e.message),
        });
      } else {
        onPressCallback?.({ state: 'failed', error: e });
        console.error('GooglePayButton error', e);
      }
    }
  };

  if (!isReady || !EPSessionInfo) {
    return null;
  }

  return (
    <TouchableOpacity
      testID="google-pay-button"
      onPress={onPress}
      disabled={disabled}
      // activeOpacity={disabled ? 0.3 : 1}
      style={[disabled ? styles.disabled : styles.notDisabled]}
    >
      <NativeGooglePayButton
        testID="native-google-pay-button"
        allowedPaymentMethods={JSON.stringify(getAllowedPaymentMethods())}
        theme={theme.toLowerCase()}
        style={styles.nativeButtonStyle}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
  notDisabled: {
    opacity: 1,
  },
  nativeButtonStyle: {
    height: 100,
    width: 300,
  },
});

export default GooglePayButton;
