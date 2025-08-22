import { base64Encode } from '../util';

interface OpenEPSessionRequestBody {
  api_username: string;
  account_name: string;
}

interface MerchantInfoRequestBody {
  api_username: string;
  account_name: string;
  amount: number;
  label: string;
  currency_code: string;
  country_code: string;
  order_reference: string;
  nonce: string;
  mobile_payment: boolean;
  customer_url: string;
  customer_ip: string;
  customer_email: string;
  timestamp: string;
}

export interface OpenEPSessionResponse {
  googlepay_merchant_identifier: string;
  googlepay_ep_merchant_id: string;
  googlepay_gateway_merchant_id: string;
  merchant_name: string;
  google_pay_gateway_id: string;
  acq_branding_domain_igw: string;
}

export interface GetMerchantInfoResponse {
  account_name: string;
  order_reference: string;
  email: string | null;
  customer_ip: string | null;
  customer_url: string;
  payment_created_at: string;
  initial_amount: number;
  standing_amount: number;
  payment_reference: string;
  payment_link: string;
  payment_methods: PaymentMethod[];
  api_username: string;
  warnings: Record<string, string>;
  stan: string | null;
  fraud_score: string | null;
  payment_state: string;
  payment_method: string | null;
  mobile_access_token: string;
  currency: string;
  applepay_merchant_identifier: string | null;
  descriptor_country: string;
  googlepay_merchant_identifier: string;
}

interface PaymentMethod {
  source: string;
  display_name: string;
  country_code: string | null;
  payment_link: string;
  logo_url: string;
  applepay_available: boolean;
  googlepay_available: boolean;
  wallet_display_name: string;
  available: boolean;
}

interface PaymentProcessRequestBody {
  payment_reference: string;
  token_consent_agreed: boolean;
  signature: string;
  intermediateSigningKey: {
    signedKey: string /* JSON stringified object */;
    signatures: string[];
  };
  protocolVersion: string;
  signedMessage: string /* JSON stringified object */;
}

export const openEPSession = async (
  url: string,
  user: string,
  secret: string,
  body: OpenEPSessionRequestBody
): Promise<OpenEPSessionResponse> => {
  const response = await fetch(`${url}/api/v4/google_pay/open_session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createBasicAuthHeader(user, secret),
    },
    body: JSON.stringify(body),
  });

  return response.json();
};

export const getMerchantInfo = async (
  url: string,
  user: string,
  secret: string,
  body: MerchantInfoRequestBody
): Promise<GetMerchantInfoResponse> => {
  const response = await fetch(`${url}/api/v4/payments/oneoff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createBasicAuthHeader(user, secret),
    },
    body: JSON.stringify(body),
  });

  return response.json();
};

const createBasicAuthHeader = (username: string, password: string): string => {
  const credentials = `${username}:${password}`;
  const encodedCredentials = base64Encode(credentials);
  return `Basic ${encodedCredentials}`;
};

export const processPayment = async (
  url: string,
  authToken: string,
  body: PaymentProcessRequestBody
) => {
  const response = await fetch(`${url}/api/v4/google_pay/payment_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  return response.json();
};
