import type {
  EverypayConfig,
  GooglePayBackendData,
  GooglePayInitResult,
  GooglePayTokenData,
  TokenRequestResult,
  PaymentData,
} from '../../specs/NativeEverypayGpayRnBridge';

// Mock implementation of the native module
class MockNativeEverypayGpayRnBridge {
  private _isProcessing: boolean = false;
  private _mockError: Error | null = null;
  private _mockInitResult: GooglePayInitResult = {
    isReady: true,
    gatewayId: 'everypay',
    gatewayMerchantId: 'test-merchant-id',
  };
  private _mockTokenData: GooglePayTokenData = {
    paymentReference: 'test-payment-ref',
    mobileAccessToken: 'test-mobile-token',
    signature: 'test-signature',
    intermediateSigningKey: {
      signedKey: 'test-signed-key',
      signatures: ['sig1', 'sig2'],
    },
    protocolVersion: 'ECv2',
    signedMessage: 'test-signed-message',
    tokenConsentAgreed: true,
  };
  private _mockTokenRequestResult: TokenRequestResult = {
    ...this._mockTokenData,
    paymentDetails: {
      paymentReference: 'test-payment-ref',
      paymentState: 'settled',
      ccDetails: {
        token: 'mit-token-12345',
        lastFourDigits: '1234',
        month: '12',
        year: '2025',
      },
    },
  };
  private _mockSDKPaymentResult = { status: 'success' };

  // Test helpers - not part of the real native module
  setMockError(error: Error | null) {
    this._mockError = error;
  }

  setMockInitResult(result: GooglePayInitResult) {
    this._mockInitResult = result;
  }

  setMockTokenData(data: GooglePayTokenData) {
    this._mockTokenData = data;
  }

  setMockTokenRequestResult(result: TokenRequestResult) {
    this._mockTokenRequestResult = result;
  }

  setMockSDKPaymentResult(result: { status: string }) {
    this._mockSDKPaymentResult = result;
  }

  resetMocks() {
    this._isProcessing = false;
    this._mockError = null;
    this._mockInitResult = {
      isReady: true,
      gatewayId: 'everypay',
      gatewayMerchantId: 'test-merchant-id',
    };
    this._mockTokenData = {
      paymentReference: 'test-payment-ref',
      mobileAccessToken: 'test-mobile-token',
      signature: 'test-signature',
      intermediateSigningKey: {
        signedKey: 'test-signed-key',
        signatures: ['sig1', 'sig2'],
      },
      protocolVersion: 'ECv2',
      signedMessage: 'test-signed-message',
      tokenConsentAgreed: true,
    };
    this._mockTokenRequestResult = {
      ...this._mockTokenData,
      paymentDetails: {
        paymentReference: 'test-payment-ref',
        paymentState: 'settled',
        ccDetails: {
          token: 'mit-token-12345',
          lastFourDigits: '1234',
          month: '12',
          year: '2025',
        },
      },
    };
    this._mockSDKPaymentResult = { status: 'success' };
  }

  // Native module methods
  async initializeWithBackendData(
    _config: EverypayConfig,
    _backendData: GooglePayBackendData
  ): Promise<GooglePayInitResult> {
    if (this._mockError) {
      throw this._mockError;
    }
    return Promise.resolve(this._mockInitResult);
  }

  async initializeSDKMode(
    _config: EverypayConfig
  ): Promise<GooglePayInitResult> {
    if (this._mockError) {
      throw this._mockError;
    }
    return Promise.resolve(this._mockInitResult);
  }

  async makePaymentWithBackendData(
    _backendData: GooglePayBackendData
  ): Promise<GooglePayTokenData> {
    if (this._mockError) {
      this._isProcessing = false;
      throw this._mockError;
    }
    this._isProcessing = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isProcessing = false;
        resolve(this._mockTokenData);
      }, 100);
    });
  }

  async makePaymentSDKMode(
    _paymentData: PaymentData
  ): Promise<{ status: string }> {
    if (this._mockError) {
      this._isProcessing = false;
      throw this._mockError;
    }
    this._isProcessing = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isProcessing = false;
        resolve(this._mockSDKPaymentResult);
      }, 100);
    });
  }

  async requestTokenWithBackendData(
    _backendData: GooglePayBackendData
  ): Promise<GooglePayTokenData> {
    if (this._mockError) {
      this._isProcessing = false;
      throw this._mockError;
    }
    this._isProcessing = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isProcessing = false;
        resolve(this._mockTokenData);
      }, 100);
    });
  }

  async requestTokenSDKMode(_label: string): Promise<TokenRequestResult> {
    if (this._mockError) {
      this._isProcessing = false;
      throw this._mockError;
    }
    this._isProcessing = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isProcessing = false;
        resolve(this._mockTokenRequestResult);
      }, 100);
    });
  }

  isProcessingPayment(): boolean {
    return this._isProcessing;
  }
}

// Create singleton instance
const mockInstance = new MockNativeEverypayGpayRnBridge();

// Export as default (matches the real module export)
export default mockInstance;

// Also export the instance for test access
export { mockInstance as __mockInstance };
