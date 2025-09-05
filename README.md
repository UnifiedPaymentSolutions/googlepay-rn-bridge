# @everypay/googlepay-rn-bridge

EveryPay Google Pay React Native Bridge (Android Only). Typescript support.

## Installation

```sh
npm install @everypay/googlepay-rn-bridge
```

```sh
yarn add @everypay/googlepay-rn-bridge
```

## Usage

```js
import {
  GooglePayButton,
  type GooglePayButtonConfig,
  type PaymentProcessResponse
} from '@everypay/googlepay-rn-bridge';

// ...
function App(): React.JSX.Element {

  const config: GooglePayButtonConfig = {
    apiUsername: '<API_USERNAME>',
    apiSecret: '<API_SECRET>',
    apiUrl: '<EVERYPAY_API_URL>',
    environment: "TEST",  // or "PRODUCTION"
    countryCode: "EE",
    currencyCode: "EUR",
    accountName: "<EVERYPAY_ACCOUNT_NAME>",
    allowedCardNetworks: ["MASTERCARD", "VISA"],
    allowedCardAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"]
  }

  const handlePayment = async (res: PaymentProcessResponse) => {
    try{
      console.log('Google Pay payment result: ', res);
    } catch(e: any){
      console.error(`Google Pay error. Code: ${e.code}, message: ${e.message}`);
    }
  };

  return (
      <GooglePayButton 
        onPressCallback={handlePayment}
        config={config}
        amount={1}
        theme="dark"
        label="Some test shopping"
        orderReference="ORDER1234"
        customerEmail="test@test.com"
      />
  );
}
```

## Google Pay API Setup

### Prerequisites

To use the Google Pay API on Android, your app must meet the following requirements:

- Must be distributed through the Google Play store
- Minimum SDK requirements:
  - `minSdkVersion`: 21 or higher
  - `compileSdkVersion`: 34 or higher
- Supports React Native new architecture

### Configuration Steps

1. Enable Google Pay in your app by adding the following meta-data element to your `android/app/src/main/AndroidManifest.xml` file inside the `<application>` tag:

```xml
<meta-data
  android:name="com.google.android.gms.wallet.api.enabled"
  android:value="true"
/>
```

### Props


#### GooglePayButton Props

| Prop Name         | Type                                                      | Description                                      |
|-------------------|-----------------------------------------------------------|--------------------------------------------------|
| `onPressCallback` | `(result: PaymentProcessResponse) => void` (optional)     | Callback function called after payment process.   |
| `config`          | `GooglePayButtonConfig`                                   | Configuration object for Google Pay & EveryPay.   |
| `theme`           | `'light' \| 'dark'` (optional, default: `'dark'`)         | Button theme.                                    |
| `amount`          | `number`                                                  | Payment amount.                                  |
| `label`           | `string`                                                  | Label for the payment (e.g., product name).       |
| `orderReference`  | `string`                                                  | Unique reference for the order.                   |
| `customerEmail`   | `string`                                                  | Customer's email address.                        |
| `customerIp`      | `string` (optional)                                       | Customer's IP address.                           |

#### GooglePayButtonConfig Fields

| Field                   | Type                                             | Description                                      |
|-------------------------|--------------------------------------------------|--------------------------------------------------|
| `apiUsername`           | `string`                                         | EveryPay API username.                           |
| `apiSecret`             | `string`                                         | EveryPay API secret.                             |
| `apiUrl`                | `string`                                         | EveryPay API base URL.                           |
| `environment`           | `'TEST' \| 'PRODUCTION'`                        | Google Pay environment. (default: 'TEST')                          |
| `countryCode`           | `string`                                         | Country code (e.g., 'EE').                       |
| `currencyCode`          | `string` (optional)                              | Currency code (e.g., 'EUR').                     |
| `accountName`           | `string`                                         | EveryPay account name.                           |
| `allowedCardNetworks`   | `('MASTERCARD' \| 'VISA')[]` (optional)          | Allowed card networks.                           |
| `allowedCardAuthMethods`| `('PAN_ONLY' \| 'CRYPTOGRAM_3DS')[]` (optional)  | Allowed card authentication methods.             |

#### PaymentProcessResponse Example

```js
// Success
{
  state: 'success'
}

// Failure
{
  state: 'failed',
  error: {
    name: 'EveryPayGooglePayError',
    code: 'PAYMENT_FAILED',
    message: 'Payment was declined',
    details: { /* optional extra info */ }
  }
}
```

### Important Notes

- Make sure to comply with the [Google Pay API Acceptable Use Policy](https://developers.google.com/pay/api/android/guides/setup#acceptable-use) and Google Play developer policy.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
[Backward-compatibility](https://github.com/reactwg/react-native-new-architecture/blob/main/docs/backwards-compat-fabric-component.md)
