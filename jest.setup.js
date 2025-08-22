/* global jest, beforeEach, afterEach */
// Jest setup file for React Native testing

// Mock react-native-uuid
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
    Platform: {
      OS: 'android',
      select: jest.fn((obj) => obj.android || obj.default),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
    TouchableOpacity: 'TouchableOpacity',
  };
});

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
});

afterEach(() => {
  jest.clearAllMocks();
});
