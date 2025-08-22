export class EveryPayGooglePayError extends Error {
  public code: string;
  public message: string;
  public details?: any;

  constructor(code: string, message: string, details?: any) {
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
