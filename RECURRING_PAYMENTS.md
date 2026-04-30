# Google Pay Token Requests for Recurring Payments

This guide explains how to request Google Pay tokens for Merchant Initiated Transactions (MIT) and recurring payments in React Native.

## Table of Contents

- [Overview](#overview)
- [User Consent Requirements](#user-consent-requirements)
- [Backend Mode (Recommended)](#backend-mode-recommended)
- [SDK Mode](#sdk-mode)
- [Token Data Structure](#token-data-structure)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Additional Resources](#additional-resources)

---

## Overview

When setting up recurring payments or card-on-file functionality, you need to collect a payment token from Google Pay that can be used for future Merchant Initiated Transactions (MIT). This is different from a regular one-time payment.

### Token Request vs Payment Request

| Feature            | Payment Request             | Token Request                    |
| ------------------ | --------------------------- | -------------------------------- |
| Purpose            | Process immediate payment   | Collect token for future use     |
| Google Pay Status  | `totalPriceStatus: "FINAL"` | `totalPriceStatus: "ESTIMATED"`  |
| Amount             | Actual payment amount       | `0` (zero)                       |
| Token Consent      | `false`                     | `true`                           |
| Backend Processing | Immediate charge            | MIT token required from EveryPay |
| User Experience    | "Pay $10.50"                | "Card verification"              |

---

## User Consent Requirements

**Before requesting a payment token, your app MUST obtain explicit user consent to store their card details for future payments.**

### What Users Should Know

When collecting a token for recurring payments, users must be clearly informed about:

1. **Purpose** - Why you're requesting to save their card (e.g., "Save card for future subscriptions", "Enable one-click checkout")
2. **Scope** - What the stored card will be used for (e.g., "Automatic monthly billing", "Future purchases")
3. **Amount** - If applicable, the expected payment amounts or frequency
4. **Cancellation** - How they can revoke consent and remove the stored card

### Best Practices for Consent UI

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

function ConsentDialog({ visible, onConsent, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Save Card for Future Payments</Text>
          <Text style={styles.message}>
            By continuing, you authorize us to securely store your card details
            for future purchases. You can remove your saved card at any time in Settings.
          </Text>
          <View style={styles.buttons}>
            <Button title="Cancel" onPress={onCancel} />
            <Button title="I Agree" onPress={onConsent} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: 'white', borderRadius: 8, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  message: { fontSize: 14, color: '#333', marginBottom: 20 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
```

### Compliance Considerations

- **PCI DSS** - You're responsible for securely handling and storing the MIT token
- **GDPR/Privacy Laws** - Users have the right to revoke consent and request data deletion
- **Card Network Rules** - Visa, Mastercard require explicit cardholder consent for stored credentials
- **Audit Trail** - Keep records of when and how consent was obtained

### Technical Implementation

The SDK automatically sets `token_consent_agreed: true` in the Everypay API `oneoff` payment request when you use `requestToken: true` in the `EverypayConfig`. However, **you must obtain user consent in your app UI before calling these methods**.

---

## Backend Mode (Recommended)

### Flow Diagram

```
Backend (Your Server)         React Native App            Google Pay
      │                              │                        │
      │  1. Request token collection │                        │
      │◄─────────────────────────────│                        │
      │                              │                        │
      │  2. Call EveryPay API        │                        │
      │    - open_session            │                        │
      │    - oneoff (amount=0,       │                        │
      │      request_token=true)     │                        │
      │                              │                        │
      │  3. Return session + payment │                        │
      │     data (payment_reference, │                        │
      │     mobile_access_token)     │                        │
      │─────────────────────────────►│                        │
      │                              │                        │
      │                              │  4. Show Google Pay    │
      │                              │  (amount: $0,          │
      │                              │   ESTIMATED)           │
      │                              │───────────────────────►│
      │                              │                        │
      │                              │  5. User authorizes    │
      │                              │◄───────────────────────│
      │                              │                        │
      │  6. Send Google Pay token    │                        │
      │◄─────────────────────────────│                        │
      │                              │                        │
      │  7. Call EveryPay API        │                        │
      │    - payment_data (process)  │                        │
      │    - GET /payments           │                        │
      │      (MIT token)             │                        │
      │                              │                        │
      │  8. Store MIT token          │                        │
      │                              │                        │
      │  9. Return confirmation      │                        │
      │─────────────────────────────►│                        │
```

The main difference between a regular payment and MIT token request is that the `payments/oneoff` request must be made with `amount=0`, `request_token=true`, and `token_consent_agreed=true`. After payment finalization, an additional `GET /payments/{payment_reference}` call must be made to retrieve the MIT token for later use in recurring payments.

### Step 1: Obtain User Consent and Setup

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type {
  EverypayConfig,
  GooglePayBackendData
} from '@everypay/googlepay-rn-bridge';

function SetupRecurringPayments() {
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [backendData, setBackendData] = useState<GooglePayBackendData | null>(null);

  const config: EverypayConfig = {
    environment: 'TEST', // or 'PRODUCTION'
    countryCode: 'EE',
    currencyCode: 'EUR',
    requestToken: true, // Enable token request mode
  };

  const handleConsentGiven = async () => {
    setShowConsent(false);
    setHasConsented(true);

    try {
      // Fetch token collection data from backend
      await fetchTokenCollectionData();
    } catch (error) {
      console.error('Failed to prepare token collection:', error);
    }
  };

  const fetchTokenCollectionData = async () => {
    // Implementation in next step
  };

  return (
    <View>
      <ConsentDialog
        visible={showConsent}
        onConsent={handleConsentGiven}
        onCancel={() => setShowConsent(false)}
      />
      {hasConsented && backendData && (
        <GooglePayButton
          config={config}
          backendData={backendData}
          onPressCallback={handlePaymentToken}
          onPaymentSuccess={(result) => console.log('Token saved!', result)}
          onPaymentError={(error) => console.error('Error:', error)}
          onPaymentCanceled={() => console.log('Canceled')}
          theme="dark"
          buttonType="subscribe"
        />
      )}
      {hasConsented && !backendData && (
        <Text>Preparing token collection...</Text>
      )}
    </View>
  );
}
```

### Step 2: Fetch Backend Data and Process Token

```typescript
const fetchTokenCollectionData = async () => {
  try {
    // Request token collection data from your backend
    // Your backend calls:
    //    - POST /api/v4/google_pay/open_session
    //    - POST /api/v4/payments/oneoff (with amount=0, request_token=true,
    //      token_consent_agreed=true, token_agreement=unscheduled)
    const response = await fetch(
      'https://your-backend.com/api/gpay/request-token-collection',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Card verification',
        }),
      }
    );

    const data: GooglePayBackendData = await response.json();
    // data contains:
    // - Session info (merchantId, merchantName, gatewayId, etc.)
    // - Payment info (paymentReference, mobileAccessToken)
    // - amount: 0 (zero for token requests)

    setBackendData(data);
  } catch (error) {
    console.error('Failed to fetch token collection data:', error);
  }
};

// Process the Google Pay token
const handlePaymentToken = async (tokenData: any) => {
  try {
    // Send to your backend for EveryPay processing
    const result = await fetch(
      'https://your-backend.com/api/gpay/process-google-pay-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData),
      }
    );

    return result.json();
  } catch (error) {
    console.error('Token processing error:', error);
    throw error;
  }
};
```

### Step 3: Backend Implementation (Your Server)

Your backend must implement two endpoints:

#### Endpoint 1: Request Token Collection

```
POST /api/gpay/request-token-collection

Request Body:
{
  "label": "Card verification"
}

Backend Processing:
1. Call POST /api/v4/google_pay/open_session
2. Call POST /api/v4/payments/oneoff with:
   - amount: 0
   - request_token: true
   - token_consent_agreed: true
   - token_agreement: "unscheduled"
   - label: "Card verification"
3. Combine responses into GooglePayBackendData format
4. Return combined data to app

Response (GooglePayBackendData):
{
  "merchantId": "BCR2DN...",
  "merchantName": "Your Merchant",
  "gatewayId": "everypay",
  "gatewayMerchantId": "your_gateway_id",
  "currency": "EUR",
  "countryCode": "EE",
  "paymentReference": "abc123...",      // from oneoff response
  "mobileAccessToken": "token_xyz...",  // from oneoff response
  "amount": 0,                          // MUST be 0 for token requests
  "label": "Card verification"
}
```

**JavaScript/Node.js Implementation:**

```javascript
app.post('/api/gpay/request-token-collection', async (req, res) => {
  const { label } = req.body;

  try {
    // Open session (or reuse cached session)
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

    // Create token request (zero-amount payment with token flags)
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
          amount: 0, // MUST be 0 for token requests
          request_token: true, // Enable token request
          token_consent_agreed: true, // User gave consent
          token_agreement: 'unscheduled', // Type of recurring payment
          label: label || 'Card verification',
          currency_code: 'EUR',
          country_code: 'EE',
          order_reference: `TOKEN-${Date.now()}`,
          nonce: generateNonce(),
          mobile_payment: true,
          customer_url: CUSTOMER_URL,
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
      amount: 0, // Zero amount for token requests
      label: label || 'Card verification',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Endpoint 2: Process Google Pay Token

```
POST /api/gpay/process-google-pay-token

Request Body:
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
  "tokenConsentAgreed": true
}

Backend Processing:
1. Call POST /api/v4/google_pay/payment_data
   - Use mobile_access_token as Bearer token
   - Pass all Google Pay token fields
   - Include token_consent_agreed: true

2. Call GET /api/v4/payments/{payment_reference}
   - Use Basic Auth (api_username:api_secret)
   - Extract cc_details.token (MIT token - 24-char alphanumeric string)

3. Store MIT token in your database

4. Return success confirmation to app

Response:
{
  "success": true,
  "message": "Token successfully saved",
  "mitToken": "abc123xyz456..."  // Optional: return for debugging
}

5. Use the stored MIT token for future payments without user interaction:
   - POST /payments/mit
   - POST /payments/charge
```

**JavaScript/Node.js Implementation:**

```javascript
app.post('/api/gpay/process-google-pay-token', async (req, res) => {
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
    // Step 1: Process payment with EveryPay
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

    const processResult = await processResponse.json();

    // Step 2: Retrieve MIT token from payment details
    const paymentDetailsResponse = await fetch(
      `${EVERYPAY_API_URL}/api/v4/payments/${paymentReference}?api_username=${API_USERNAME}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${API_USERNAME}:${API_SECRET}`).toString('base64')}`,
        },
      }
    );

    const paymentDetails = await paymentDetailsResponse.json();

    // Step 3: Extract MIT token
    const mitToken = paymentDetails.cc_details?.token;

    if (!mitToken) {
      throw new Error('MIT token not found in payment details');
    }

    // Step 4: Store MIT token in your database
    await db.saveRecurringToken({
      userId: req.user.id, // Your user ID
      mitToken: mitToken,
      paymentReference: paymentReference,
      lastFourDigits: paymentDetails.cc_details.last_four_digits,
      expiryMonth: paymentDetails.cc_details.month,
      expiryYear: paymentDetails.cc_details.year,
      createdAt: new Date(),
    });

    // Step 5: Return success
    res.json({
      success: true,
      message: 'Token successfully saved',
      cardInfo: {
        lastFourDigits: paymentDetails.cc_details.last_four_digits,
        expiryMonth: paymentDetails.cc_details.month,
        expiryYear: paymentDetails.cc_details.year,
      },
    });
  } catch (error) {
    console.error('Token processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

## SDK Mode

### Flow Diagram

```
React Native App          EveryPay API            Google Pay
      │                        │                      │
      │  1. Initialize         │                      │
      │───────────────────────►│                      │
      │  (open_session)        │                      │
      │                        │                      │
      │  2. Session data       │                      │
      │◄───────────────────────│                      │
      │                        │                      │
      │  3. Request token      │                      │
      │  (POST /oneoff)        │                      │
      │  (amount=0)            │                      │
      │───────────────────────►│                      │
      │                        │                      │
      │                        │  4. Show Google Pay  │
      │                        │  (amount: $0,        │
      │                        │   ESTIMATED)         │
      │────────────────────────┼─────────────────────►│
      │                        │                      │
      │                        │  5. User authorizes  │
      │◄───────────────────────┼──────────────────────│
      │                        │                      │
      │  6. Process token      │                      │
      │  (POST /payment_data)  │                      │
      │───────────────────────►│                      │
      │                        │                      │
      │  7. Get MIT token      │                      │
      │  (GET /payments)       │                      │
      │───────────────────────►│                      │
      │                        │                      │
      │  8. MIT token returned │                      │
      │◄───────────────────────│                      │
      │                        │                      │
      │  9. Store MIT token    │                      │
      │  for recurring         │                      │
```

### Step 1: Configure for SDK Mode

```typescript
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type { EverypayConfig } from '@everypay/googlepay-rn-bridge';

const config: EverypayConfig = {
  apiUsername: 'your_api_username', // Required for SDK mode
  apiSecret: 'your_api_secret', // Required for SDK mode
  apiUrl: 'https://api.sandbox.everypay.com',
  environment: 'TEST', // or 'PRODUCTION'
  accountName: 'EUR3D1',
  countryCode: 'EE',
  customerUrl: 'https://your-domain.com/callback',
  currencyCode: 'EUR',
  requestToken: true, // Enable token request mode
};
```

### Step 2: Setup Component with Consent Flow

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { GooglePayButton } from '@everypay/googlepay-rn-bridge';
import type { TokenRequestResult } from '@everypay/googlepay-rn-bridge';

function RecurringPaymentSetup() {
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsent, setShowConsent] = useState(true);

  const handleConsentGiven = () => {
    setShowConsent(false);
    setHasConsented(true);
  };

  const handleTokenRequest = async (result: TokenRequestResult) => {
    // Token collection already processed by SDK
    console.log('Token request result:', result);

    // Extract the MIT token for storage
    const mitToken = result.paymentDetails?.ccDetails?.token;
    if (mitToken) {
      // Send to your backend for storage (implementation in next step)
      await saveTokenToBackend(result);
    }

    return result;
  };

  return (
    <View>
      <ConsentDialog
        visible={showConsent}
        onConsent={handleConsentGiven}
        onCancel={() => setShowConsent(false)}
      />
      {hasConsented && (
        <GooglePayButton
          config={config}
          tokenLabel="Card verification"
          onPressCallback={handleTokenRequest}
          onPaymentSuccess={(result) => console.log('Token saved!', result)}
          onPaymentError={(error) => console.error('Error:', error)}
          onPaymentCanceled={() => console.log('Canceled')}
          theme="dark"
          buttonType="subscribe"
        />
      )}
    </View>
  );
}
```

### Step 3: Save Token to Backend

```typescript
const saveTokenToBackend = async (result: any) => {
  try {
    // Extract the MIT token (24-character alphanumeric string)
    const mitToken = result.paymentDetails?.ccDetails?.token;
    const cardInfo = result.paymentDetails?.ccDetails;

    if (!mitToken) {
      throw new Error('MIT token not available');
    }

    console.log('MIT token received:', mitToken);
    console.log('Card info:', cardInfo);

    // Send MIT token to your backend for storage
    const saveResult = await fetch(
      'https://your-backend.com/api/save-recurring-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mitToken: mitToken,
          paymentReference: result.paymentDetails.paymentReference,
          lastFourDigits: cardInfo?.lastFourDigits,
          expiryMonth: cardInfo?.month,
          expiryYear: cardInfo?.year,
        }),
      }
    );

    const saveData = await saveResult.json();

    if (saveData.success) {
      console.log('Token saved successfully');
      // Show success message to user
    } else {
      console.error('Failed to save token:', saveData.error);
    }
  } catch (error) {
    console.error('Token save error:', error);
  }
};
```

### Step 4: Backend Endpoint for Token Storage

```javascript
app.post('/api/save-recurring-token', async (req, res) => {
  const {
    mitToken,
    paymentReference,
    lastFourDigits,
    expiryMonth,
    expiryYear,
  } = req.body;

  try {
    // Store MIT token in your database
    await db.saveRecurringToken({
      userId: req.user.id,
      mitToken: mitToken,
      paymentReference: paymentReference,
      lastFourDigits: lastFourDigits,
      expiryMonth: expiryMonth,
      expiryYear: expiryYear,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Token successfully saved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

## Token Data Structure

### TypeScript Interfaces

```typescript
// Token data returned by both modes
interface GooglePayTokenData {
  paymentReference: string;
  mobileAccessToken: string;
  signature: string;
  intermediateSigningKey: {
    signedKey: string;
    signatures: string[];
  };
  protocolVersion: string; // Usually "ECv2"
  signedMessage: string; // Encrypted payment data (DPAN)
  tokenConsentAgreed: boolean; // true for token requests
}

// Extended result for SDK mode (includes MIT token)
interface TokenRequestResult extends GooglePayTokenData {
  paymentDetails?: {
    paymentReference: string;
    paymentState: string;
    ccDetails?: {
      token?: string; // MIT token (24-char alphanumeric)
      lastFourDigits?: string; // Last 4 digits of card
      month?: string; // Expiration month
      year?: string; // Expiration year (YYYY)
    };
  };
}
```

### Backend Mode vs SDK Mode

| Field                            | Backend Mode                      | SDK Mode                    |
| -------------------------------- | --------------------------------- | --------------------------- |
| `tokenData`                      | ✅ Google Pay token (DPAN)        | ✅ Google Pay token (DPAN)  |
| `paymentDetails`                 | ❌ Not included                   | ✅ Includes MIT token       |
| `paymentDetails.ccDetails.token` | ❌ Not included                   | ✅ MIT token (24-char)      |
| MIT Token Retrieval              | Backend must call `GET /payments` | SDK retrieves automatically |

---

## Security Considerations

1. **Backend Mode Preferred** - API credentials never exposed in the app. Backend mode is the most secure approach.

2. **Use HTTPS Only** - All communication between app and backend must be encrypted.

3. **Validate Token Consent** - Always check `tokenConsentAgreed` is `true` before storing tokens.

4. **Secure MIT Token Storage** - Store MIT tokens securely in your database with encryption at rest.

5. **User Authentication** - Verify user identity before allowing token storage or usage.

6. **Token Lifecycle Management**:
   - Monitor card expiration dates (`month`, `year`)
   - Implement token revocation when users request it
   - Delete tokens when cards expire
   - Allow users to view and manage saved cards

---

## Troubleshooting

### Common Issues

**Issue:** Google Pay shows error "Developer Error"

- **Solution:** Ensure your app is properly configured for Google Pay. Check that the Android manifest includes Google Pay metadata.

**Issue:** Token has `tokenConsentAgreed: false`

- **Solution:** Set `requestToken: true` in your `EverypayConfig`, not `false` or `undefined`. For backend mode, ensure your backend endpoint calls EveryPay `POST /oneoff` with `request_token=true` and `token_consent_agreed=true`.

**Issue:** MIT token not returned in backend mode

- **Solution:** Backend must call `GET /api/v4/payments/{payment_reference}` after `POST /google_pay/payment_data` to retrieve the MIT token from `cc_details.token`.

**Issue:** MIT token is `undefined` in SDK mode

- **Solution:** Check `result.paymentDetails?.ccDetails?.token`. Ensure payment was successful before extracting token. The payment state should be "settled" or "authorized".

**Issue:** Recurring payment fails with stored MIT token

- **Solution:**
  - Check that the card hasn't expired (compare current date with `year` and `month`)
  - Ensure you're using `POST /payments/mit` or `/payments/charge` endpoints
  - Verify the token is being sent correctly in the API request

**Issue:** User canceled token collection

- **Solution:** Handle `E_PAYMENT_CANCELED` error gracefully. Allow user to retry or skip token collection.

---

## FAQ

**Q: Can I use the MIT token immediately for a payment?**

A: Yes, once you receive the MIT token (either from backend `GET /payments` or SDK mode `paymentDetails.ccDetails.token`), you can use it immediately for recurring payments with `POST /payments/mit` or `POST /payments/charge`.

**Q: How long is the MIT token valid?**

A: MIT tokens are valid until the underlying card expires. Monitor the `month` and `year` fields from `cc_details` and request a new token when the card is close to expiration.

**Q: Do I need to show $0 to the user?**

A: Yes, Google Pay will display your label (e.g., "Card verification") with zero amount and ESTIMATED status. This is a Google Pay requirement for token requests.

**Q: Can I collect the first payment and token together?**

A: Not directly with this flow. You should make a regular payment first, then request the token separately for future recurring payments. Alternatively, you could collect a token first and then immediately use it for the first MIT payment.

**Q: What if the user has multiple cards?**

A: Google Pay allows the user to select which card to tokenize. You receive the MIT token for their selected card. Users can add multiple tokens by repeating the token collection flow.

**Q: What's the difference between SDK mode and Backend mode?**

A:

- **Backend Mode (Recommended)**: Your backend makes all EveryPay API calls. API credentials stay secure on the server. The React Native app only handles Google Pay UI.
- **SDK Mode**: The SDK makes EveryPay API calls directly from the app, requiring API credentials in the app. Less secure but simpler for testing.

**Q: How do I let users manage their saved cards?**

A: Implement a settings screen in your app that:

1. Fetches saved tokens from your backend
2. Displays last 4 digits, expiry date, and card type
3. Allows users to delete tokens (remove from database and inform user the card is removed)
4. Shows when each card was added

---

## Additional Resources

- [Google Pay API Documentation](https://developers.google.com/pay/api)
- [EveryPay API Documentation](https://support.every-pay.com/api-documentation/)
- [EveryPay MIT Payments Guide](https://support.every-pay.com/merchant-support/integrate-automatically-collected-payments-mit/)
- [Backend Integration Guide](./BACKEND_INTEGRATION.md) - General backend setup
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/) - Security standards for card data

---
