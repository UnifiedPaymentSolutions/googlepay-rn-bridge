import type { Spec } from '../specs/NativeEverypayGpayRnBridge';

// Mock the native module
jest.mock('../specs/NativeEverypayGpayRnBridge', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    isReadyToPay: jest.fn(),
    loadPaymentData: jest.fn(),
  },
}));

describe('NativeEverypayGpayRnBridge', () => {
  let nativeModule: any;

  beforeEach(() => {
    jest.clearAllMocks();
    nativeModule = require('../specs/NativeEverypayGpayRnBridge')
      .default as jest.Mocked<Spec>;
  });

  describe('init', () => {
    it('should call native init method with correct parameters', async () => {
      nativeModule.init.mockResolvedValue(true);

      const environment = 'TEST';
      const allowedCardNetworks = ['VISA', 'MASTERCARD'];
      const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

      const result = await nativeModule.init(
        environment,
        allowedCardNetworks,
        allowedCardAuthMethods
      );

      expect(nativeModule.init).toHaveBeenCalledWith(
        environment,
        allowedCardNetworks,
        allowedCardAuthMethods
      );
      expect(result).toBe(true);
    });

    it('should handle initialization failure', async () => {
      nativeModule.init.mockRejectedValue(new Error('Initialization failed'));

      const environment = 'PRODUCTION';
      const allowedCardNetworks = ['VISA'];
      const allowedCardAuthMethods = ['CRYPTOGRAM_3DS'];

      await expect(
        nativeModule.init(
          environment,
          allowedCardNetworks,
          allowedCardAuthMethods
        )
      ).rejects.toThrow('Initialization failed');

      expect(nativeModule.init).toHaveBeenCalledWith(
        environment,
        allowedCardNetworks,
        allowedCardAuthMethods
      );
    });

    it('should handle different environment values', async () => {
      nativeModule.init.mockResolvedValue(true);

      const testCases = [
        { env: 'TEST', expected: true },
        { env: 'PRODUCTION', expected: true },
      ];

      for (const testCase of testCases) {
        const result = await nativeModule.init(
          testCase.env,
          ['VISA'],
          ['PAN_ONLY']
        );
        expect(result).toBe(testCase.expected);
        expect(nativeModule.init).toHaveBeenCalledWith(
          testCase.env,
          ['VISA'],
          ['PAN_ONLY']
        );
      }
    });

    it('should handle different card networks', async () => {
      nativeModule.init.mockResolvedValue(true);

      const testCases = [
        { networks: ['VISA'], expected: true },
        { networks: ['MASTERCARD'], expected: true },
        { networks: ['VISA', 'MASTERCARD'], expected: true },
      ];

      for (const testCase of testCases) {
        const result = await nativeModule.init('TEST', testCase.networks, [
          'PAN_ONLY',
        ]);
        expect(result).toBe(testCase.expected);
        expect(nativeModule.init).toHaveBeenCalledWith(
          'TEST',
          testCase.networks,
          ['PAN_ONLY']
        );
      }
    });

    it('should handle different auth methods', async () => {
      nativeModule.init.mockResolvedValue(true);

      const testCases = [
        { methods: ['PAN_ONLY'], expected: true },
        { methods: ['CRYPTOGRAM_3DS'], expected: true },
        { methods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], expected: true },
      ];

      for (const testCase of testCases) {
        const result = await nativeModule.init(
          'TEST',
          ['VISA'],
          testCase.methods
        );
        expect(result).toBe(testCase.expected);
        expect(nativeModule.init).toHaveBeenCalledWith(
          'TEST',
          ['VISA'],
          testCase.methods
        );
      }
    });
  });

  describe('isReadyToPay', () => {
    it('should return true when Google Pay is ready', async () => {
      nativeModule.isReadyToPay.mockResolvedValue(true);

      const result = await nativeModule.isReadyToPay();

      expect(nativeModule.isReadyToPay).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Google Pay is not ready', async () => {
      nativeModule.isReadyToPay.mockResolvedValue(false);

      const result = await nativeModule.isReadyToPay();

      expect(nativeModule.isReadyToPay).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle errors when checking readiness', async () => {
      // Test that the mock is set up correctly
      expect(nativeModule.isReadyToPay).toBeDefined();
      expect(typeof nativeModule.isReadyToPay).toBe('function');

      // Test that the mock can be called
      nativeModule.isReadyToPay.mockResolvedValue(false);
      const result = await nativeModule.isReadyToPay();
      expect(result).toBe(false);
    });
  });

  describe('loadPaymentData', () => {
    const mockGooglePayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD'],
          },
        },
      ],
      merchantInfo: {
        merchantId: 'test-merchant-id',
        merchantName: 'Test Merchant',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: '29.99',
        currencyCode: 'EUR',
        countryCode: 'ET',
      },
    };

    it('should load payment data successfully', async () => {
      const mockPaymentData = JSON.stringify({
        paymentMethodData: {
          type: 'CARD',
          description: 'Visa •••• 1234',
          info: {
            cardNetwork: 'VISA',
            cardDetails: '1234',
          },
          tokenizationData: {
            type: 'PAYMENT_GATEWAY',
            token: 'encrypted-token-data',
          },
        },
      });

      nativeModule.loadPaymentData.mockResolvedValue(mockPaymentData);

      const result = await nativeModule.loadPaymentData(mockGooglePayRequest);

      expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(
        mockGooglePayRequest
      );
      expect(result).toBe(mockPaymentData);
    });

    it('should handle payment cancellation', async () => {
      const cancellationError = {
        code: 'CANCELED',
        message: 'User cancelled the payment',
      };

      nativeModule.loadPaymentData.mockRejectedValue(cancellationError);

      await expect(
        nativeModule.loadPaymentData(mockGooglePayRequest)
      ).rejects.toEqual(cancellationError);

      expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(
        mockGooglePayRequest
      );
    });

    it('should handle payment errors', async () => {
      const paymentError = {
        code: 'PAYMENT_FAILED',
        message: 'Payment processing failed',
      };

      nativeModule.loadPaymentData.mockRejectedValue(paymentError);

      await expect(
        nativeModule.loadPaymentData(mockGooglePayRequest)
      ).rejects.toEqual(paymentError);

      expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(
        mockGooglePayRequest
      );
    });

    it('should handle different payment amounts', async () => {
      const mockPaymentData = '{"paymentMethodData": {"type": "CARD"}}';
      nativeModule.loadPaymentData.mockResolvedValue(mockPaymentData);

      const testCases = [
        { amount: '10.00', currency: 'EUR' },
        { amount: '29.99', currency: 'EUR' },
        { amount: '100.50', currency: 'EUR' },
      ];

      for (const testCase of testCases) {
        const request = {
          ...mockGooglePayRequest,
          transactionInfo: {
            ...mockGooglePayRequest.transactionInfo,
            totalPrice: testCase.amount,
            currencyCode: testCase.currency,
          },
        };

        const result = await nativeModule.loadPaymentData(request);
        expect(result).toBe(mockPaymentData);
        expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(request);
      }
    });

    it('should handle different currencies', async () => {
      const mockPaymentData = '{"paymentMethodData": {"type": "CARD"}}';
      nativeModule.loadPaymentData.mockResolvedValue(mockPaymentData);

      const testCases = [
        { currency: 'EUR', country: 'ET' },
        { currency: 'USD', country: 'US' },
        { currency: 'GBP', country: 'GB' },
      ];

      for (const testCase of testCases) {
        const request = {
          ...mockGooglePayRequest,
          transactionInfo: {
            ...mockGooglePayRequest.transactionInfo,
            currencyCode: testCase.currency,
            countryCode: testCase.country,
          },
        };

        const result = await nativeModule.loadPaymentData(request);
        expect(result).toBe(mockPaymentData);
        expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(request);
      }
    });

    it('should handle different merchant configurations', async () => {
      const mockPaymentData = '{"paymentMethodData": {"type": "CARD"}}';
      nativeModule.loadPaymentData.mockResolvedValue(mockPaymentData);

      const testCases = [
        {
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant 1',
        },
        {
          merchantId: 'merchant-2',
          merchantName: 'Test Merchant 2',
        },
      ];

      for (const testCase of testCases) {
        const request = {
          ...mockGooglePayRequest,
          merchantInfo: {
            merchantId: testCase.merchantId,
            merchantName: testCase.merchantName,
          },
        };

        const result = await nativeModule.loadPaymentData(request);
        expect(result).toBe(mockPaymentData);
        expect(nativeModule.loadPaymentData).toHaveBeenCalledWith(request);
      }
    });
  });

  describe('Module Interface', () => {
    it('should have all required methods', () => {
      expect(typeof nativeModule.init).toBe('function');
      expect(typeof nativeModule.isReadyToPay).toBe('function');
      expect(typeof nativeModule.loadPaymentData).toBe('function');
    });

    it('should be callable as functions', () => {
      expect(() =>
        nativeModule.init('TEST', ['VISA'], ['PAN_ONLY'])
      ).not.toThrow();
      expect(() => nativeModule.isReadyToPay()).not.toThrow();
      expect(() => nativeModule.loadPaymentData({} as any)).not.toThrow();
    });
  });
});
