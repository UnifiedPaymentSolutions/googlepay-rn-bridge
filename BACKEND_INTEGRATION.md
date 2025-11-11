# Backend Integration Guide

This guide explains how to implement the backend for Google Pay integration using the **Backend Mode** (recommended approach).

## Overview

In Backend Mode:

- **Backend** makes all EveryPay API calls (keeps credentials secure)
- **React Native SDK** only handles Google Pay UI
- **Security**: API credentials never leave your backend

## Architecture

```
React Native App → Backend Server → EveryPay API
                 ↓
              Google Pay UI (SDK)
                 ↓
             Token → Backend → EveryPay
```

## Required Backend Endpoints

Your backend needs to implement three endpoints:

### 1. Initialize Session: `POST /api/gpay/init`

Opens a Google Pay session with EveryPay.

**Request Body:**

```json
{
  "environment": "TEST",
  "countryCode": "EE"
}
```

**Backend Implementation:**

```javascript
// Node.js/Express example
app.post('/api/gpay/init', async (req, res) => {
  const { environment, countryCode } = req.body;

  try {
    // Call EveryPay API
    const sessionResponse = await fetch(
      `${EVERYPAY_API_URL}/api/v4/google_pay/open_session`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USERNAME}:${API_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_username: API_USERNAME,
          account_name: ACCOUNT_NAME,
        }),
      }
    );

    const sessionData = await sessionResponse.json();

    // Return session info (no payment created yet)
    res.json({
      merchantId: sessionData.googlepay_merchant_identifier,
      merchantName: sessionData.merchant_name,
      gatewayId: sessionData.google_pay_gateway_id,
      gatewayMerchantId: sessionData.googlepay_gateway_merchant_id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**

```json
{
  "merchantId": "BCR2DN...",
  "merchantName": "Your Merchant",
  "gatewayId": "everypay",
  "gatewayMerchantId": "your_gateway_id"
}
```

### 2. Create Payment: `POST /api/gpay/create-payment`

Creates a payment in EveryPay system.

**Request Body:**

```json
{
  "amount": 10.5,
  "label": "Product Purchase",
  "orderReference": "ORDER-123",
  "customerEmail": "customer@example.com",
  "customerIp": "192.168.1.1"
}
```

**Backend Implementation:**

```javascript
app.post('/api/gpay/create-payment', async (req, res) => {
  const { amount, label, orderReference, customerEmail, customerIp } = req.body;

  try {
    // First, open session (or reuse cached session)
    const sessionResponse = await fetch(
      `${EVERYPAY_API_URL}/api/v4/google_pay/open_session`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USERNAME}:${API_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_username: API_USERNAME,
          account_name: ACCOUNT_NAME,
        }),
      }
    );

    const sessionData = await sessionResponse.json();

    // Create payment
    const paymentResponse = await fetch(
      `${EVERYPAY_API_URL}/api/v4/payments/oneoff`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USERNAME}:${API_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_username: API_USERNAME,
          account_name: ACCOUNT_NAME,
          amount: amount,
          label: label,
          currency_code: 'EUR',
          country_code: 'EE',
          order_reference: orderReference,
          nonce: generateNonce(), // Generate unique nonce
          mobile_payment: true,
          customer_url: CUSTOMER_URL,
          customer_ip: customerIp || '',
          customer_email: customerEmail,
          timestamp: new Date().toISOString(),
        }),
      }
    );

    const paymentData = await paymentResponse.json();

    // Combine session + payment data for app
    res.json({
      merchantId: sessionData.googlepay_merchant_identifier,
      merchantName: sessionData.merchant_name,
      gatewayId: sessionData.google_pay_gateway_id,
      gatewayMerchantId: sessionData.googlepay_gateway_merchant_id,
      currency: paymentData.currency,
      countryCode: paymentData.descriptor_country,
      paymentReference: paymentData.payment_reference,
      mobileAccessToken: paymentData.mobile_access_token,
      amount: paymentData.standing_amount,
      label: label,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Response:**

```json
{
  "merchantId": "BCR2DN...",
  "merchantName": "Your Merchant",
  "gatewayId": "everypay",
  "gatewayMerchantId": "your_gateway_id",
  "currency": "EUR",
  "countryCode": "EE",
  "paymentReference": "abc123...",
  "mobileAccessToken": "xyz789...",
  "amount": 10.5,
  "label": "Product Purchase"
}
```

### 3. Process Token: `POST /api/gpay/process-payment`

Processes the Google Pay token received from the app.

**Request Body:**

```json
{
  "paymentReference": "abc123...",
  "mobileAccessToken": "xyz789...",
  "signature": "...",
  "intermediateSigningKey": {
    "signedKey": "...",
    "signatures": ["..."]
  },
  "protocolVersion": "ECv2",
  "signedMessage": "...",
  "tokenConsentAgreed": false
}
```

**Backend Implementation:**

```javascript
app.post('/api/gpay/process-payment', async (req, res) => {
  const {
    paymentReference,
    mobileAccessToken,
    signature,
    intermediateSigningKey,
    protocolVersion,
    signedMessage,
    tokenConsentAgreed,
  } = req.body;

  try {
    // Process payment with EveryPay
    const processResponse = await fetch(
      `${EVERYPAY_API_URL}/api/v4/google_pay/payment_data`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mobileAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_reference: paymentReference,
          token_consent_agreed: tokenConsentAgreed,
          signature: signature,
          intermediateSigningKey: intermediateSigningKey,
          protocolVersion: protocolVersion,
          signedMessage: signedMessage,
        }),
      }
    );

    const result = await processResponse.json();

    // Check payment state
    if (result.state === 'settled' || result.state === 'authorized') {
      res.json({
        success: true,
        state: result.state,
        paymentReference: paymentReference,
      });
    } else {
      res.status(400).json({
        success: false,
        state: result.state,
        error: `Payment failed with state: ${result.state}`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateNonce() {
  return require('crypto').randomBytes(16).toString('hex');
}
```

**Response (Success):**

```json
{
  "success": true,
  "state": "settled",
  "paymentReference": "abc123..."
}
```

**Response (Failure):**

```json
{
  "success": false,
  "state": "failed",
  "error": "Payment failed with state: failed"
}
```

## React Native Implementation

With the backend endpoints in place, here's how to use them in your React Native app:

```typescript
import NativeEverypayGpayRnBridge from './specs/NativeEverypayGpayRnBridge';
import type { EverypayConfig, GooglePayBackendData } from './types';

// 1. Initialize when component mounts
async function initializeGooglePay() {
  const config: EverypayConfig = {
    environment: 'TEST', // or 'PRODUCTION'
    countryCode: 'EE',
    currencyCode: 'EUR',
    allowedCardNetworks: ['MASTERCARD', 'VISA'],
    allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
  };

  // Get init data from backend
  const initData = await fetch('https://your-backend.com/api/gpay/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environment: config.environment,
      countryCode: config.countryCode,
    }),
  }).then((res) => res.json());

  // Initialize SDK with backend data
  const isReady = await NativeEverypayGpayRnBridge.initializeWithBackendData(
    config,
    initData
  );

  return isReady;
}

// 2. Make payment when button pressed
async function makePayment() {
  // Get payment data from backend
  const paymentData: GooglePayBackendData = await fetch(
    'https://your-backend.com/api/gpay/create-payment',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10.5,
        label: 'Product Purchase',
        orderReference: 'ORDER-123',
        customerEmail: 'customer@example.com',
        customerIp: '192.168.1.1',
      }),
    }
  ).then((res) => res.json());

  // Show Google Pay and get token
  const tokenData =
    await NativeEverypayGpayRnBridge.makePaymentWithBackendData(paymentData);

  // Send token to backend for processing
  const result = await fetch(
    'https://your-backend.com/api/gpay/process-payment',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData),
    }
  ).then((res) => res.json());

  if (result.success) {
    console.log('Payment successful!', result.paymentReference);
  } else {
    console.error('Payment failed:', result.error);
  }
}
```

## Security Best Practices

1. **Never expose API credentials in the app**

   - Store `API_USERNAME`, `API_SECRET` only on backend
   - Never send them to the mobile app

2. **Validate requests on backend**

   - Verify user authentication before creating payments
   - Validate amount, email, and other parameters
   - Implement rate limiting

3. **Use HTTPS**

   - All backend endpoints must use HTTPS
   - Never transmit sensitive data over HTTP

4. **Session management**

   - Consider caching session info (with expiration)
   - Avoid unnecessary calls to open_session endpoint

5. **Error handling**
   - Don't expose internal errors to app
   - Log errors securely on backend
   - Return user-friendly error messages

## Testing

### Test with EveryPay Sandbox

1. Use `environment: 'TEST'` in config
2. Use EveryPay test API credentials
3. Test card: See EveryPay documentation for test cards

### Backend Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test init endpoint
curl -X POST https://your-backend.com/api/gpay/init \
  -H "Content-Type: application/json" \
  -d '{"environment":"TEST","countryCode":"EE"}'

# Test create payment endpoint
curl -X POST https://your-backend.com/api/gpay/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.50,
    "label": "Test Product",
    "orderReference": "TEST-123",
    "customerEmail": "test@example.com"
  }'
```

## Troubleshooting

### "Payment reference required"

- Ensure create-payment endpoint returns `paymentReference`

### "Invalid signature"

- Verify token data is passed correctly to backend
- Check that `intermediateSigningKey` structure is preserved

### "Authentication failed"

- Verify API credentials on backend
- Check Authorization header format

### "Payment already processed"

- Payment references are single-use
- Create new payment for each transaction

## Additional Resources

- [EveryPay API Documentation](https://support.everypay.com/)
- [Google Pay Android Integration](https://developers.google.com/pay/api/android/overview)
- [Example Backend Implementation](./examples/backend-nodejs/)
