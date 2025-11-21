/**
 * Integration tests for SDK mode
 * Tests the complete flow: initialize → payment/token → callbacks
 */

import {
  initializeSDKMode,
  makePaymentSDKMode,
  requestTokenSDKMode,
  isProcessingPayment,
} from '../../index';
import { __mockInstance } from '../__mocks__/NativeEverypayGpayRnBridge';
import type { EverypayConfig, SDKModePaymentData } from '../../types';

describe('SDK Mode Integration Tests', () => {
  const mockConfig: EverypayConfig = {
    environment: 'TEST',
    countryCode: 'EE',
    currencyCode: 'EUR',
    apiUsername: 'test-api-user',
    apiSecret: 'test-api-secret-key',
    accountName: 'Test Account',
  };

  const mockPaymentData: SDKModePaymentData = {
    amount: '25.50',
    label: 'Test Product Purchase',
    orderReference: 'order-12345',
    customerEmail: 'customer@example.com',
    customerIp: '192.168.1.1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockInstance.resetMocks();
  });

  describe('Initialization flow', () => {
    it('should successfully initialize in SDK mode', async () => {
      const result = await initializeSDKMode(mockConfig);

      expect(result).toBeDefined();
      expect(result.isReady).toBe(true);
      expect(result.gatewayId).toBe('everypay');
      expect(result.gatewayMerchantId).toBeDefined();
    });

    it('should handle initialization failures gracefully', async () => {
      const initError = new Error('Invalid API credentials');
      __mockInstance.setMockError(initError);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Invalid API credentials'
      );

      __mockInstance.setMockError(null);
    });

    it('should allow re-initialization', async () => {
      // First initialization
      const result1 = await initializeSDKMode(mockConfig);
      expect(result1.isReady).toBe(true);

      // Second initialization
      const result2 = await initializeSDKMode(mockConfig);
      expect(result2.isReady).toBe(true);
    });
  });

  describe('Payment flow', () => {
    it('should complete a successful payment flow', async () => {
      // Step 1: Initialize
      const initResult = await initializeSDKMode(mockConfig);
      expect(initResult.isReady).toBe(true);

      // Step 2: Make payment
      const paymentResult = await makePaymentSDKMode(mockPaymentData);

      // Verify payment result
      expect(paymentResult).toBeDefined();
      expect(paymentResult.status).toBe('success');
    });

    it('should track payment processing state', async () => {
      await initializeSDKMode(mockConfig);

      // Not processing initially
      expect(isProcessingPayment()).toBe(false);

      // Start payment
      const paymentPromise = makePaymentSDKMode(mockPaymentData);

      // Should complete and no longer be processing
      await paymentPromise;
      expect(isProcessingPayment()).toBe(false);
    });

    it('should handle payment failure', async () => {
      await initializeSDKMode(mockConfig);

      const paymentError = new Error('Insufficient funds');
      __mockInstance.setMockError(paymentError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Insufficient funds'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle user cancellation', async () => {
      await initializeSDKMode(mockConfig);

      const cancelError = Object.assign(new Error('User canceled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'User canceled'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle payment without customer IP', async () => {
      await initializeSDKMode(mockConfig);

      const paymentDataNoIp = {
        amount: '10.00',
        label: 'Test',
        orderReference: 'order-456',
        customerEmail: 'test@example.com',
      };

      const result = await makePaymentSDKMode(paymentDataNoIp);
      expect(result.status).toBe('success');
    });
  });

  describe('Token request flow (recurring payments)', () => {
    it('should complete a successful token request', async () => {
      // Step 1: Initialize
      const initResult = await initializeSDKMode(mockConfig);
      expect(initResult.isReady).toBe(true);

      // Step 2: Request token
      const tokenResult = await requestTokenSDKMode('Card verification');

      // Verify token result structure
      expect(tokenResult).toBeDefined();
      expect(tokenResult.paymentReference).toBeDefined();
      expect(tokenResult.mobileAccessToken).toBeDefined();
      expect(tokenResult.signature).toBeDefined();
      expect(tokenResult.tokenConsentAgreed).toBe(true);

      // Verify payment details with MIT token
      expect(tokenResult.paymentDetails).toBeDefined();
      expect(tokenResult.paymentDetails?.paymentState).toBe('settled');
      expect(tokenResult.paymentDetails?.ccDetails).toBeDefined();
      expect(tokenResult.paymentDetails?.ccDetails?.token).toBe(
        'mit-token-12345'
      );
      expect(tokenResult.paymentDetails?.ccDetails?.lastFourDigits).toBe(
        '1234'
      );
    });

    it('should handle token request failure', async () => {
      await initializeSDKMode(mockConfig);

      const tokenError = new Error('Card verification failed');
      __mockInstance.setMockError(tokenError);

      await expect(requestTokenSDKMode('Card setup')).rejects.toThrow(
        'Card verification failed'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle different token labels', async () => {
      await initializeSDKMode(mockConfig);

      const labels = [
        'Card verification',
        'Save card for subscriptions',
        'Setup recurring payment',
      ];

      for (const label of labels) {
        const result = await requestTokenSDKMode(label);
        expect(result).toBeDefined();
        expect(result.paymentDetails?.ccDetails?.token).toBeDefined();
      }
    });
  });

  describe('End-to-end scenarios', () => {
    it('should handle complete payment workflow', async () => {
      // Scenario: User initiates payment → SDK processes everything

      // Step 1: Initialize SDK
      const initResult = await initializeSDKMode(mockConfig);
      expect(initResult.isReady).toBe(true);

      // Step 2: User confirms payment
      const paymentResult = await makePaymentSDKMode(mockPaymentData);
      expect(paymentResult.status).toBe('success');
    });

    it('should handle recurring payment setup workflow', async () => {
      // Scenario: User sets up recurring payment → SDK handles verification →
      // MIT token returned for future use

      // Step 1: Initialize
      const initResult = await initializeSDKMode(mockConfig);
      expect(initResult.isReady).toBe(true);

      // Step 2: Request token
      const tokenResult = await requestTokenSDKMode('Setup subscription');
      expect(tokenResult.paymentDetails?.ccDetails?.token).toBeDefined();

      // Step 3: Store MIT token for future charges (simulated)
      const mitToken = tokenResult.paymentDetails?.ccDetails?.token;
      expect(mitToken).toBe('mit-token-12345');
      expect(mitToken).toMatch(/^[a-zA-Z0-9-]+$/); // Alphanumeric with hyphens
    });

    it('should handle sequential payments', async () => {
      // Initialize once
      await initializeSDKMode(mockConfig);

      // Make multiple payments
      const payment1 = await makePaymentSDKMode({
        ...mockPaymentData,
        orderReference: 'order-1',
      });
      expect(payment1.status).toBe('success');

      const payment2 = await makePaymentSDKMode({
        ...mockPaymentData,
        orderReference: 'order-2',
      });
      expect(payment2.status).toBe('success');

      const payment3 = await makePaymentSDKMode({
        ...mockPaymentData,
        orderReference: 'order-3',
      });
      expect(payment3.status).toBe('success');
    });

    it('should handle mixed payment and token requests', async () => {
      await initializeSDKMode(mockConfig);

      // Make a payment
      const payment = await makePaymentSDKMode(mockPaymentData);
      expect(payment.status).toBe('success');

      // Request a token
      const token = await requestTokenSDKMode('Card verification');
      expect(token.paymentDetails?.ccDetails?.token).toBeDefined();

      // Make another payment
      const payment2 = await makePaymentSDKMode({
        ...mockPaymentData,
        orderReference: 'order-456',
      });
      expect(payment2.status).toBe('success');
    });
  });

  describe('Configuration variations', () => {
    it('should work with minimal SDK configuration', async () => {
      const minimalConfig: EverypayConfig = {
        environment: 'TEST',
        countryCode: 'EE',
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
      };

      const result = await initializeSDKMode(minimalConfig);
      expect(result.isReady).toBe(true);
    });

    it('should work with full SDK configuration', async () => {
      const fullConfig: EverypayConfig = {
        environment: 'TEST',
        countryCode: 'EE',
        currencyCode: 'EUR',
        apiUsername: 'test-user',
        apiSecret: 'test-secret',
        apiUrl: 'https://api.everypay.com',
        accountName: 'Test Account',
        customerUrl: 'https://example.com',
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
        allowedCardAuthMethods: ['CRYPTOGRAM_3DS'],
      };

      const result = await initializeSDKMode(fullConfig);
      expect(result.isReady).toBe(true);
    });

    it('should work in production environment', async () => {
      const prodConfig: EverypayConfig = {
        ...mockConfig,
        environment: 'PRODUCTION',
      };

      const result = await initializeSDKMode(prodConfig);
      expect(result.isReady).toBe(true);
    });
  });

  describe('Error recovery', () => {
    it('should recover from failed initialization and succeed on retry', async () => {
      // First attempt fails
      const initError = new Error('Network timeout');
      __mockInstance.setMockError(initError);

      await expect(initializeSDKMode(mockConfig)).rejects.toThrow(
        'Network timeout'
      );

      // Clear error and retry
      __mockInstance.setMockError(null);

      const result = await initializeSDKMode(mockConfig);
      expect(result.isReady).toBe(true);
    });

    it('should recover from failed payment and allow retry', async () => {
      await initializeSDKMode(mockConfig);

      // First payment fails
      const paymentError = new Error('Payment gateway error');
      __mockInstance.setMockError(paymentError);

      await expect(makePaymentSDKMode(mockPaymentData)).rejects.toThrow(
        'Payment gateway error'
      );

      // Clear error and retry
      __mockInstance.setMockError(null);

      const result = await makePaymentSDKMode(mockPaymentData);
      expect(result.status).toBe('success');
    });

    it('should handle token request retry after cancellation', async () => {
      await initializeSDKMode(mockConfig);

      // User cancels first attempt
      const cancelError = Object.assign(new Error('Canceled'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(requestTokenSDKMode('Card verification')).rejects.toThrow(
        'Canceled'
      );

      // User retries
      __mockInstance.setMockError(null);

      const result = await requestTokenSDKMode('Card verification');
      expect(result.paymentDetails?.ccDetails?.token).toBeDefined();
    });
  });

  describe('Payment data validation', () => {
    it('should handle various amount formats', async () => {
      await initializeSDKMode(mockConfig);

      const amounts = ['0.01', '10.00', '999.99', '1234.56'];

      for (const amount of amounts) {
        const paymentData = {
          ...mockPaymentData,
          amount,
          orderReference: `order-${amount}`,
        };

        const result = await makePaymentSDKMode(paymentData);
        expect(result.status).toBe('success');
      }
    });

    it('should handle long order references', async () => {
      await initializeSDKMode(mockConfig);

      const longOrderRef = 'order-' + 'x'.repeat(100);
      const paymentData = {
        ...mockPaymentData,
        orderReference: longOrderRef,
      };

      const result = await makePaymentSDKMode(paymentData);
      expect(result.status).toBe('success');
    });

    it('should handle special characters in labels', async () => {
      await initializeSDKMode(mockConfig);

      const labels = [
        'Product: Special Item',
        'Order #12345',
        'Payment for "Premium Service"',
        'Déjà vu café',
      ];

      for (const label of labels) {
        const paymentData = {
          ...mockPaymentData,
          label,
          orderReference: `order-${Date.now()}`,
        };

        const result = await makePaymentSDKMode(paymentData);
        expect(result.status).toBe('success');
      }
    });
  });
});
