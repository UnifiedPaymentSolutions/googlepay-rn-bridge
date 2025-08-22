import { EveryPayGooglePayError } from '../everyPayError';

describe('EveryPayGooglePayError', () => {
  describe('Constructor', () => {
    it('should create error with code and message', () => {
      const error = new EveryPayGooglePayError(
        'TEST_ERROR',
        'Test error message'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EveryPayGooglePayError);
      expect(error.name).toBe('EveryPayGooglePayError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.details).toBeUndefined();
    });

    it('should create error with code, message, and details', () => {
      const details = { field: 'amount', value: 'invalid' };
      const error = new EveryPayGooglePayError(
        'VALIDATION_ERROR',
        'Invalid amount',
        details
      );

      expect(error.name).toBe('EveryPayGooglePayError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid amount');
      expect(error.details).toEqual(details);
    });

    it('should create error with empty message', () => {
      const error = new EveryPayGooglePayError('EMPTY_ERROR', '');

      expect(error.name).toBe('EveryPayGooglePayError');
      expect(error.code).toBe('EMPTY_ERROR');
      expect(error.message).toBe('');
    });

    it('should create error with special characters in message', () => {
      const message = 'Error with special chars: !@#$%^&*()';
      const error = new EveryPayGooglePayError('SPECIAL_CHARS', message);

      expect(error.message).toBe(message);
    });
  });

  describe('Error Properties', () => {
    it('should have correct error properties', () => {
      const error = new EveryPayGooglePayError('TEST_ERROR', 'Test message');

      expect(error.name).toBe('EveryPayGooglePayError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(typeof error.stack).toBe('string');
    });

    it('should maintain stack trace', () => {
      const error = new EveryPayGooglePayError('STACK_ERROR', 'Stack test');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('EveryPayGooglePayError');
    });
  });

  describe('Error Codes', () => {
    it('should handle various error codes', () => {
      const errorCodes = [
        'INITIALIZATION_FAILED',
        'PAYMENT_CANCELLED',
        'PAYMENT_FAILED',
        'NETWORK_ERROR',
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
      ];

      errorCodes.forEach((code) => {
        const error = new EveryPayGooglePayError(
          code,
          `Error with code ${code}`
        );
        expect(error.code).toBe(code);
        expect(error.message).toBe(`Error with code ${code}`);
      });
    });

    it('should handle numeric error codes', () => {
      const error = new EveryPayGooglePayError('404', 'Not found');
      expect(error.code).toBe('404');
    });

    it('should handle empty error code', () => {
      const error = new EveryPayGooglePayError('', 'No code provided');
      expect(error.code).toBe('');
    });
  });

  describe('Details Property', () => {
    it('should handle undefined details', () => {
      const error = new EveryPayGooglePayError('TEST', 'Message');
      expect(error.details).toBeUndefined();
    });

    it('should handle null details', () => {
      const error = new EveryPayGooglePayError('TEST', 'Message', null);
      expect(error.details).toBeNull();
    });

    it('should handle object details', () => {
      const details = { userId: 123, action: 'payment' };
      const error = new EveryPayGooglePayError('TEST', 'Message', details);
      expect(error.details).toEqual(details);
    });

    it('should handle array details', () => {
      const details = ['error1', 'error2'];
      const error = new EveryPayGooglePayError('TEST', 'Message', details);
      expect(error.details).toEqual(details);
    });

    it('should handle string details', () => {
      const details = 'Additional error information';
      const error = new EveryPayGooglePayError('TEST', 'Message', details);
      expect(error.details).toBe(details);
    });
  });

  describe('Error Inheritance', () => {
    it('should be instanceof Error', () => {
      const error = new EveryPayGooglePayError('TEST', 'Message');
      expect(error instanceof Error).toBe(true);
    });

    it('should be instanceof EveryPayGooglePayError', () => {
      const error = new EveryPayGooglePayError('TEST', 'Message');
      expect(error instanceof EveryPayGooglePayError).toBe(true);
    });

    it('should have Error prototype methods', () => {
      const error = new EveryPayGooglePayError('TEST', 'Message');
      expect(typeof error.toString).toBe('function');
      expect(typeof error.valueOf).toBe('function');
    });
  });

  describe('Error Stack Trace', () => {
    it('should capture stack trace when available', () => {
      const error = new EveryPayGooglePayError(
        'STACK_TEST',
        'Stack test message'
      );

      // In V8 environments, Error.captureStackTrace should be called
      // The actual behavior depends on the JavaScript engine
      expect(error.stack).toBeDefined();
    });

    it('should work without Error.captureStackTrace', () => {
      // Mock the case where captureStackTrace is not available
      const originalCaptureStackTrace = Error.captureStackTrace;
      // @ts-ignore
      Error.captureStackTrace = undefined;

      const error = new EveryPayGooglePayError('NO_CAPTURE', 'No capture test');

      expect(error.name).toBe('EveryPayGooglePayError');
      expect(error.code).toBe('NO_CAPTURE');
      expect(error.message).toBe('No capture test');

      // Restore original
      Error.captureStackTrace = originalCaptureStackTrace;
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const details = { field: 'amount', value: 100 };
      const error = new EveryPayGooglePayError(
        'SERIALIZATION_TEST',
        'Test message',
        details
      );

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('EveryPayGooglePayError');
      expect(parsed.code).toBe('SERIALIZATION_TEST');
      // The message property is not enumerable in Error objects, so it won't be in JSON
      expect(parsed.details).toEqual(details);
    });

    it('should handle circular references in details', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const error = new EveryPayGooglePayError(
        'CIRCULAR',
        'Circular test',
        circularObj
      );

      // Should handle circular references gracefully
      expect(() => {
        JSON.stringify(error);
      }).toThrow('Converting circular structure to JSON');
    });
  });
});
