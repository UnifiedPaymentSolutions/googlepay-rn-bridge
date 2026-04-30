# Backend Integration Guide

This guide explains how to implement the backend for Google Pay integration using the **Backend Mode** (recommended approach).

## Overview

In Backend Mode:

- **Backend** makes all EveryPay API calls (keeps credentials secure)
- **React Native app** only handles Google Pay UI
- **Security**: API credentials never leave your backend

## Architecture

```
1. Create Payment:
   React Native App → Backend → EveryPay API
                                  ↓
                          (payment reference)
                                  ↓
   React Native App ← Backend ← EveryPay

2. Show Google Pay:
   React Native App → Google Pay UI
                           ↓
                      (user pays)
                           ↓
   React Native App ← Token

3. Process Payment:
   React Native App → Backend → EveryPay API
      (with token)              (process token)
                                  ↓
   React Native App ← Backend ← Result
```

## Required Backend Endpoints

Your backend needs to implement two endpoints:

### 1. Create Payment: `POST /api/gpay/create-payment`

Opens a Google Pay session and creates a payment in EveryPay system (combines both `open_session` and `create_payment` API calls).

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

### 2. Process Token: `POST /api/gpay/process-token`

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
app.post('/api/gpay/process-token', async (req, res) => {
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
          token_consent_agreed: tokenConsentAgreed || false,
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

- [EveryPay API Documentation](https://support.every-pay.com/api-documentation/)
- [Google Pay Android Integration](https://developers.google.com/pay/api/android/overview)
