# @everypay/googlepay-rn-bridge

EveryPay Google Pay React Native Bridge (Android Only). Built on [EveryPay Google Pay Android SDK](../everypay-gpay-sdk-client). Full TypeScript support.

- 🔐 **Backend Mode**: Keep API credentials secure on your backend (recommended)
- 📦 **SDK Integration**: Built on EveryPay Android SDK for better maintainability
- 🛡️ **Enhanced Security**: API credentials never exposed in mobile app
- 🎯 **Dual Mode Support**: Backend Mode (recommended) + SDK Mode
- 🔄 **Recurring Payments**: Request MIT tokens for recurring payments

## Installation

```sh
npm install @everypay/googlepay-rn-bridge
```

```sh
yarn add @everypay/googlepay-rn-bridge
```

## Quick Start

### Backend Mode (Recommended) ⭐

Most secure approach - API credentials stay on your backend. You have full control over when and how API requests are made.

**Step 1:** Implement 2 backend endpoints ([see guide](./BACKEND_INTEGRATION.md))

Your backend needs these endpoints:

- **POST /api/gpay/create-payment** - Combines EveryPay `open_session` + `create_payment` API calls
- **POST /api/gpay/process-token** - Calls EveryPay `payment_data` API to process the token

**Step 2:** Use GooglePayButton component:

```typescript
import React, { useState, useEffect } from 'react';
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type {
  EverypayConfig,
  GooglePayBackendData
} from '@everypay/googlepay-rn-bridge';

function PaymentScreen() {
  const [backendData, setBackendData] = useState<GooglePayBackendData | null>(null);

  const config: EverypayConfig = {
    environment: 'TEST', // or 'PRODUCTION'
    countryCode: 'EE',
    currencyCode: 'EUR'
  };

  // Fetch payment data when component mounts
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await fetch('https://your-backend.com/api/gpay/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 10.50,
            label: 'Product Purchase',
            orderReference: 'ORDER-123',
            customerEmail: 'customer@example.com',
          }),
        });
        const data = await response.json();
        setBackendData(data);
      } catch (error) {
        console.error('Failed to prepare payment:', error);
      }
    };

    fetchPaymentData();
  }, []);

  // Process the Google Pay token
  const handlePaymentToken = async (tokenData: any) => {
    try {
      const result = await fetch('https://your-backend.com/api/gpay/process-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData)
      });
      return result.json();
    } catch (error) {
      console.error('Failed to process token:', error);
      throw error;
    }
  };

  // Show Google Pay button only when backend data is ready
  if (!backendData) {
    return null; // Or show a loading indicator
  }

  return (
    <GooglePayButton
      config={config}
      backendData={backendData}
      onPressCallback={handlePaymentToken}
      // Handle your back-end response here
      onPaymentSuccess={(result) => result.state === 'failed' ? console.error('Error:', result) : console.log('Success!', result)}
      onPaymentError={(error) => console.error('Payment failed:', error)}
      onPaymentCanceled={() => console.log('Payment canceled')}
      theme="dark"
      buttonType="buy"  // Options: buy, book, checkout, donate, order, pay, subscribe
    />
  );
}
```

**How it works:**

1. Component mounts → **automatically fetches** payment data from your `/create-payment` endpoint (this should internally call both EveryPay `open_session` and `create_payment` APIs)
2. When data arrives → Google Pay button appears (component initializes automatically)
3. User presses Google Pay button → SDK shows Google Pay UI and retrieves token
4. `onPressCallback` is called with the token → **you send** it to your `/process-token` endpoint
5. Your backend processes the payment and returns the result

**📖 Full Backend Setup Guide:** [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)

---

### SDK Mode

API keys are stored in the app, no back-end service needed

Use GooglePayButton with SDK configuration:

```typescript
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type { EverypayConfig } from '@everypay/googlepay-rn-bridge';

function PaymentScreen() {
  const config: EverypayConfig = {
    // ⚠️ Everypay API credentials in app
    apiUsername: 'your_username',
    apiSecret: 'your_secret',
    apiUrl: 'https://payment.sandbox.lhv.ee', // or production URL
    environment: 'TEST',  // or 'PRODUCTION'
    countryCode: 'EE',
    accountName: 'EUR3D1',
    customerUrl: 'https://your-site.com',
    currencyCode: 'EUR'
  };

  const handlePayment = async (result: any) => {
    // Payment already processed by SDK
    console.log('Payment result:', result);
    return result;
  };

  return (
    <GooglePayButton
      config={config}
      amount={10.50}
      label="Product Purchase"
      orderReference="ORDER-123"
      customerEmail="customer@example.com"
      onPressCallback={handlePayment}
      onPaymentSuccess={(result) => console.log('Success!', result)}
      onPaymentError={(error) => console.error('Error:', error)}
      theme="dark"
      buttonType="buy"
    />
  );
}
```

**How it works:**

1. Component auto-detects SDK mode (no `sessionData`, but has `apiUsername` + `apiSecret`)
2. Initializes SDK with your credentials
3. On button press, shows Google Pay and processes payment via EveryPay API
4. Calls your `onPressCallback` with the payment result

---

### Component Features

✅ **Auto-mode detection** - Automatically uses Backend or SDK mode based on config
✅ **User-controlled flow** - You decide when to fetch data and make API calls
✅ **Single callback** - Simple `onPressCallback` handles payment flow
✅ **Native button** - Official Google Pay button with multiple types
✅ **Type-safe** - Pass typed data directly, full TypeScript support
✅ **Both architectures** - Works with old and new React Native architecture

## Requirements

### System Requirements

- Android only (iOS not supported)
- Must be distributed through Google Play store
- React Native 0.77 or higher
- Supports both old and new React Native architecture

### Android Requirements

```gradle
android {
  compileSdkVersion 34 // or higher

  defaultConfig {
    minSdkVersion 24  // or higher (SDK requirement)
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
  }
}
```

### Configuration Steps

1. Enable Google Pay in your app by adding the following meta-data element to your `android/app/src/main/AndroidManifest.xml` file inside the `<application>` tag:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Required for SDK mode only: Internet permission for EveryPay API calls -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        ...>

        <!-- Required: Enable Google Pay API -->
        <meta-data
            android:name="com.google.android.gms.wallet.api.enabled"
            android:value="true" />

        <activity ...>
            ...
        </activity>
    </application>
</manifest>
```

## API Reference

### Configuration Types

#### EverypayConfig

```typescript
interface EverypayConfig {
  environment: 'TEST' | 'PRODUCTION';
  countryCode: string; // e.g., 'EE'

  // SDK Mode only (optional for Backend Mode)
  apiUsername?: string;
  apiSecret?: string;
  apiUrl?: string;
  accountName?: string;
  customerUrl?: string; // Redirect URL. Required but not used in the app

  // Optional
  currencyCode?: string; // Default: 'EUR'
  allowedCardNetworks?: ('MASTERCARD' | 'VISA')[];
  allowedCardAuthMethods?: ('PAN_ONLY' | 'CRYPTOGRAM_3DS')[];

  // Token request mode
  requestToken?: boolean; // If true, request MIT token instead of making payment
}
```

#### GooglePayBackendData

Data structure from backend for payment initialization:

```typescript
interface GooglePayBackendData {
  merchantId: string;
  merchantName: string;
  gatewayId: string;
  gatewayMerchantId: string;
  currency: string;
  countryCode: string;
  paymentReference: string;
  mobileAccessToken: string;
  amount: number;
  label: string;
}
```

#### GooglePayTokenData

Token data returned from SDK to be sent to backend:

```typescript
interface GooglePayTokenData {
  paymentReference: string;
  mobileAccessToken: string;
  signature: string;
  intermediateSigningKey: {
    signedKey: string;
    signatures: string[];
  };
  protocolVersion: string;
  signedMessage: string;
  tokenConsentAgreed: boolean;
}
```

### Native Methods

#### Backend Mode Methods

```typescript
// Initialize with backend data
initializeWithBackendData(
  config: EverypayConfig,
  backendData: GooglePayBackendData
): Promise<boolean>

// Make payment with backend data
makePaymentWithBackendData(
  backendData: GooglePayBackendData
): Promise<GooglePayTokenData>

// Request MIT token with backend data (recurring payments)
requestTokenWithBackendData(
  backendData: GooglePayBackendData
): Promise<GooglePayTokenData>
```

#### SDK Mode Methods

```typescript
// Initialize SDK mode
initializeSDKMode(config: EverypayConfig): Promise<boolean>

// Make payment SDK mode
makePaymentSDKMode(paymentData: {
  amount: string;
  label: string;
  orderReference: string;
  customerEmail: string;
  customerIp?: string;
}): Promise<{ status: string }>

// Request MIT token SDK mode (recurring payments)
requestTokenSDKMode(label: string): Promise<TokenRequestResult>
```

#### Utility Methods

```typescript
// Check if payment is in progress
isProcessingPayment(): boolean
```

### Error Codes

| Code                                         | Description                          |
| -------------------------------------------- | ------------------------------------ |
| `E_ACTIVITY_DOES_NOT_EXIST`                  | Activity not available               |
| `E_INIT_ERROR`                               | Initialization failed                |
| `E_PAYMENT_ERROR`                            | Payment processing error             |
| `E_PAYMENT_CANCELED`                         | User canceled payment                |
| `E_UNABLE_TO_DETERMINE_GOOGLE_PAY_READINESS` | Cannot check Google Pay availability |
| `E_GOOGLE_PAY_API_ERROR`                     | Google Pay API error                 |

## Documentation

- 📖 [Backend Integration Guide](./BACKEND_INTEGRATION.md) - How to implement backend endpoints
- 📖 [Recurring Payments Guide](./RECURRING_PAYMENTS.md) - Token requests for MIT and recurring payments
- 📖 [TypeScript Types](./src/types.ts) - Full type definitions

## Mode Comparison

| Feature         | Backend Mode ⭐           | SDK Mode               |
| --------------- | ------------------------- | ---------------------- |
| Recommended     | Yes                       | No                     |
| Security        | ✅ Credentials on backend | ❌ Credentials in app  |
| Complexity      | Medium (requires backend) | Low                    |
| Maintainability | ✅ Easy to update logic   | ❌ Requires app update |

## Troubleshooting

### "Activity not available"

Ensure you're calling SDK methods when the app is in the foreground.

### "Not initialized"

Call `initializeWithBackendData()` or `initializeSDKMode()` before making payments.

### "Payment already in progress"

Check `isProcessingPayment()` before starting a new payment.

## Security Best Practices

1. **Use Backend Mode if possible**
2. **Never commit API credentials** to version control
3. **Validate all inputs** on your backend
4. **Use HTTPS** for all backend communications
5. **Implement rate limiting** on backend endpoints
6. **Log security events** on backend

## Testing

### Test Environment

Use `environment: 'TEST'` with EveryPay sandbox credentials. This will also run the Google Pay in the test mode.

## Important Notes

- ✅ Android only (iOS not supported)
- ✅ Supports both Old and New React Native architecture
- ✅ Complies with [Google Pay API Acceptable Use Policy](https://developers.google.com/pay/api/android/guides/setup#acceptable-use)
- ⚠️ Requires distribution through Google Play Store

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
