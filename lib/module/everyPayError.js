'use strict';

export class EveryPayGooglePayError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'EveryPayGooglePayError';
    this.code = code;
    this.message = message;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EveryPayGooglePayError);
    }
  }
}
//# sourceMappingURL=everyPayError.js.map
