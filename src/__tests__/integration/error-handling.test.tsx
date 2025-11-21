/**
 * Integration tests for error handling
 * Tests all error scenarios, cancellations, and edge cases
 */

import {
  initializeWithBackendData,
  initializeSDKMode,
  makePaymentWithBackendData,
  makePaymentSDKMode,
  requestTokenWithBackendData,
  requestTokenSDKMode,
} from '../../index';
import { __mockInstance } from '../__mocks__/NativeEverypayGpayRnBridge';
import { GooglePayErrorCodes } from '../../types';
import type {
  EverypayConfig,
  GooglePayBackendData,
  SDKModePaymentData,
} from '../../types';

describe('Error Handling Integration Tests', () => {
  const mockConfig: EverypayConfig = {
    environment: 'TEST',
    countryCode: 'EE',
    currencyCode: 'EUR',
    apiUsername: 'test-user',
    apiSecret: 'test-secret',
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

  const mockPaymentData: SDKModePaymentData = {
    amount: '10.00',
    label: 'Test',
    orderReference: 'order-123',
    customerEmail: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockInstance.resetMocks();
  });

  describe('Initialization errors', () => {
    it('should handle invalid configuration error', async () => {
      const error = Object.assign(new Error('Invalid configuration'), {
        code: GooglePayErrorCodes.INVALID_CONFIG,
      });
      __mockInstance.setMockError(error);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Invalid configuration'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle initialization failed error', async () => {
      const error = Object.assign(new Error('Initialization failed'), {
        code: GooglePayErrorCodes.INITIALIZATION_FAILED,
      });
      __mockInstance.setMockError(error);

      await expect(
        initializeWithBackendData(mockConfig, mockBackendData)
      ).rejects.toThrow('Initialization failed');

      __mockInstance.setMockError(null);
    });

    it('should handle network errors during initialization', async () => {
      const networkError = new Error('Network request failed');
      __mockInstance.setMockError(networkError);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Network request failed'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle Google Pay unavailable error', async () => {
      const error = Object.assign(new Error('Google Pay is not available'), {
        code: GooglePayErrorCodes.GOOGLE_PAY_UNAVAILABLE,
      });
      __mockInstance.setMockError(error);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Google Pay is not available'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Payment cancellation errors', () => {
    it('should handle user cancellation in backend mode', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      const cancelError = Object.assign(new Error('Payment cancelled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(makePaymentWithBackendData(mockBackendData)).rejects.toThrow(
        'Payment cancelled'
      );
      await expect(
        makePaymentWithBackendData(mockBackendData)
      ).rejects.toMatchObject({
        code: 'E_PAYMENT_CANCELED',
      });

      __mockInstance.setMockError(null);
    });

    it('should handle user cancellation in SDK mode', async () => {
      await initializeSDKMode(mockConfig);

      const cancelError = Object.assign(new Error('User cancelled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'User cancelled'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle cancellation during token request', async () => {
      await initializeSDKMode(mockConfig);

      const cancelError = Object.assign(
        new Error('Card verification cancelled'),
        {
          code: 'E_PAYMENT_CANCELED',
        }
      );
      __mockInstance.setMockError(cancelError);

      await expect(requestTokenSDKMode('Card verification')).rejects.toThrow(
        'Card verification cancelled'
      );

      __mockInstance.setMockError(null);
    });

    it('should distinguish between cancellation and other errors', async () => {
      await initializeSDKMode(mockConfig);

      // Test cancellation
      const cancelError = Object.assign(new Error('Cancelled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      const cancelPromise = makePaymentSDKMode(mockPaymentData);
      await expect(cancelPromise).rejects.toMatchObject({
        code: 'E_PAYMENT_CANCELED',
      });

      // Test other error
      const otherError = Object.assign(new Error('Payment failed'), {
        code: GooglePayErrorCodes.PAYMENT_FAILED,
      });
      __mockInstance.setMockError(otherError);

      const failPromise = makePaymentSDKMode(mockPaymentData);
      await expect(failPromise).rejects.toMatchObject({
        code: GooglePayErrorCodes.PAYMENT_FAILED,
      });

      __mockInstance.setMockError(null);
    });
  });

  describe('Payment failure errors', () => {
    it('should handle payment failed error', async () => {
      await initializeSDKMode(mockConfig);

      const error = Object.assign(new Error('Payment declined'), {
        code: GooglePayErrorCodes.PAYMENT_FAILED,
      });
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Payment declined'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle invalid payment data error', async () => {
      await initializeSDKMode(mockConfig);

      const error = Object.assign(new Error('Invalid amount'), {
        code: GooglePayErrorCodes.INVALID_PAYMENT_DATA,
      });
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Invalid amount'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle payment parse error', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      const error = Object.assign(new Error('Failed to parse response'), {
        code: GooglePayErrorCodes.PAYMENT_PARSE_ERROR,
      });
      __mockInstance.setMockError(error);

      await expect(makePaymentWithBackendData(mockBackendData)).rejects.toThrow(
        'Failed to parse response'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle generic payment error', async () => {
      await initializeSDKMode(mockConfig);

      const error = Object.assign(new Error('Unknown payment error'), {
        code: GooglePayErrorCodes.PAYMENT_ERROR,
      });
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Unknown payment error'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle not initialized error', async () => {
      const error = Object.assign(new Error('Google Pay not initialized'), {
        code: GooglePayErrorCodes.NOT_INITIALIZED,
      });
      __mockInstance.setMockError(error);

      // Try to make payment without initialization
      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Google Pay not initialized'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Network and timeout errors', () => {
    it('should handle network timeout', async () => {
      await initializeSDKMode(mockConfig);

      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      __mockInstance.setMockError(timeoutError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Request timeout'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle network connection error', async () => {
      const connectionError = new Error('Network connection lost');
      __mockInstance.setMockError(connectionError);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Network connection lost'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle server errors (5xx)', async () => {
      await initializeSDKMode(mockConfig);

      const serverError = Object.assign(new Error('Internal server error'), {
        statusCode: 500,
      });
      __mockInstance.setMockError(serverError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Internal server error'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle client errors (4xx)', async () => {
      await initializeSDKMode(mockConfig);

      const clientError = Object.assign(new Error('Bad request'), {
        statusCode: 400,
      });
      __mockInstance.setMockError(clientError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Bad request'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Token request errors', () => {
    it('should handle token request failure in backend mode', async () => {
      const tokenData = {
        ...mockBackendData,
        amount: 0.0,
      };

      await initializeWithBackendData(mockConfig, tokenData);

      const error = new Error('Token request failed');
      __mockInstance.setMockError(error);

      await expect(requestTokenWithBackendData(tokenData)).rejects.toThrow(
        'Token request failed'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle token request failure in SDK mode', async () => {
      await initializeSDKMode(mockConfig);

      const error = new Error('Card verification failed');
      __mockInstance.setMockError(error);

      await expect(requestTokenSDKMode('Card verification')).rejects.toThrow(
        'Card verification failed'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle invalid card error during token request', async () => {
      await initializeSDKMode(mockConfig);

      const error = Object.assign(new Error('Invalid card'), {
        code: GooglePayErrorCodes.INVALID_PAYMENT_DATA,
      });
      __mockInstance.setMockError(error);

      await expect(requestTokenSDKMode('Card setup')).rejects.toThrow(
        'Invalid card'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Error recovery scenarios', () => {
    it('should allow retry after initialization failure', async () => {
      // First attempt fails
      const error = new Error('Temporary error');
      __mockInstance.setMockError(error);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Temporary error'
      );

      // Second attempt succeeds
      __mockInstance.setMockError(null);

      const result = await initializeSDKMode(mockConfig);
      expect(result.isReady).toBe(true);
    });

    it('should allow retry after payment failure', async () => {
      await initializeSDKMode(mockConfig);

      // First payment fails
      const error = new Error('Card declined');
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Card declined'
      );

      // Retry succeeds
      __mockInstance.setMockError(null);

      const result = await makePaymentSDKMode(mockPaymentData);
      expect(result.status).toBe('success');
    });

    it('should allow retry after cancellation', async () => {
      await initializeSDKMode(mockConfig);

      // First attempt cancelled
      const cancelError = Object.assign(new Error('Cancelled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Cancelled'
      );

      // Retry succeeds
      __mockInstance.setMockError(null);

      const result = await makePaymentSDKMode(mockPaymentData);
      expect(result.status).toBe('success');
    });

    it('should handle multiple consecutive errors', async () => {
      await initializeSDKMode(mockConfig);

      // First error
      const error1 = new Error('Error 1');
      __mockInstance.setMockError(error1);
      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Error 1'
      );

      // Second error
      const error2 = new Error('Error 2');
      __mockInstance.setMockError(error2);
      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Error 2'
      );

      // Finally succeeds
      __mockInstance.setMockError(null);
      const result = await makePaymentSDKMode(mockPaymentData);
      expect(result.status).toBe('success');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty error messages', async () => {
      await initializeSDKMode(mockConfig);

      const error = new Error('');
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow();

      __mockInstance.setMockError(null);
    });

    it('should handle error without code property', async () => {
      await initializeSDKMode(mockConfig);

      const error = new Error('Generic error');
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Generic error'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle error with additional properties', async () => {
      await initializeSDKMode(mockConfig);

      const error = Object.assign(new Error('Detailed error'), {
        code: 'CUSTOM_ERROR',
        details: { reason: 'Card expired', expiry: '12/2020' },
        timestamp: Date.now(),
      });
      __mockInstance.setMockError(error);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toMatchObject({
        message: 'Detailed error',
        code: 'CUSTOM_ERROR',
        details: { reason: 'Card expired', expiry: '12/2020' },
      });

      __mockInstance.setMockError(null);
    });

    it('should propagate error stack traces', async () => {
      await initializeSDKMode(mockConfig);

      const error = new Error('Test error');
      __mockInstance.setMockError(error);

      try {
        await makePaymentSDKMode(mockPaymentData);
      } catch (e: any) {
        expect(e.stack).toBeDefined();
        expect(e.stack).toContain('Test error');
      }

      __mockInstance.setMockError(null);
    });
  });

  describe('Error codes coverage', () => {
    it('should have all error codes defined', () => {
      expect(GooglePayErrorCodes.UNSUPPORTED_PLATFORM).toBeDefined();
      expect(GooglePayErrorCodes.INVALID_CONFIG).toBeDefined();
      expect(GooglePayErrorCodes.INITIALIZATION_FAILED).toBeDefined();
      expect(GooglePayErrorCodes.PAYMENT_CANCELLED).toBeDefined();
      expect(GooglePayErrorCodes.PAYMENT_FAILED).toBeDefined();
      expect(GooglePayErrorCodes.INVALID_PAYMENT_DATA).toBeDefined();
      expect(GooglePayErrorCodes.NOT_INITIALIZED).toBeDefined();
      expect(GooglePayErrorCodes.PAYMENT_ERROR).toBeDefined();
      expect(GooglePayErrorCodes.PAYMENT_PARSE_ERROR).toBeDefined();
      expect(GooglePayErrorCodes.GOOGLE_PAY_UNAVAILABLE).toBeDefined();
    });

    it('should handle all error code scenarios', async () => {
      const errorScenarios = [
        {
          code: GooglePayErrorCodes.INVALID_CONFIG,
          message: 'Invalid configuration',
        },
        {
          code: GooglePayErrorCodes.INITIALIZATION_FAILED,
          message: 'Initialization failed',
        },
        {
          code: GooglePayErrorCodes.PAYMENT_FAILED,
          message: 'Payment failed',
        },
        {
          code: GooglePayErrorCodes.INVALID_PAYMENT_DATA,
          message: 'Invalid payment data',
        },
        {
          code: GooglePayErrorCodes.NOT_INITIALIZED,
          message: 'Not initialized',
        },
        {
          code: GooglePayErrorCodes.PAYMENT_ERROR,
          message: 'Payment error',
        },
        {
          code: GooglePayErrorCodes.PAYMENT_PARSE_ERROR,
          message: 'Parse error',
        },
        {
          code: GooglePayErrorCodes.GOOGLE_PAY_UNAVAILABLE,
          message: 'Service unavailable',
        },
      ];

      for (const scenario of errorScenarios) {
        const error = Object.assign(new Error(scenario.message), {
          code: scenario.code,
        });
        __mockInstance.setMockError(error);

        await expect(initializeSDKMode(mockConfig)).rejects.toMatchObject({
          message: scenario.message,
          code: scenario.code,
        });
      }

      __mockInstance.setMockError(null);
    });
  });
});
