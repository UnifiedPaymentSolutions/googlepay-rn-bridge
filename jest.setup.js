/* global jest, beforeEach, afterEach */
// Jest setup file for React Native testing

// Mock the native module
jest.mock('./src/specs/NativeEverypayGpayRnBridge', () => {
  const mockInstance =
    require('./src/__tests__/__mocks__/NativeEverypayGpayRnBridge').__mockInstance;
  return {
    __esModule: true,
    default: mockInstance,
  };
});

// Override Platform.OS to always be android
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'android',
    Version: 29,
    select: (obj) => obj.android || obj.default,
  },
  OS: 'android',
  Version: 29,
  select: (obj) => obj.android || obj.default,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global.nativeFabricUIManager
global.nativeFabricUIManager = null;

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
  if (global.fetch) {
    global.fetch.mockClear();
  }
  // Reset native module mock
  const {
    __mockInstance,
  } = require('./src/__tests__/__mocks__/NativeEverypayGpayRnBridge');
  __mockInstance.resetMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});
