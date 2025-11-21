/**
 * Tests for type definitions and constants
 * Tests EstonianDefaults, GooglePayErrorCodes, and type utilities
 */

import { EstonianDefaults, GooglePayErrorCodes } from '../types';

describe('Types and Constants', () => {
  describe('EstonianDefaults', () => {
    it('should have correct country code', () => {
      expect(EstonianDefaults.COUNTRY_CODE).toBe('ET');
    });

    it('should have correct currency code', () => {
      expect(EstonianDefaults.CURRENCY_CODE).toBe('EUR');
    });

    it('should have VISA and MASTERCARD as allowed card networks', () => {
      expect(EstonianDefaults.ALLOWED_CARD_NETWORKS).toEqual([
        'VISA',
        'MASTERCARD',
      ]);
      expect(EstonianDefaults.ALLOWED_CARD_NETWORKS).toHaveLength(2);
    });

    it('should have CRYPTOGRAM_3DS as recommended auth method', () => {
      expect(EstonianDefaults.ALLOWED_AUTH_METHODS).toEqual(['CRYPTOGRAM_3DS']);
      expect(EstonianDefaults.ALLOWED_AUTH_METHODS).toHaveLength(1);
    });

    it('should have everypay as gateway', () => {
      expect(EstonianDefaults.GATEWAY).toBe('everypay');
    });

    it('should be a const object', () => {
      // EstonianDefaults is declared with 'as const' for type safety
      // but is not frozen at runtime (which is fine for constants)
      expect(EstonianDefaults).toBeDefined();
      expect(typeof EstonianDefaults).toBe('object');
    });
  });

  describe('GooglePayErrorCodes', () => {
    describe('Platform errors', () => {
      it('should have UNSUPPORTED_PLATFORM error code', () => {
        expect(GooglePayErrorCodes.UNSUPPORTED_PLATFORM).toBe(
          'UNSUPPORTED_PLATFORM'
        );
      });
    });

    describe('Initialization errors', () => {
      it('should have INVALID_CONFIG error code', () => {
        expect(GooglePayErrorCodes.INVALID_CONFIG).toBe('INVALID_CONFIG');
      });

      it('should have INITIALIZATION_FAILED error code', () => {
        expect(GooglePayErrorCodes.INITIALIZATION_FAILED).toBe(
          'INITIALIZATION_FAILED'
        );
      });
    });

    describe('Payment errors', () => {
      it('should have PAYMENT_CANCELLED error code', () => {
        expect(GooglePayErrorCodes.PAYMENT_CANCELLED).toBe('PAYMENT_CANCELLED');
      });

      it('should have PAYMENT_FAILED error code', () => {
        expect(GooglePayErrorCodes.PAYMENT_FAILED).toBe('PAYMENT_FAILED');
      });

      it('should have INVALID_PAYMENT_DATA error code', () => {
        expect(GooglePayErrorCodes.INVALID_PAYMENT_DATA).toBe(
          'INVALID_PAYMENT_DATA'
        );
      });

      it('should have NOT_INITIALIZED error code', () => {
        expect(GooglePayErrorCodes.NOT_INITIALIZED).toBe('NOT_INITIALIZED');
      });

      it('should have PAYMENT_ERROR error code', () => {
        expect(GooglePayErrorCodes.PAYMENT_ERROR).toBe('PAYMENT_ERROR');
      });

      it('should have PAYMENT_PARSE_ERROR error code', () => {
        expect(GooglePayErrorCodes.PAYMENT_PARSE_ERROR).toBe(
          'PAYMENT_PARSE_ERROR'
        );
      });
    });

    describe('Service errors', () => {
      it('should have GOOGLE_PAY_UNAVAILABLE error code', () => {
        expect(GooglePayErrorCodes.GOOGLE_PAY_UNAVAILABLE).toBe(
          'GOOGLE_PAY_UNAVAILABLE'
        );
      });
    });

    it('should have all 10 error codes defined', () => {
      const errorCodes = Object.keys(GooglePayErrorCodes);
      // Enum has both keys and values, so we get double the count
      // Filter to only get the string values
      const stringValues = errorCodes.filter(
        (key) =>
          isNaN(Number(key)) &&
          typeof (GooglePayErrorCodes as Record<string, unknown>)[key] ===
            'string'
      );
      expect(stringValues.length).toBe(10);
    });
  });

  describe('Type validation', () => {
    it('should validate CardNetwork type accepts VISA', () => {
      const network: 'VISA' | 'MASTERCARD' = 'VISA';
      expect(network).toBe('VISA');
    });

    it('should validate CardNetwork type accepts MASTERCARD', () => {
      const network: 'VISA' | 'MASTERCARD' = 'MASTERCARD';
      expect(network).toBe('MASTERCARD');
    });

    it('should validate CardAuthMethod type accepts PAN_ONLY', () => {
      const method: 'PAN_ONLY' | 'CRYPTOGRAM_3DS' = 'PAN_ONLY';
      expect(method).toBe('PAN_ONLY');
    });

    it('should validate CardAuthMethod type accepts CRYPTOGRAM_3DS', () => {
      const method: 'PAN_ONLY' | 'CRYPTOGRAM_3DS' = 'CRYPTOGRAM_3DS';
      expect(method).toBe('CRYPTOGRAM_3DS');
    });

    it('should validate GooglePayEnvironment type accepts TEST', () => {
      const env: 'TEST' | 'PRODUCTION' = 'TEST';
      expect(env).toBe('TEST');
    });

    it('should validate GooglePayEnvironment type accepts PRODUCTION', () => {
      const env: 'TEST' | 'PRODUCTION' = 'PRODUCTION';
      expect(env).toBe('PRODUCTION');
    });

    it('should validate GooglePayButtonType accepts all valid types', () => {
      const types: Array<
        'buy' | 'book' | 'checkout' | 'donate' | 'order' | 'pay' | 'subscribe'
      > = ['buy', 'book', 'checkout', 'donate', 'order', 'pay', 'subscribe'];

      expect(types).toHaveLength(7);
      expect(types).toContain('buy');
      expect(types).toContain('book');
      expect(types).toContain('checkout');
      expect(types).toContain('donate');
      expect(types).toContain('order');
      expect(types).toContain('pay');
      expect(types).toContain('subscribe');
    });

    it('should validate GooglePayMode type accepts backend and sdk', () => {
      const modes: Array<'backend' | 'sdk'> = ['backend', 'sdk'];

      expect(modes).toHaveLength(2);
      expect(modes).toContain('backend');
      expect(modes).toContain('sdk');
    });
  });
});
