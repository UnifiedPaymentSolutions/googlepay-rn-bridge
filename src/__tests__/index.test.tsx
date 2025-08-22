import { init, isReadyToPay, loadPaymentData, GooglePayButton } from '../index';
import type {
  GooglePayButtonConfig,
  EveryPayGooglePayError,
  PaymentProcessResponse,
  GooglePayEnvironment,
  CardNetwork,
  CardAuthMethod,
} from '../types';

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
  },
}));

// Mock uuid
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('EveryPay Google Pay Bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Native Module Functions', () => {
    it('should export init function', () => {
      expect(typeof init).toBe('function');
    });

    it('should export isReadyToPay function', () => {
      expect(typeof isReadyToPay).toBe('function');
    });

    it('should export loadPaymentData function', () => {
      expect(typeof loadPaymentData).toBe('function');
    });

    it('should export GooglePayButton component', () => {
      expect(GooglePayButton).toBeDefined();
    });
  });

  describe('Type Exports', () => {
    it('should export GooglePayButtonConfig type', () => {
      // This is a type-level test - we just verify the import works
      const config: GooglePayButtonConfig = {
        apiUsername: 'test',
        apiSecret: 'secret',
        apiUrl: 'https://test.com',
        environment: 'TEST',
        countryCode: 'ET',
        accountName: 'test-account',
      };
      expect(config).toBeDefined();
    });

    it('should export EveryPayGooglePayError type', () => {
      const error: EveryPayGooglePayError = {
        name: 'EveryPayGooglePayError',
        message: 'Test error',
        code: 'TEST_ERROR',
      };
      expect(error).toBeDefined();
    });

    it('should export PaymentProcessResponse type', () => {
      const response: PaymentProcessResponse = {
        state: 'success',
      };
      expect(response).toBeDefined();
    });

    it('should export GooglePayEnvironment type', () => {
      const env: GooglePayEnvironment = 'TEST';
      expect(env).toBeDefined();
    });

    it('should export CardNetwork type', () => {
      const network: CardNetwork = 'VISA';
      expect(network).toBeDefined();
    });

    it('should export CardAuthMethod type', () => {
      const method: CardAuthMethod = 'CRYPTOGRAM_3DS';
      expect(method).toBeDefined();
    });
  });
});
