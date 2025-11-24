# Test Documentation for EveryPay Google Pay React Native Bridge

## Test Suite Overview

### ✅ **Passing Test Suites**

| Test File                            | Tests | Status | Description                                 |
| ------------------------------------ | ----- | ------ | ------------------------------------------- |
| `index.test.tsx`                     | 4     | ✅     | Main exports and type definitions           |
| `GooglePayButton.test.tsx`           | 11    | ✅     | React component structure and configuration |
| `NativeEverypayGpayRnBridge.test.ts` | 15    | ✅     | Native module interface testing             |
| `util.test.ts`                       | 8     | ✅     | Utility functions (base64 encoding)         |
| `EveryPayRequests.test.ts`           | 12    | ✅     | EveryPay API request functions              |
| `everyPayError.test.ts`              | 8     | ✅     | Custom error class testing                  |
| `types.test.ts`                      | 15    | ✅     | TypeScript type definitions                 |
| `constants.test.ts`                  | 4     | ✅     | Error constants validation                  |

## Test Structure

```
src/__tests__/
├── index.test.tsx              # Main exports testing
├── GooglePayButton.test.tsx    # Component structure testing
├── NativeEverypayGpayRnBridge.test.ts  # Native module testing
├── util.test.ts               # Utility function testing
├── EveryPayRequests.test.ts   # API request testing
├── everyPayError.test.ts      # Error class testing
├── types.test.ts              # Type definition testing
├── constants.test.ts          # Constant testing
└── README.md                  # Test documentation
```

## How to Run Tests

### Run All Tests

```bash
yarn test
```

### Run Specific Test File

```bash
yarn test src/__tests__/GooglePayButton.test.tsx
```

### Run Tests with Coverage

```bash
yarn test --coverage
```

### Run Tests in Watch Mode

```bash
yarn test --watch
```

## Test Coverage

### Core Functionality Covered

1. **Native Module Interface** (`NativeEverypayGpayRnBridge.test.ts`)

   - ✅ `init` method with various parameters
   - ✅ `isReadyToPay` method with success/failure scenarios
   - ✅ `loadPaymentData` method with payment data handling
   - ✅ Error handling for all methods

2. **React Component** (`GooglePayButton.test.tsx`)

   - ✅ Component structure validation
   - ✅ Configuration prop handling
   - ✅ Payment flow logic testing
   - ✅ Error handling scenarios

3. **API Integration** (`EveryPayRequests.test.ts`)

   - ✅ `openEPSession` with authentication
   - ✅ `getMerchantInfo` with proper headers
   - ✅ `processPayment` with payment data
   - ✅ Error handling for network failures

4. **Utility Functions** (`util.test.ts`)

   - ✅ `base64Encode` with proper padding
   - ✅ Various input scenarios
   - ✅ Edge cases and error conditions

5. **Error Handling** (`everyPayError.test.ts`)

   - ✅ `EveryPayGooglePayError` class
   - ✅ Error properties and inheritance
   - ✅ Serialization behavior

6. **Type Safety** (`types.test.ts`)

   - ✅ All TypeScript interfaces
   - ✅ Constants and defaults
   - ✅ Type validation

7. **Constants** (`constants.test.ts`)

   - ✅ Error code constants
   - ✅ Naming patterns
   - ✅ Structure validation

8. **Main Exports** (`index.test.tsx`)
   - ✅ Native module function exports
   - ✅ Component export
   - ✅ Type exports

## Mocking Strategy

### Native Modules

```typescript
// Mock React Native components
jest.mock('react-native', () => ({
  requireNativeComponent: jest.fn(() => 'MockedNativeComponent'),
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: jest.fn((styles) => styles) },
  Platform: {
    OS: 'android',
    select: jest.fn((obj) => obj.android || obj.default),
  },
}));
```

### API Calls

```typescript
// Mock fetch globally
global.fetch = jest.fn();

// Mock API responses
(fetch as jest.Mock).mockResolvedValueOnce({
  json: jest.fn().mockResolvedValue(mockResponse),
});
```

### Dependencies

```typescript
// Mock UUID
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));
```

## Test Patterns

### Component Testing

```typescript
// Test component structure without rendering
it('should be a valid React component', () => {
  expect(GooglePayButton).toBeDefined();
  expect(typeof GooglePayButton).toBe('function');
});
```

### API Testing

```typescript
// Test API calls with proper mocking
it('should call API with correct parameters', async () => {
  const result = await getMerchantInfo(url, user, secret, body);
  expect(fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
  expect(result).toEqual(mockResponse);
});
```

### Error Testing

```typescript
// Test error handling
it('should handle errors properly', async () => {
  const error = new EveryPayGooglePayError('TEST_ERROR', 'Test message');
  expect(error.code).toBe('TEST_ERROR');
  expect(error.message).toBe('Test message');
});
```

### **Mocking Guidelines**

- Mock all external dependencies (native modules, APIs, etc.)
- Use realistic mock data that matches expected formats
- Test both success and failure scenarios
- Ensure mocks are properly reset between tests

## Adding New Tests

### For New Components

1. Create test file: `src/__tests__/NewComponent.test.tsx`
2. Mock dependencies using the established patterns
3. Test component structure, props, and behavior
4. Include error handling scenarios

### For New Utilities

1. Create test file: `src/__tests__/newUtil.test.ts`
2. Test various input scenarios
3. Include edge cases and error conditions
4. Test with realistic data

### For New API Functions

1. Add tests to `EveryPayRequests.test.ts`
2. Mock fetch responses for different scenarios
3. Test authentication and error handling
4. Validate request parameters and headers

## Continuous Integration

The test suite is ready for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: yarn test

- name: Run Tests with Coverage
  run: yarn test --coverage
```
