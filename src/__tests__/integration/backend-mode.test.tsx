/**
 * Integration tests for Backend mode
 * Tests the complete flow: initialize → payment/token → callbacks
 */

import {
  initializeWithBackendData,
  makePaymentWithBackendData,
  requestTokenWithBackendData,
  isProcessingPayment,
} from '../../index';
import { __mockInstance } from '../__mocks__/NativeEverypayGpayRnBridge';
import type { EverypayConfig, GooglePayBackendData } from '../../types';

describe('Backend Mode Integration Tests', () => {
  const mockConfig: EverypayConfig = {
    environment: 'TEST',
    countryCode: 'EE',
    currencyCode: 'EUR',
  };

  const mockBackendData: GooglePayBackendData = {
    merchantId: 'test-merchant-123',
    merchantName: 'Test Merchant Store',
    gatewayId: 'everypay',
    gatewayMerchantId: 'everypay-merchant-456',
    currency: 'EUR',
    countryCode: 'EE',
    paymentReference: 'payment-ref-789',
    mobileAccessToken: 'mobile-token-abc',
    amount: 25.5,
    label: 'Test Product',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockInstance.resetMocks();
  });

  describe('Initialization flow', () => {
    it('should successfully initialize with backend data', async () => {
      const result = await initializeWithBackendData(
        mockConfig,
        mockBackendData
      );

      expect(result).toBeDefined();
      expect(result.isReady).toBe(true);
      expect(result.gatewayId).toBe('everypay');
      expect(result.gatewayMerchantId).toBeDefined();
    });

    it('should handle initialization failures gracefully', async () => {
      const initError = new Error('Network error during initialization');
      __mockInstance.setMockError(initError);

      await expect(
        initializeWithBackendData(mockConfig, mockBackendData)
      ).rejects.toThrow('Network error during initialization');

      __mockInstance.setMockError(null);
    });

    it('should allow re-initialization with different config', async () => {
      // First initialization
      const result1 = await initializeWithBackendData(
        mockConfig,
        mockBackendData
      );
      expect(result1.isReady).toBe(true);

      // Second initialization with different data
      const newBackendData = {
        ...mockBackendData,
        paymentReference: 'new-payment-ref',
      };

      const result2 = await initializeWithBackendData(
        mockConfig,
        newBackendData
      );
      expect(result2.isReady).toBe(true);
    });
  });

  describe('Payment flow', () => {
    it('should complete a successful payment flow', async () => {
      // Step 1: Initialize
      const initResult = await initializeWithBackendData(
        mockConfig,
        mockBackendData
      );
      expect(initResult.isReady).toBe(true);

      // Step 2: Make payment
      const tokenData = await makePaymentWithBackendData(mockBackendData);

      // Verify token data structure
      expect(tokenData).toBeDefined();
      expect(tokenData.paymentReference).toBe('test-payment-ref');
      expect(tokenData.mobileAccessToken).toBeDefined();
      expect(tokenData.signature).toBeDefined();
      expect(tokenData.intermediateSigningKey).toBeDefined();
      expect(tokenData.intermediateSigningKey.signedKey).toBeDefined();
      expect(tokenData.intermediateSigningKey.signatures).toBeInstanceOf(Array);
      expect(tokenData.protocolVersion).toBeDefined();
      expect(tokenData.signedMessage).toBeDefined();
      expect(tokenData.tokenConsentAgreed).toBe(true);
    });

    it('should track payment processing state', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      // Not processing initially
      expect(isProcessingPayment()).toBe(false);

      // Start payment (async - won't wait for completion)
      const paymentPromise = makePaymentWithBackendData(mockBackendData);

      // Should complete and no longer be processing
      await paymentPromise;
      expect(isProcessingPayment()).toBe(false);
    });

    it('should handle payment failure', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      const paymentError = new Error('Payment declined by bank');
      __mockInstance.setMockError(paymentError);

      await expect(makePaymentWithBackendData(mockBackendData)).rejects.toThrow(
        'Payment declined by bank'
      );

      __mockInstance.setMockError(null);
    });

    it('should handle user cancellation', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      const cancelError = Object.assign(new Error('User canceled payment'), {
        code: 'E_PAYMENT_CANCELED',
      });
      __mockInstance.setMockError(cancelError);

      await expect(makePaymentWithBackendData(mockBackendData)).rejects.toThrow(
        'User canceled payment'
      );

      __mockInstance.setMockError(null);
    });
  });

  describe('Token request flow (recurring payments)', () => {
    it('should complete a successful token request', async () => {
      // Step 1: Initialize with zero-amount for token request
      const tokenBackendData = {
        ...mockBackendData,
        amount: 0.0,
        label: 'Card verification',
      };

      const initResult = await initializeWithBackendData(
        mockConfig,
        tokenBackendData
      );
      expect(initResult.isReady).toBe(true);

      // Step 2: Request token
      const tokenData = await requestTokenWithBackendData(tokenBackendData);

      // Verify token data structure
      expect(tokenData).toBeDefined();
      expect(tokenData.paymentReference).toBeDefined();
      expect(tokenData.mobileAccessToken).toBeDefined();
      expect(tokenData.signature).toBeDefined();
      expect(tokenData.tokenConsentAgreed).toBe(true);
    });

    it('should handle token request failure', async () => {
      const tokenBackendData = {
        ...mockBackendData,
        amount: 0.0,
        label: 'Card verification',
      };

      await initializeWithBackendData(mockConfig, tokenBackendData);

      const tokenError = new Error('Token request failed');
      __mockInstance.setMockError(tokenError);

      await expect(
        requestTokenWithBackendData(tokenBackendData)
      ).rejects.toThrow('Token request failed');

      __mockInstance.setMockError(null);
    });
  });

  describe('End-to-end scenarios', () => {
    it('should handle complete payment workflow from init to completion', async () => {
      // Scenario: User initiates payment → Backend creates session →
      // App initializes → User confirms → Backend processes

      // Step 1: Backend creates payment session (simulated)
      const sessionData = {
        ...mockBackendData,
        paymentReference: 'session-' + Date.now(),
      };

      // Step 2: App initializes with session data
      const initResult = await initializeWithBackendData(
        mockConfig,
        sessionData
      );
      expect(initResult.isReady).toBe(true);

      // Step 3: User confirms payment
      const tokenData = await makePaymentWithBackendData(sessionData);
      expect(tokenData).toBeDefined();

      // Step 4: Backend would process token (simulated check)
      expect(tokenData.paymentReference).toBe('test-payment-ref');
      expect(tokenData.signature).toBeDefined();
    });

    it('should handle recurring payment setup workflow', async () => {
      // Scenario: User sets up recurring payment → Zero-amount authorization →
      // MIT token stored for future use

      // Step 1: Backend creates zero-amount session for card verification
      const zeroAmountSession = {
        ...mockBackendData,
        amount: 0.0,
        label: 'Setup recurring payment',
        paymentReference: 'recurring-setup-' + Date.now(),
      };

      // Step 2: Initialize
      const initResult = await initializeWithBackendData(
        mockConfig,
        zeroAmountSession
      );
      expect(initResult.isReady).toBe(true);

      // Step 3: Request token
      const tokenData = await requestTokenWithBackendData(zeroAmountSession);
      expect(tokenData).toBeDefined();
      expect(tokenData.tokenConsentAgreed).toBe(true);

      // Step 4: Backend would process and extract MIT token (simulated check)
      expect(tokenData.paymentReference).toBeDefined();
    });

    it('should handle sequential payments', async () => {
      // Initialize once
      await initializeWithBackendData(mockConfig, mockBackendData);

      // Make first payment
      const payment1 = await makePaymentWithBackendData({
        ...mockBackendData,
        paymentReference: 'payment-1',
      });
      expect(payment1).toBeDefined();

      // Make second payment
      const payment2 = await makePaymentWithBackendData({
        ...mockBackendData,
        paymentReference: 'payment-2',
      });
      expect(payment2).toBeDefined();

      // Both should succeed
      expect(payment1.paymentReference).toBeDefined();
      expect(payment2.paymentReference).toBeDefined();
    });
  });

  describe('Configuration variations', () => {
    it('should work with custom allowed card networks', async () => {
      const customConfig: EverypayConfig = {
        ...mockConfig,
        allowedCardNetworks: ['VISA'],
      };

      const result = await initializeWithBackendData(
        customConfig,
        mockBackendData
      );
      expect(result.isReady).toBe(true);
    });

    it('should work with custom auth methods', async () => {
      const customConfig: EverypayConfig = {
        ...mockConfig,
        allowedCardAuthMethods: ['CRYPTOGRAM_3DS'],
      };

      const result = await initializeWithBackendData(
        customConfig,
        mockBackendData
      );
      expect(result.isReady).toBe(true);
    });

    it('should work in production environment', async () => {
      const prodConfig: EverypayConfig = {
        ...mockConfig,
        environment: 'PRODUCTION',
      };

      const result = await initializeWithBackendData(
        prodConfig,
        mockBackendData
      );
      expect(result.isReady).toBe(true);
    });
  });

  describe('Error recovery', () => {
    it('should recover from failed initialization and succeed on retry', async () => {
      // First attempt fails
      const initError = new Error('Temporary network error');
      __mockInstance.setMockError(initError);

      await expect(
        initializeWithBackendData(mockConfig, mockBackendData)
      ).rejects.toThrow('Temporary network error');

      // Clear error and retry
      __mockInstance.setMockError(null);

      const result = await initializeWithBackendData(
        mockConfig,
        mockBackendData
      );
      expect(result.isReady).toBe(true);
    });

    it('should recover from failed payment and allow retry', async () => {
      await initializeWithBackendData(mockConfig, mockBackendData);

      // First payment fails
      const paymentError = new Error('Card declined');
      __mockInstance.setMockError(paymentError);

      await expect(makePaymentWithBackendData(mockBackendData)).rejects.toThrow(
        'Card declined'
      );

      // Clear error and retry
      __mockInstance.setMockError(null);

      const tokenData = await makePaymentWithBackendData(mockBackendData);
      expect(tokenData).toBeDefined();
    });
  });
});
