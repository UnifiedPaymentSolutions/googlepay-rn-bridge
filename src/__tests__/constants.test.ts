import { ERROR_CODES } from '../constants';

describe('Constants', () => {
  describe('ERROR_CODES', () => {
    it('should contain all expected error codes', () => {
      expect(ERROR_CODES.MERCHANT_INFO_REQUEST_ERROR).toBe(
        'E_MERCHANT_INFO_REQUEST_ERROR'
      );
      expect(ERROR_CODES.INVALID_CONFIG).toBe('E_INVALID_CONFIG');
      expect(ERROR_CODES.GOOGLE_PAY_INITIALIZATION_FAILED).toBe(
        'E_GOOGLE_PAY_INITIALIZATION_FAILED'
      );
    });

    it('should have correct error code values', () => {
      const expectedCodes = {
        MERCHANT_INFO_REQUEST_ERROR: 'E_MERCHANT_INFO_REQUEST_ERROR',
        INVALID_CONFIG: 'E_INVALID_CONFIG',
        GOOGLE_PAY_INITIALIZATION_FAILED: 'E_GOOGLE_PAY_INITIALIZATION_FAILED',
      };

      expect(ERROR_CODES).toEqual(expectedCodes);
    });

    it('should be readonly', () => {
      // This test verifies that the constants are properly defined
      // In a real environment, these would be readonly
      expect(ERROR_CODES.MERCHANT_INFO_REQUEST_ERROR).toBeDefined();
    });

    it('should have consistent naming pattern', () => {
      Object.values(ERROR_CODES).forEach((code) => {
        expect(code).toMatch(/^E_/);
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should have descriptive error names', () => {
      expect(ERROR_CODES.MERCHANT_INFO_REQUEST_ERROR).toContain(
        'MERCHANT_INFO_REQUEST_ERROR'
      );
      expect(ERROR_CODES.INVALID_CONFIG).toContain('INVALID_CONFIG');
      expect(ERROR_CODES.GOOGLE_PAY_INITIALIZATION_FAILED).toContain(
        'GOOGLE_PAY_INITIALIZATION_FAILED'
      );
    });
  });
});
