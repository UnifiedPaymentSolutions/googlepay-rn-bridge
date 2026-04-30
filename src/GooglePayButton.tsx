import React, { useEffect, useState } from 'react';
import {
  requireNativeComponent,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import type { GooglePayButtonProps, SDKModePaymentData } from './types';

// Shape of the allowedPaymentMethods entry the native Google Pay button expects.
type AllowedPaymentMethod = {
  type: 'CARD';
  parameters: {
    allowedCardNetworks: string[];
    allowedAuthMethods: string[];
  };
  tokenizationSpecification: {
    type: 'PAYMENT_GATEWAY';
    parameters: {
      gateway: string;
      gatewayMerchantId: string;
    };
  };
};

// Only require the native module on Android — importing it on iOS would trigger
// TurboModuleRegistry.getEnforcing at module load time and throw.
const NativeEverypayGpayRnBridge =
  Platform.OS === 'android'
    ? require('./specs/NativeEverypayGpayRnBridge').default
    : null;

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
    style,
    cornerRadius = 100,
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

  const flatStyle = StyleSheet.flatten(style) as
    | { height?: unknown; minHeight?: unknown; maxHeight?: unknown }
    | undefined;
  const hasHeightOverride =
    flatStyle?.height != null ||
    flatStyle?.minHeight != null ||
    flatStyle?.maxHeight != null;

  useEffect(() => {
    if (hasHeightOverride) {
      console.warn(
        '[GooglePayButton] style overrides height/minHeight/maxHeight. The native Google Pay button does not re-layout reliably when the parent height changes — use the `cornerRadius` prop for shape tweaks and verify any height override on-device. See README > Button Styling.'
      );
    }
  }, [hasHeightOverride]);

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
        } else {
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

  const onPress = async () => {
    // Defensive guard: mirrors the check in initGooglePay. The render guards
    // (isReady + gatewayInfo) normally prevent this handler from running
    // without a native module, but guarding here avoids a null-deref crash
    // if state is ever externally manipulated (e.g. in tests).
    if (!NativeEverypayGpayRnBridge) {
      return;
    }

    setIsMakingPaymentRequest(true);

    try {
      let paymentData: any;

      // Check if this is a token request (recurring payments) or payment
      const isTokenRequest = config.requestToken === true;

      if (isBackendMode) {
        // Backend mode flow
        const backendData = (props as any).backendData;

        if (isTokenRequest) {
          // Token request: Request MIT token for recurring payments
          const tokenData =
            await NativeEverypayGpayRnBridge.requestTokenWithBackendData(
              backendData
            );

          // Call user callback with token data
          paymentData = await onPressCallback(tokenData);
        } else {
          // Payment: Process one-time payment
          // Step 1: Show Google Pay and get token
          const tokenData =
            await NativeEverypayGpayRnBridge.makePaymentWithBackendData(
              backendData
            );

          // Step 2: Call user callback with token data
          // User sends this to their backend /process-token endpoint
          paymentData = await onPressCallback(tokenData);
        }
      } else {
        // SDK mode flow
        if (isTokenRequest) {
          // Token request: Request MIT token for recurring payments
          const tokenLabel = (props as any).tokenLabel || 'Card verification';

          // Validate tokenLabel is provided
          if (!(props as any).tokenLabel) {
            console.warn(
              '[GooglePayButton] tokenLabel not provided for SDK mode token request, using default "Card verification"'
            );
          }

          const tokenResult =
            await NativeEverypayGpayRnBridge.requestTokenSDKMode(tokenLabel);

          // Call user callback with token result
          paymentData = await onPressCallback(tokenResult);
        } else {
          // Payment: Process one-time payment via SDK
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

  const paymentMethod: AllowedPaymentMethod = {
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
        gateway: gatewayInfo.gateway,
        gatewayMerchantId: gatewayInfo.gatewayMerchantId,
      },
    },
  };

  return (
    <TouchableOpacity
      testID="google-pay-button"
      onPress={onPress}
      disabled={disabled || isMakingPaymentRequest}
      style={[
        styles.wrapper,
        disabled || isMakingPaymentRequest
          ? styles.disabled
          : styles.notDisabled,
        style,
      ]}
    >
      <NativeGooglePayButton
        testID="native-google-pay-button"
        allowedPaymentMethods={JSON.stringify([paymentMethod])}
        cornerRadius={cornerRadius}
        theme={theme.toLowerCase()}
        buttonType={buttonType.toLowerCase()}
        style={styles.nativeButton}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    height: 48,
  },
  disabled: {
    opacity: 0.4,
  },
  notDisabled: {
    opacity: 1,
  },
  nativeButton: {
    flex: 1,
  },
});

export default GooglePayButton;
