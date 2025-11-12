import React, { useEffect, useState } from 'react';
import {
  requireNativeComponent,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import NativeEverypayGpayRnBridge from './specs/NativeEverypayGpayRnBridge';
import type { GooglePayButtonProps, SDKModePaymentData } from './types';

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

const GooglePayButton: React.FC<GooglePayButtonProps> = (props) => {
  const {
    config,
    onPressCallback,
    onPaymentSuccess,
    onPaymentError,
    onPaymentCanceled,
    theme = 'dark',
    buttonType = 'buy',
    disabled = false,
  } = props;

  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [isMakingPaymentRequest, setIsMakingPaymentRequest] =
    useState<boolean>(false);
  const [gatewayInfo, setGatewayInfo] = useState<{
    gateway: string;
    gatewayMerchantId: string;
  } | null>(null);

  // Determine mode based on which props are present
  const isBackendMode =
    'backendData' in props && props.backendData !== undefined;
  const isSDKMode = !isBackendMode;

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
        if (isBackendMode) {
          // Backend mode: Use provided backend data (combines open_session + create_payment)
          const backendData = (props as any).backendData;
          const initResult =
            await NativeEverypayGpayRnBridge.initializeWithBackendData(
              config,
              backendData
            );

          // Only update state if component is still mounted
          if (isMounted) {
            setIsReady(initResult.isReady);
            // Store gateway info for button configuration
            setGatewayInfo({
              gateway: initResult.gatewayId,
              gatewayMerchantId: initResult.gatewayMerchantId,
            });
          }
        } else if (isSDKMode) {
          // SDK mode: Direct SDK initialization
          const initResult =
            await NativeEverypayGpayRnBridge.initializeSDKMode(config);

          // Only update state if component is still mounted
          if (isMounted) {
            setIsReady(initResult.isReady);
            // Store gateway info for button configuration
            setGatewayInfo({
              gateway: initResult.gatewayId,
              gatewayMerchantId: initResult.gatewayMerchantId,
            });
          }
        } else {
          throw new Error(
            'Invalid configuration: provide either backendData (Backend mode) or apiUsername/apiSecret (SDK mode)'
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

    const paymentMethod: any = {
      type: 'CARD',
      parameters: {
        allowedCardNetworks: cardNetworks,
        allowedAuthMethods: authMethods,
      },
    };

    // Add tokenizationSpecification if gateway info is available
    // This is required for Google Pay to display card digits
    if (gatewayInfo && gatewayInfo.gateway && gatewayInfo.gatewayMerchantId) {
      paymentMethod.tokenizationSpecification = {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: gatewayInfo.gateway,
          gatewayMerchantId: gatewayInfo.gatewayMerchantId,
        },
      };
    } else {
      console.warn(
        '[GooglePayButton] Gateway info not available, button may not display card digits'
      );
    }

    return [paymentMethod];
  };

  const onPress = async () => {
    setIsMakingPaymentRequest(true);

    try {
      let paymentData: any;

      if (isBackendMode) {
        // Backend mode flow
        // User provides backend data (already fetched from /create-payment endpoint)
        const backendData = (props as any).backendData;

        // Step 1: Show Google Pay and get token
        const tokenData =
          await NativeEverypayGpayRnBridge.makePaymentWithBackendData(
            backendData
          );

        // Step 2: Call user callback with token data
        // User sends this to their backend /process-token endpoint
        paymentData = await onPressCallback(tokenData);
      } else if (isSDKMode) {
        // SDK mode flow
        const { amount, label, orderReference, customerEmail, customerIp } =
          props as any;

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

  if (!isReady || !gatewayInfo) {
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
