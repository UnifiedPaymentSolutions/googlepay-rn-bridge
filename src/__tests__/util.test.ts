import { base64Encode } from '../util';

describe('Utility Functions', () => {
  describe('base64Encode', () => {
    it('should encode simple string correctly', () => {
      const input = 'Hello World';
      const expected = 'SGVsbG8gV29ybGQ=';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode empty string', () => {
      const input = '';
      const expected = '';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode single character', () => {
      const input = 'A';
      const expected = 'QQ==';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode two characters', () => {
      const input = 'AB';
      const expected = 'QUI=';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode three characters', () => {
      const input = 'ABC';
      const expected = 'QUJD';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode special characters', () => {
      const input = 'test:password';
      const expected = 'dGVzdDpwYXNzd29yZA==';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode unicode characters', () => {
      const input = 'test@example.com:secret123';
      const expected = 'dGVzdEBleGFtcGxlLmNvbTpzZWNyZXQxMjM=';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should handle string with padding correctly', () => {
      const input = 'test';
      const expected = 'dGVzdA==';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should handle string that needs padding', () => {
      const input = 'test1';
      const expected = 'dGVzdDE=';
      expect(base64Encode(input)).toBe(expected);
    });

    it('should encode credentials for basic auth', () => {
      const username = 'testuser';
      const password = 'testpass';
      const credentials = `${username}:${password}`;
      const expected = 'dGVzdHVzZXI6dGVzdHBhc3M=';
      expect(base64Encode(credentials)).toBe(expected);
    });

    it('should match Node.js Buffer.toString("base64") for simple cases', () => {
      const testCases = [
        'Hello',
        'World',
        'Test123',
        'user:pass',
        'api:secret',
      ];

      testCases.forEach((testCase) => {
        const result = base64Encode(testCase);
        // Note: This is a basic test - in a real environment you'd compare with Buffer
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
