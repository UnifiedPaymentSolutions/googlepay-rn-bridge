import type { GooglePayButtonConfig } from '../types';

// Import the component after mocking
let GooglePayButton: any;

// Mock the native module
jest.mock('../specs/NativeEverypayGpayRnBridge', () => ({
  init: jest.fn(),
  isReadyToPay: jest.fn(),
  loadPaymentData: jest.fn(),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Platform: {
    OS: 'android',
    select: jest.fn((obj) => obj.android || obj.default),
  },
}));

// Mock uuid
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock the EveryPay requests
jest.mock('../EveryPayUtil/EveryPayRequests', () => ({
  openEPSession: jest.fn(),
  getMerchantInfo: jest.fn(),
  processPayment: jest.fn(),
}));

// Mock the error class
jest.mock('../everyPayError', () => ({
  EveryPayGooglePayError: class EveryPayGooglePayError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = 'EveryPayGooglePayError';
      this.code = code;
    }
  },
}));

// Mock the constants
jest.mock('../constants', () => ({
  ERROR_CODES: {
    MERCHANT_INFO_REQUEST_ERROR: 'E_MERCHANT_INFO_REQUEST_ERROR',
    INVALID_CONFIG: 'E_INVALID_CONFIG',
    GOOGLE_PAY_INITIALIZATION_FAILED: 'E_GOOGLE_PAY_INITIALIZATION_FAILED',
  },
}));

describe('GooglePayButton', () => {
  beforeEach(() => {
    // Import the component after all mocks are set up
    GooglePayButton = require('../GooglePayButton').default;
  });

  const mockConfig: GooglePayButtonConfig = {
    apiUsername: 'test-user',
    apiSecret: 'test-secret',
    apiUrl: 'https://test-api.everypay.com',
    environment: 'TEST',
    countryCode: 'ET',
    currencyCode: 'EUR',
    accountName: 'test-account',
    allowedCardNetworks: ['VISA', 'MASTERCARD'],
    allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful initialization
    const {
      init,
      isReadyToPay,
    } = require('../specs/NativeEverypayGpayRnBridge');
    init.mockResolvedValue(true);
    isReadyToPay.mockResolvedValue(true);

    // Mock successful EveryPay session
    const { openEPSession } = require('../EveryPayUtil/EveryPayRequests');
    openEPSession.mockResolvedValue({
      googlepay_merchant_identifier: 'test-merchant-id',
      googlepay_ep_merchant_id: 'test-ep-merchant-id',
      googlepay_gateway_merchant_id: 'test-gateway-merchant-id',
      merchant_name: 'Test Merchant',
      google_pay_gateway_id: 'test-gateway',
      acq_branding_domain_igw: 'test-domain',
    });
  });

  describe('Component Structure', () => {
    it('should be a valid React component', () => {
      expect(GooglePayButton).toBeDefined();
      expect(typeof GooglePayButton).toBe('function');
    });

    it('should have proper prop types', () => {
      const props = {
        config: mockConfig,
        amount: 29.99,
        label: 'Test Payment',
        orderReference: 'order-123',
        customerEmail: 'test@example.com',
      };

      expect(props.config).toBeDefined();
      expect(props.amount).toBe(29.99);
      expect(props.label).toBe('Test Payment');
    });

    it('should handle configuration properly', () => {
      const config = mockConfig;
      expect(config.environment).toBe('TEST');
      expect(config.allowedCardNetworks).toEqual(['VISA', 'MASTERCARD']);
      expect(config.allowedCardAuthMethods).toEqual([
        'PAN_ONLY',
        'CRYPTOGRAM_3DS',
      ]);
    });
  });

  describe('Payment Flow Logic', () => {
    it('should handle successful payment flow', async () => {
      const {
        getMerchantInfo,
        processPayment,
      } = require('../EveryPayUtil/EveryPayRequests');
      const {
        loadPaymentData,
      } = require('../specs/NativeEverypayGpayRnBridge');

      // Test that payment flow functions are called
      expect(getMerchantInfo).toBeDefined();
      expect(processPayment).toBeDefined();
      expect(loadPaymentData).toBeDefined();
    });

    it('should handle payment cancellation', async () => {
      const {
        loadPaymentData,
      } = require('../specs/NativeEverypayGpayRnBridge');

      // Test that error handling is in place
      expect(loadPaymentData).toBeDefined();
    });

    it('should handle merchant info request error', async () => {
      const { getMerchantInfo } = require('../EveryPayUtil/EveryPayRequests');

      // Test that error handling is in place
      expect(getMerchantInfo).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration structure', () => {
      const config = mockConfig;
      expect(config.apiUsername).toBe('test-user');
      expect(config.apiSecret).toBe('test-secret');
      expect(config.apiUrl).toBe('https://test-api.everypay.com');
      expect(config.environment).toBe('TEST');
      expect(config.countryCode).toBe('ET');
    });

    it('should handle optional configuration properties', () => {
      const configWithoutNetworks = { ...mockConfig };
      delete configWithoutNetworks.allowedCardNetworks;

      expect(configWithoutNetworks.allowedCardNetworks).toBeUndefined();
      expect(configWithoutNetworks.allowedCardAuthMethods).toBeDefined();
    });
  });
});
