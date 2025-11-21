/**
 * Tests for main index module
 * Tests platform detection, exported functions, and native module integration
 */

import { __mockInstance } from './__mocks__/NativeEverypayGpayRnBridge';

describe('index module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform detection', () => {
    // Note: Platform.OS is mocked to 'android' by default in jest.setup.js
    // Testing iOS behavior would require mocking Platform differently
    // which is complex with react-native preset. The Android-only check
    // is tested via the actual implementation.

    it('should work on Android platform', () => {
      const { initializeWithBackendData } = require('../index');
      expect(initializeWithBackendData).toBeDefined();
      expect(typeof initializeWithBackendData).toBe('function');
    });
  });

  describe('Backend mode functions', () => {
    it('should call native initializeWithBackendData', async () => {
      const { initializeWithBackendData } = require('../index');

      const config = {
        environment: 'TEST',
        countryCode: 'EE',
      };
      const backendData = {
        merchantId: 'test',
        merchantName: 'Test',
        gatewayId: 'everypay',
        gatewayMerchantId: 'test-123',
        currency: 'EUR',
        countryCode: 'EE',
        paymentReference: 'ref-123',
        mobileAccessToken: 'token-123',
        amount: 10.0,
        label: 'Test payment',
      };

      const result = await initializeWithBackendData(config, backendData);

      expect(result).toBeDefined();
      expect(result.isReady).toBe(true);
      expect(result.gatewayId).toBe('everypay');
    });

    it('should call native makePaymentWithBackendData', async () => {
      const { makePaymentWithBackendData } = require('../index');

      const backendData = {
        merchantId: 'test',
        merchantName: 'Test',
        gatewayId: 'everypay',
        gatewayMerchantId: 'test-123',
        currency: 'EUR',
        countryCode: 'EE',
        paymentReference: 'ref-123',
        mobileAccessToken: 'token-123',
        amount: 10.0,
        label: 'Test payment',
      };

      const result = await makePaymentWithBackendData(backendData);

      expect(result).toBeDefined();
      expect(result.paymentReference).toBe('test-payment-ref');
      expect(result.signature).toBeDefined();
    });

    it('should call native requestTokenWithBackendData', async () => {
      const { requestTokenWithBackendData } = require('../index');

      const backendData = {
        merchantId: 'test',
        merchantName: 'Test',
        gatewayId: 'everypay',
        gatewayMerchantId: 'test-123',
        currency: 'EUR',
        countryCode: 'EE',
        paymentReference: 'ref-123',
        mobileAccessToken: 'token-123',
        amount: 0.0,
        label: 'Card verification',
      };

      const result = await requestTokenWithBackendData(backendData);

      expect(result).toBeDefined();
      expect(result.paymentReference).toBe('test-payment-ref');
      expect(result.tokenConsentAgreed).toBe(true);
    });
  });

  describe('SDK mode functions', () => {
    it('should call native initializeSDKMode', async () => {
      const { initializeSDKMode } = require('../index');

      const config = {
        environment: 'TEST',
        countryCode: 'EE',
        apiUsername: 'test',
        apiSecret: 'secret',
      };

      const result = await initializeSDKMode(config);

      expect(result).toBeDefined();
      expect(result.isReady).toBe(true);
    });

    it('should call native makePaymentSDKMode', async () => {
      const { makePaymentSDKMode } = require('../index');

      const paymentData = {
        amount: '10.00',
        label: 'Test payment',
        orderReference: 'order-123',
        customerEmail: 'test@example.com',
      };

      const result = await makePaymentSDKMode(paymentData);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });

    it('should call native requestTokenSDKMode', async () => {
      const { requestTokenSDKMode } = require('../index');

      const result = await requestTokenSDKMode('Card verification');

      expect(result).toBeDefined();
      expect(result.paymentDetails).toBeDefined();
      expect(result.paymentDetails?.ccDetails?.token).toBe('mit-token-12345');
    });
  });

  describe('Utility functions', () => {
    it('should call native isProcessingPayment', () => {
      const { isProcessingPayment } = require('../index');

      const result = isProcessingPayment();

      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from native module', async () => {
      const { initializeWithBackendData } = require('../index');

      const testError = new Error('Native initialization failed');
      __mockInstance.setMockError(testError);

      const config = {
        environment: 'TEST',
        countryCode: 'EE',
      };
      const backendData = {
        merchantId: 'test',
        merchantName: 'Test',
        gatewayId: 'everypay',
        gatewayMerchantId: 'test-123',
        currency: 'EUR',
        countryCode: 'EE',
        paymentReference: 'ref-123',
        mobileAccessToken: 'token-123',
        amount: 10.0,
        label: 'Test payment',
      };

      await expect(
        initializeWithBackendData(config, backendData)
      ).rejects.toThrow('Native initialization failed');

      __mockInstance.setMockError(null);
    });

    it('should propagate errors from makePaymentWithBackendData', async () => {
      const { makePaymentWithBackendData } = require('../index');

      const testError = new Error('Payment failed');
      __mockInstance.setMockError(testError);

      const backendData = {
        merchantId: 'test',
        merchantName: 'Test',
        gatewayId: 'everypay',
        gatewayMerchantId: 'test-123',
        currency: 'EUR',
        countryCode: 'EE',
        paymentReference: 'ref-123',
        mobileAccessToken: 'token-123',
        amount: 10.0,
        label: 'Test payment',
      };

      await expect(makePaymentWithBackendData(backendData)).rejects.toThrow(
        'Payment failed'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Module exports', () => {
    it('should export NativeEverypayGpayRnBridge', () => {
      const { NativeEverypayGpayRnBridge } = require('../index');

      expect(NativeEverypayGpayRnBridge).toBeDefined();
    });

    it('should export GooglePayButton component', () => {
      const { GooglePayButton } = require('../index');

      expect(GooglePayButton).toBeDefined();
    });

    it('should export EstonianDefaults', () => {
      const { EstonianDefaults } = require('../index');

      expect(EstonianDefaults).toBeDefined();
    });

    it('should export GooglePayErrorCodes', () => {
      const { GooglePayErrorCodes } = require('../index');

      expect(GooglePayErrorCodes).toBeDefined();
    });
  });
});
