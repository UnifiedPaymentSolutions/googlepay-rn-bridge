# Migration Guide: v1.x to v2.0 (SDK Migration)

This guide covers migrating from v1.x of `@everypay/googlepay-rn-bridge` to v2.0

## What Changed

The library was redesigned to support two operation modes:

- **Backend Mode** (new, recommended) -- API credentials stay on your server
- **SDK Mode** -- similar to the old approach, but the SDK handles EveryPay API calls internally

The old version made EveryPay API calls (session, merchant info, payment processing) directly from the React Native layer via JS HTTP requests. The new version delegates all of this to the native Android SDK or your backend.

## Breaking Changes at a Glance

| Area | Old | New |
|---|---|---|
| Native methods | `init()`, `isReadyToPay()`, `loadPaymentData()` | `initializeWithBackendData()`, `initializeSDKMode()`, `makePaymentWithBackendData()`, `makePaymentSDKMode()`, `requestTokenWithBackendData()`, `requestTokenSDKMode()`, `isProcessingPayment()` |
| Config type | `GooglePayButtonConfig` | `EverypayConfig` |
| Button props | Flat props with `onPressCallback` returning `PaymentProcessResponse` | Discriminated union (`backendData` or `amount`/`label`/etc.), `onPressCallback` returns `Promise` |
| Error handling | `onPressCallback({ state: 'failed', error })` | Separate `onPaymentError` and `onPaymentCanceled` callbacks |
| Error class | `EveryPayGooglePayError` (exported) | Removed -- errors are standard `Error` objects with a `code` property |

## Step-by-Step Migration

### 1. Update imports

**Old:**

```typescript
import { GooglePayButton, init, isReadyToPay, loadPaymentData } from '@everypay/googlepay-rn-bridge';
import type {
  GooglePayButtonConfig,
  EveryPayGooglePayError,
  PaymentProcessResponse,
} from '@everypay/googlepay-rn-bridge';
```

**New:**

```typescript
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type {
  EverypayConfig,
  GooglePayBackendData,    // Backend mode
  GooglePayTokenData,      // Payment result
  TokenRequestResult,      // Token request result (recurring)
  SDKModePaymentData,      // SDK mode
} from '@everypay/googlepay-rn-bridge';
```

### 2. Update configuration

**Old `GooglePayButtonConfig`:**

```typescript
const config: GooglePayButtonConfig = {
  apiUsername: 'your_username',
  apiSecret: 'your_secret',
  apiUrl: 'https://payment.sandbox.lhv.ee',
  environment: 'TEST',
  countryCode: 'EE',
  accountName: 'EUR3D1',
  currencyCode: 'EUR',
};
```

**New `EverypayConfig` (Backend mode -- recommended):**

```typescript
const config: EverypayConfig = {
  environment: 'TEST',
  countryCode: 'EE',
  currencyCode: 'EUR',
  // No API credentials needed -- they stay on your backend
};
```

**New `EverypayConfig` (SDK mode):**

```typescript
const config: EverypayConfig = {
  apiUsername: 'your_username',
  apiSecret: 'your_secret',
  apiUrl: 'https://payment.sandbox.lhv.ee',
  environment: 'TEST',
  countryCode: 'EE',
  accountName: 'EUR3D1',
  customerUrl: 'https://your-site.com',
  currencyCode: 'EUR',
};
```

Note: `customerUrl` is a new required field for SDK mode (used internally by the SDK, not user-visible).

### 3. Update `GooglePayButton` usage

#### Migrating to Backend Mode (recommended)

This is the biggest change. Instead of passing API credentials to the component, you implement two backend endpoints and pass server-provided data to the button.

**Old:**

```tsx
<GooglePayButton
  config={config}
  amount={10.50}
  label="Product Purchase"
  orderReference="ORDER-123"
  customerEmail="customer@example.com"
  onPressCallback={(result) => {
    if (result.state === 'failed') {
      console.error('Payment error:', result.error);
    } else {
      console.log('Payment success');
    }
  }}
  theme="dark"
/>
```

**New (Backend mode):**

```tsx
// 1. Fetch payment data from your backend before rendering
const [backendData, setBackendData] = useState<GooglePayBackendData | null>(null);

useEffect(() => {
  fetch('https://your-backend.com/api/gpay/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 10.50,
      label: 'Product Purchase',
      orderReference: 'ORDER-123',
      customerEmail: 'customer@example.com',
    }),
  })
    .then(res => res.json())
    .then(setBackendData);
}, []);

if (!backendData) return null;

// 2. Render the button with backend data
<GooglePayButton
  config={config}
  backendData={backendData}
  onPressCallback={async (tokenData) => {
    // Send token to your backend for processing
    const result = await fetch('https://your-backend.com/api/gpay/process-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData),
    });
    return result.json();
  }}
  onPaymentSuccess={(result) => console.log('Success:', result)}
  onPaymentError={(error) => console.error('Error:', error)}
  onPaymentCanceled={() => console.log('Canceled')}
  theme="dark"
  buttonType="buy"
/>
```

See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for the backend endpoint implementation guide.

#### Migrating to SDK Mode

If you want to keep API credentials in the app (not recommended), migration is simpler. Using the same old code as above:

```tsx
<GooglePayButton
  config={config}
  amount={10.50}
  label="Product Purchase"
  orderReference="ORDER-123"
  customerEmail="customer@example.com"
  onPressCallback={async (result) => {
    console.log('Payment processed:', result);
    return result;
  }}
  onPaymentSuccess={(result) => console.log('Success:', result)}
  onPaymentError={(error) => console.error('Error:', error)}
  onPaymentCanceled={() => console.log('Canceled')}
  theme="dark"
  buttonType="buy"
/>
```

Key differences:
- `onPressCallback` must be `async` / return a `Promise`
- Error handling moved to `onPaymentError` and `onPaymentCanceled`
- New optional `buttonType` prop (default: `'buy'`)

### 4. Update direct native method calls

If you were calling native methods directly (not through the button), these have all changed:

**Old:**

```typescript
import { init, isReadyToPay, loadPaymentData } from '@everypay/googlepay-rn-bridge';

await init('TEST', ['VISA', 'MASTERCARD'], ['PAN_ONLY', 'CRYPTOGRAM_3DS']);
const ready = await isReadyToPay();
const paymentData = await loadPaymentData(googlePayRequest);
```

**New (Backend mode):**

```typescript
import {
  initializeWithBackendData,
  makePaymentWithBackendData,
} from '@everypay/googlepay-rn-bridge';

const initResult = await initializeWithBackendData(config, backendData);
// initResult: { isReady: boolean, gatewayId: string, gatewayMerchantId: string }

const tokenData = await makePaymentWithBackendData(backendData);
// tokenData: GooglePayTokenData -- send this to your backend
```

**New (SDK mode):**

```typescript
import {
  initializeSDKMode,
  makePaymentSDKMode,
} from '@everypay/googlepay-rn-bridge';

const initResult = await initializeSDKMode(config);

const result = await makePaymentSDKMode({
  amount: '10.50',
  label: 'Product Purchase',
  orderReference: 'ORDER-123',
  customerEmail: 'customer@example.com',
});
```

## Type Migration Reference

| Old Type | New Type | Notes |
|---|---|---|
| `GooglePayButtonConfig` | `EverypayConfig` | Restructured, `customerUrl` added for SDK mode |
| `PaymentProcessResponse` | -- | Removed. Use `onPaymentSuccess`/`onPaymentError` callbacks |
| `EveryPayGooglePayError` | -- | Removed. Errors are standard `Error` with `code` property |
| -- | `GooglePayBackendData` | New. Data from your backend |
| -- | `TokenRequestResult` | New. Recurring payment token result |
| -- | `GooglePayButtonProps` | New. Discriminated union for button props |
| -- | `GooglePayInitResult` | New. Initialization result |

## New Features in v2.0

- **Backend Mode**: Keep API credentials on your server
- **Recurring Payments**: Request MIT tokens via `requestToken` config flag ([guide](./RECURRING_PAYMENTS.md))
- **Button Types**: `buy`, `book`, `checkout`, `donate`, `order`, `pay`, `subscribe`
- **Payment State Tracking**: `isProcessingPayment()` to check if a payment is in progress
- **Cancellation Callback**: Dedicated `onPaymentCanceled` callback
