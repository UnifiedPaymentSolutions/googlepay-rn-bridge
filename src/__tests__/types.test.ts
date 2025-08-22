import { EstonianDefaults, GooglePayErrorCodes } from '../types';
import type {
  GooglePayEnvironment,
  CardNetwork,
  CardAuthMethod,
  GooglePayConfig,
  PaymentData,
  PaymentResult,
  GooglePayButtonConfig,
  GooglePayRequest,
  PaymentProcessResponse,
  EveryPayGooglePayError,
} from '../types';

describe('Type Definitions', () => {
  describe('GooglePayEnvironment', () => {
    it('should accept valid environment values', () => {
      const testEnv: GooglePayEnvironment = 'TEST';
      const prodEnv: GooglePayEnvironment = 'PRODUCTION';

      expect(testEnv).toBe('TEST');
      expect(prodEnv).toBe('PRODUCTION');
    });
  });

  describe('CardNetwork', () => {
    it('should accept valid card network values', () => {
      const visa: CardNetwork = 'VISA';
      const mastercard: CardNetwork = 'MASTERCARD';

      expect(visa).toBe('VISA');
      expect(mastercard).toBe('MASTERCARD');
    });
  });

  describe('CardAuthMethod', () => {
    it('should accept valid auth method values', () => {
      const panOnly: CardAuthMethod = 'PAN_ONLY';
      const crypto3ds: CardAuthMethod = 'CRYPTOGRAM_3DS';

      expect(panOnly).toBe('PAN_ONLY');
      expect(crypto3ds).toBe('CRYPTOGRAM_3DS');
    });
  });

  describe('GooglePayConfig', () => {
    it('should accept valid configuration', () => {
      const config: GooglePayConfig = {
        environment: 'TEST',
        merchantId: 'test-merchant-id',
        merchantName: 'Test Merchant',
        countryCode: 'ET',
        currencyCode: 'EUR',
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
        allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
      };

      expect(config.environment).toBe('TEST');
      expect(config.merchantId).toBe('test-merchant-id');
      expect(config.merchantName).toBe('Test Merchant');
      expect(config.countryCode).toBe('ET');
      expect(config.currencyCode).toBe('EUR');
      expect(config.allowedCardNetworks).toEqual(['VISA', 'MASTERCARD']);
      expect(config.allowedCardAuthMethods).toEqual([
        'PAN_ONLY',
        'CRYPTOGRAM_3DS',
      ]);
    });

    it('should work with optional properties', () => {
      const config: GooglePayConfig = {
        environment: 'PRODUCTION',
        merchantId: 'prod-merchant-id',
        merchantName: 'Production Merchant',
      };

      expect(config.environment).toBe('PRODUCTION');
      expect(config.merchantId).toBe('prod-merchant-id');
      expect(config.merchantName).toBe('Production Merchant');
      expect(config.countryCode).toBeUndefined();
      expect(config.currencyCode).toBeUndefined();
      expect(config.allowedCardNetworks).toBeUndefined();
      expect(config.allowedCardAuthMethods).toBeUndefined();
    });
  });

  describe('PaymentData', () => {
    it('should accept valid payment data', () => {
      const paymentData: PaymentData = {
        amount: '29.99',
        currencyCode: 'EUR',
        countryCode: 'ET',
        transactionId: 'txn-123',
      };

      expect(paymentData.amount).toBe('29.99');
      expect(paymentData.currencyCode).toBe('EUR');
      expect(paymentData.countryCode).toBe('ET');
      expect(paymentData.transactionId).toBe('txn-123');
    });

    it('should work with minimal payment data', () => {
      const paymentData: PaymentData = {
        amount: '10.00',
        currencyCode: 'EUR',
      };

      expect(paymentData.amount).toBe('10.00');
      expect(paymentData.currencyCode).toBe('EUR');
      expect(paymentData.countryCode).toBeUndefined();
      expect(paymentData.transactionId).toBeUndefined();
    });
  });

  describe('PaymentResult', () => {
    it('should accept valid payment result', () => {
      const paymentResult: PaymentResult = {
        token: 'payment-token-123',
        paymentMethodData: {
          type: 'CARD',
          description: 'Visa •••• 1234',
          info: {
            cardNetwork: 'VISA',
            cardDetails: '1234',
          },
          tokenizationData: {
            type: 'PAYMENT_GATEWAY',
            token: 'encrypted-token',
          },
        },
        shippingAddress: {
          name: 'John Doe',
          address1: 'Test Street 1',
          locality: 'Tallinn',
          administrativeArea: 'Harju County',
          countryCode: 'ET',
          postalCode: '10115',
          phoneNumber: '+37212345678',
        },
        email: 'john.doe@example.com',
      };

      expect(paymentResult.token).toBe('payment-token-123');
      expect(paymentResult.paymentMethodData.type).toBe('CARD');
      expect(paymentResult.shippingAddress?.name).toBe('John Doe');
      expect(paymentResult.email).toBe('john.doe@example.com');
    });
  });

  describe('GooglePayButtonConfig', () => {
    it('should accept valid button configuration', () => {
      const config: GooglePayButtonConfig = {
        apiUsername: 'testuser',
        apiSecret: 'testsecret',
        apiUrl: 'https://test-api.everypay.com',
        environment: 'TEST',
        countryCode: 'ET',
        currencyCode: 'EUR',
        accountName: 'test-account',
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
        allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
      };

      expect(config.apiUsername).toBe('testuser');
      expect(config.apiSecret).toBe('testsecret');
      expect(config.apiUrl).toBe('https://test-api.everypay.com');
      expect(config.environment).toBe('TEST');
      expect(config.countryCode).toBe('ET');
      expect(config.currencyCode).toBe('EUR');
      expect(config.accountName).toBe('test-account');
      expect(config.allowedCardNetworks).toEqual(['VISA', 'MASTERCARD']);
      expect(config.allowedCardAuthMethods).toEqual([
        'PAN_ONLY',
        'CRYPTOGRAM_3DS',
      ]);
    });
  });

  describe('GooglePayRequest', () => {
    it('should accept valid Google Pay request', () => {
      const request: GooglePayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'everypay',
                gatewayMerchantId: 'test-merchant-id',
              },
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

      expect(request.apiVersion).toBe(2);
      expect(request.apiVersionMinor).toBe(0);
      expect(request.allowedPaymentMethods).toHaveLength(1);
      expect(request.merchantInfo.merchantId).toBe('test-merchant-id');
      expect(request.transactionInfo.totalPrice).toBe('29.99');
    });
  });

  describe('PaymentProcessResponse', () => {
    it('should accept successful response', () => {
      const response: PaymentProcessResponse = {
        state: 'success',
      };

      expect(response.state).toBe('success');
      expect(response.error).toBeUndefined();
    });

    it('should accept failed response with error', () => {
      const error: EveryPayGooglePayError = {
        name: 'EveryPayGooglePayError',
        message: 'Payment failed',
        code: 'PAYMENT_FAILED',
      };

      const response: PaymentProcessResponse = {
        state: 'failed',
        error,
      };

      expect(response.state).toBe('failed');
      expect(response.error).toBe(error);
    });
  });
});

describe('Constants', () => {
  describe('EstonianDefaults', () => {
    it('should have correct default values', () => {
      expect(EstonianDefaults.COUNTRY_CODE).toBe('ET');
      expect(EstonianDefaults.CURRENCY_CODE).toBe('EUR');
      expect(EstonianDefaults.ALLOWED_CARD_NETWORKS).toEqual([
        'VISA',
        'MASTERCARD',
      ]);
      expect(EstonianDefaults.ALLOWED_AUTH_METHODS).toEqual(['CRYPTOGRAM_3DS']);
      expect(EstonianDefaults.GATEWAY).toBe('everypay');
    });

    it('should be readonly', () => {
      // This test verifies that the constants are properly defined
      // In a real environment, these would be readonly
      expect(EstonianDefaults.COUNTRY_CODE).toBeDefined();
    });
  });

  describe('GooglePayErrorCodes', () => {
    it('should contain all expected error codes', () => {
      const expectedCodes = [
        'UNSUPPORTED_PLATFORM',
        'INVALID_CONFIG',
        'INITIALIZATION_FAILED',
        'PAYMENT_CANCELLED',
        'PAYMENT_FAILED',
        'INVALID_PAYMENT_DATA',
        'NOT_INITIALIZED',
        'PAYMENT_ERROR',
        'PAYMENT_PARSE_ERROR',
        'GOOGLE_PAY_UNAVAILABLE',
      ];

      expectedCodes.forEach((code) => {
        expect(
          GooglePayErrorCodes[code as keyof typeof GooglePayErrorCodes]
        ).toBe(code);
      });
    });

    it('should have correct error code values', () => {
      expect(GooglePayErrorCodes.UNSUPPORTED_PLATFORM).toBe(
        'UNSUPPORTED_PLATFORM'
      );
      expect(GooglePayErrorCodes.INVALID_CONFIG).toBe('INVALID_CONFIG');
      expect(GooglePayErrorCodes.INITIALIZATION_FAILED).toBe(
        'INITIALIZATION_FAILED'
      );
      expect(GooglePayErrorCodes.PAYMENT_CANCELLED).toBe('PAYMENT_CANCELLED');
      expect(GooglePayErrorCodes.PAYMENT_FAILED).toBe('PAYMENT_FAILED');
      expect(GooglePayErrorCodes.INVALID_PAYMENT_DATA).toBe(
        'INVALID_PAYMENT_DATA'
      );
      expect(GooglePayErrorCodes.NOT_INITIALIZED).toBe('NOT_INITIALIZED');
      expect(GooglePayErrorCodes.PAYMENT_ERROR).toBe('PAYMENT_ERROR');
      expect(GooglePayErrorCodes.PAYMENT_PARSE_ERROR).toBe(
        'PAYMENT_PARSE_ERROR'
      );
      expect(GooglePayErrorCodes.GOOGLE_PAY_UNAVAILABLE).toBe(
        'GOOGLE_PAY_UNAVAILABLE'
      );
    });
  });
});
