import React, { useEffect, useState } from 'react';
import {
  requireNativeComponent,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import NativeEverypayGpayRnBridge from './specs/NativeEverypayGpayRnBridge';
import type {
  GooglePayButtonProps,
  GooglePayBackendData,
  SDKModePaymentData,
} from './types';

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

const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  config,
  amount,
  label,
  orderReference,
  customerEmail,
  customerIp,
  backendUrl,
  onPressCallback,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCanceled,
  theme = 'dark',
  buttonType = 'buy',
  disabled = false,
}) => {
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [isMakingPaymentRequest, setIsMakingPaymentRequest] =
    useState<boolean>(false);

  // Auto-detect mode based on configuration
  const isSDKMode = !!(config.apiUsername && config.apiSecret);
  const isBackendMode = !!backendUrl;

  // Validate mutually exclusive modes
  if (isBackendMode && isSDKMode) {
    console.warn(
      '[GooglePayButton] Both backendUrl and SDK credentials provided. ' +
        'Using Backend mode (more secure). Remove apiUsername/apiSecret if using Backend mode.'
    );
  }

  if (!isBackendMode && !isSDKMode) {
    throw new Error(
      '[GooglePayButton] Invalid configuration. Provide either:\n' +
        '• backendUrl (Backend mode - recommended)\n' +
        '• apiUsername + apiSecret (SDK mode)'
    );
  }

  useEffect(() => {
    let isMounted = true;

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
        if (isBackendMode && backendUrl) {
          // Backend mode: Get init data from backend
          const initResponse = await fetch(`${backendUrl}/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              environment: config.environment,
              countryCode: config.countryCode,
            }),
          });

          if (!initResponse.ok) {
            throw new Error('Failed to initialize from backend');
          }

          const backendData: GooglePayBackendData = await initResponse.json();
          const ready =
            await NativeEverypayGpayRnBridge.initializeWithBackendData(
              config,
              backendData
            );

          // Only update state if component is still mounted
          if (isMounted) {
            setIsReady(ready);
          }
        } else if (isSDKMode) {
          // SDK mode: Direct SDK initialization
          const ready =
            await NativeEverypayGpayRnBridge.initializeSDKMode(config);

          // Only update state if component is still mounted
          if (isMounted) {
            setIsReady(ready);
          }
        } else {
          throw new Error(
            'Invalid configuration: provide either backendUrl (Backend mode) or apiUsername/apiSecret (SDK mode)'
          );
        }
      } catch (error: any) {
        console.error('Error initializing Google Pay', error);
        if (isMounted) {
          onPaymentError?.(error);
        }
      }
    };

    initGooglePay();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAllowedPaymentMethods = () => {
    // For native button rendering
    const cardNetworks = config?.allowedCardNetworks || ['MASTERCARD', 'VISA'];
    const authMethods = config?.allowedCardAuthMethods || [
      'PAN_ONLY',
      'CRYPTOGRAM_3DS',
    ];

    return [
      {
        type: 'CARD',
        parameters: {
          allowedCardNetworks: cardNetworks,
          allowedAuthMethods: authMethods,
        },
      },
    ];
  };

  const onPress = async () => {
    setIsMakingPaymentRequest(true);

    try {
      let paymentData: any;

      if (isBackendMode && backendUrl) {
        // Backend mode flow
        if (!amount || !label) {
          throw new Error('Backend mode requires amount and label');
        }

        // Step 1: Get payment data from backend
        const paymentResponse = await fetch(`${backendUrl}/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            label,
            orderReference,
          }),
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment on backend');
        }

        const backendPaymentData: GooglePayBackendData =
          await paymentResponse.json();

        // Step 2: Show Google Pay and get token
        const tokenData =
          await NativeEverypayGpayRnBridge.makePaymentWithBackendData(
            backendPaymentData
          );

        // Step 3: Call user callback with token data
        paymentData = await onPressCallback(tokenData);
      } else if (isSDKMode) {
        // SDK mode flow
        if (!amount || !label || !orderReference || !customerEmail) {
          throw new Error(
            'SDK mode requires amount, label, orderReference, and customerEmail'
          );
        }

        const sdkPaymentData: SDKModePaymentData = {
          amount: amount.toString(),
          label,
          orderReference,
          customerEmail,
          customerIp,
        };

        // Show Google Pay and process payment via SDK
        const result =
          await NativeEverypayGpayRnBridge.makePaymentSDKMode(sdkPaymentData);

        // Call user callback with result
        paymentData = await onPressCallback(result);
      }

      onPaymentSuccess?.(paymentData);
    } catch (error: any) {
      if (error.code === 'E_PAYMENT_CANCELED') {
        console.log('Payment canceled by user');
        onPaymentCanceled?.();
      } else {
        console.error('Payment error', error);
        onPaymentError?.(error);
      }
    } finally {
      setIsMakingPaymentRequest(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <TouchableOpacity
      testID="google-pay-button"
      onPress={onPress}
      disabled={disabled || isMakingPaymentRequest}
      style={[
        disabled || isMakingPaymentRequest
          ? styles.disabled
          : styles.notDisabled,
      ]}
    >
      <NativeGooglePayButton
        testID="native-google-pay-button"
        allowedPaymentMethods={JSON.stringify(getAllowedPaymentMethods())}
        theme={theme.toLowerCase()}
        buttonType={buttonType.toLowerCase()}
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
