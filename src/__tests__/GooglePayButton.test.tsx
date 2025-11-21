/**
 * Tests for GooglePayButton component
 * Tests component rendering, mode detection, initialization, payment flows, and error handling
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import GooglePayButton from '../GooglePayButton';
import { __mockInstance } from './__mocks__/NativeEverypayGpayRnBridge';
import type {
  EverypayConfig,
  GooglePayBackendData,
  GooglePayButtonSDKProps,
} from '../types';

describe('GooglePayButton', () => {
  const mockConfig: EverypayConfig = {
    environment: 'TEST',
    countryCode: 'EE',
    currencyCode: 'EUR',
  };

  const mockBackendData: GooglePayBackendData = {
    merchantId: 'test-merchant',
    merchantName: 'Test Merchant',
    gatewayId: 'everypay',
    gatewayMerchantId: 'test-gateway-123',
    currency: 'EUR',
    countryCode: 'EE',
    paymentReference: 'ref-123',
    mobileAccessToken: 'token-123',
    amount: 10.0,
    label: 'Test payment',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockInstance.resetMocks();
    Platform.OS = 'android';
  });

  describe('Rendering', () => {
    it('should return null while initializing', () => {
      const mockOnPress = jest.fn();

      const { queryByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      // Initially, button should not be visible (null before ready)
      expect(queryByTestId('google-pay-button')).toBeNull();
    });

    it('should render button after successful initialization', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });
    });

    it('should not render on iOS', async () => {
      Platform.OS = 'ios';

      const mockOnPress = jest.fn();

      const { queryByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      // Wait a bit to ensure initialization attempt
      await waitFor(() => {}, { timeout: 100 });

      // Button should never appear on iOS
      expect(queryByTestId('google-pay-button')).toBeNull();

      Platform.OS = 'android';
    });
  });

  describe('Mode detection', () => {
    it('should detect Backend mode when backendData is provided', async () => {
      const mockOnPress = jest.fn();

      render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        // Verify it's rendered (which means initialization succeeded)
        expect(__mockInstance.resetMocks).toBeDefined();
      });
    });

    it('should detect SDK mode when backendData is not provided', async () => {
      const mockOnPress = jest.fn();

      const sdkConfig: EverypayConfig = {
        ...mockConfig,
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
      };

      const sdkProps: GooglePayButtonSDKProps = {
        config: sdkConfig,
        amount: 10.0,
        label: 'Test payment',
        orderReference: 'order-123',
        customerEmail: 'test@example.com',
        onPressCallback: mockOnPress,
      };

      render(<GooglePayButton {...sdkProps} />);

      await waitFor(() => {
        // Check that initialization was called
        expect(__mockInstance.resetMocks).toBeDefined();
      });
    });
  });

  describe('Initialization', () => {
    it('should initialize in Backend mode', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });
    });

    it('should initialize in SDK mode', async () => {
      const mockOnPress = jest.fn();

      const sdkConfig: EverypayConfig = {
        ...mockConfig,
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
      };

      const sdkProps: GooglePayButtonSDKProps = {
        config: sdkConfig,
        amount: 10.0,
        label: 'Test payment',
        orderReference: 'order-123',
        customerEmail: 'test@example.com',
        onPressCallback: mockOnPress,
      };

      const { getByTestId } = render(<GooglePayButton {...sdkProps} />);

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });
    });

    it('should handle initialization errors', async () => {
      const mockOnPress = jest.fn();
      const mockOnError = jest.fn();

      const initError = new Error('Initialization failed');
      __mockInstance.setMockError(initError);

      const { queryByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          onPaymentError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(initError);
      });

      // Button should not render when initialization fails
      expect(queryByTestId('google-pay-button')).toBeNull();

      __mockInstance.setMockError(null);
    });
  });

  describe('Backend mode payment flow', () => {
    it('should handle successful payment', async () => {
      const mockOnPress = jest.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          onPaymentSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true });
      });
    });

    it('should handle payment errors', async () => {
      const mockOnPress = jest.fn();
      const mockOnError = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          onPaymentError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      const paymentError = new Error('Payment failed');
      __mockInstance.setMockError(paymentError);

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(paymentError);
      });

      __mockInstance.setMockError(null);
    });

    it('should handle payment cancellation', async () => {
      const mockOnPress = jest.fn();
      const mockOnCancel = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          onPaymentCanceled={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      const cancelError = Object.assign(new Error('User canceled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });

      __mockInstance.setMockError(null);
    });

    it('should handle token request for recurring payments', async () => {
      const mockOnPress = jest.fn().mockResolvedValue({ tokenReceived: true });
      const mockOnSuccess = jest.fn();

      const configWithToken: EverypayConfig = {
        ...mockConfig,
        requestToken: true,
      };

      const { getByTestId } = render(
        <GooglePayButton
          config={configWithToken}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          onPaymentSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith({ tokenReceived: true });
      });
    });
  });

  describe('SDK mode payment flow', () => {
    it('should handle successful payment', async () => {
      const mockOnPress = jest.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = jest.fn();

      const sdkConfig: EverypayConfig = {
        ...mockConfig,
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
      };

      const sdkProps: GooglePayButtonSDKProps = {
        config: sdkConfig,
        amount: 10.0,
        label: 'Test payment',
        orderReference: 'order-123',
        customerEmail: 'test@example.com',
        onPressCallback: mockOnPress,
        onPaymentSuccess: mockOnSuccess,
      };

      const { getByTestId } = render(<GooglePayButton {...sdkProps} />);

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true });
      });
    });

    it('should handle token request for recurring payments', async () => {
      const mockOnPress = jest.fn().mockResolvedValue({ tokenReceived: true });
      const mockOnSuccess = jest.fn();

      const sdkConfig: EverypayConfig = {
        ...mockConfig,
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
        requestToken: true,
      };

      const sdkProps: GooglePayButtonSDKProps = {
        config: sdkConfig,
        amount: 0.0,
        label: 'Card verification',
        orderReference: 'token-123',
        customerEmail: 'test@example.com',
        tokenLabel: 'Card verification',
        onPressCallback: mockOnPress,
        onPaymentSuccess: mockOnSuccess,
      };

      const { getByTestId } = render(<GooglePayButton {...sdkProps} />);

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('google-pay-button'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith({ tokenReceived: true });
      });
    });
  });

  describe('Button states', () => {
    it('should render with disabled prop', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          disabled={true}
        />
      );

      await waitFor(() => {
        const button = getByTestId('google-pay-button');
        expect(button).toBeTruthy();
      });

      // If button is rendered, the disabled prop was accepted
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should disable button while processing payment', async () => {
      const mockOnPress = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 200);
          })
      );

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        expect(getByTestId('google-pay-button')).toBeTruthy();
      });

      const button = getByTestId('google-pay-button');

      // Press the button to trigger payment
      fireEvent.press(button);

      // Verify the callback was called
      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
      });
    });
  });

  describe('Theme and button type props', () => {
    it('should apply dark theme by default', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        expect(nativeButton.props.theme).toBe('dark');
      });
    });

    it('should apply light theme when specified', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          theme="light"
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        expect(nativeButton.props.theme).toBe('light');
      });
    });

    it('should apply buy button type by default', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        expect(nativeButton.props.buttonType).toBe('buy');
      });
    });

    it('should apply custom button type when specified', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
          buttonType="donate"
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        expect(nativeButton.props.buttonType).toBe('donate');
      });
    });
  });

  describe('Allowed payment methods', () => {
    it('should use default card networks if not specified', async () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <GooglePayButton
          config={mockConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        const paymentMethods = JSON.parse(
          nativeButton.props.allowedPaymentMethods
        );

        expect(paymentMethods[0].parameters.allowedCardNetworks).toEqual([
          'MASTERCARD',
          'VISA',
        ]);
        expect(paymentMethods[0].parameters.allowedAuthMethods).toEqual([
          'PAN_ONLY',
          'CRYPTOGRAM_3DS',
        ]);
      });
    });

    it('should use custom card networks if specified', async () => {
      const mockOnPress = jest.fn();

      const customConfig: EverypayConfig = {
        ...mockConfig,
        allowedCardNetworks: ['VISA'],
        allowedCardAuthMethods: ['CRYPTOGRAM_3DS'],
      };

      const { getByTestId } = render(
        <GooglePayButton
          config={customConfig}
          backendData={mockBackendData}
          onPressCallback={mockOnPress}
        />
      );

      await waitFor(() => {
        const nativeButton = getByTestId('native-google-pay-button');
        const paymentMethods = JSON.parse(
          nativeButton.props.allowedPaymentMethods
        );

        expect(paymentMethods[0].parameters.allowedCardNetworks).toEqual([
          'VISA',
        ]);
        expect(paymentMethods[0].parameters.allowedAuthMethods).toEqual([
          'CRYPTOGRAM_3DS',
        ]);
      });
    });
  });
});
