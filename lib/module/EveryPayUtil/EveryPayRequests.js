'use strict';

import { base64Encode } from '../util.js';
export const openEPSession = async (url, user, secret, body) => {
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
export const getMerchantInfo = async (url, user, secret, body) => {
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
const createBasicAuthHeader = (username, password) => {
  const credentials = `${username}:${password}`;
  const encodedCredentials = base64Encode(credentials);
  return `Basic ${encodedCredentials}`;
};
export const processPayment = async (url, authToken, body) => {
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
//# sourceMappingURL=EveryPayRequests.js.map
