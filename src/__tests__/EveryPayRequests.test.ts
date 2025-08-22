import {
  openEPSession,
  getMerchantInfo,
  processPayment,
} from '../EveryPayUtil/EveryPayRequests';

// Mock fetch globally
global.fetch = jest.fn();

describe('EveryPay API Requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('openEPSession', () => {
    const mockResponse = {
      googlepay_merchant_identifier: 'test-merchant-id',
      googlepay_ep_merchant_id: 'test-ep-merchant-id',
      googlepay_gateway_merchant_id: 'test-gateway-merchant-id',
      merchant_name: 'Test Merchant',
      google_pay_gateway_id: 'test-gateway',
      acq_branding_domain_igw: 'test-domain',
    };

    it('should make correct API call to open session', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'testsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'EUR3D1',
      };

      const result = await openEPSession(url, user, secret, body);

      expect(fetch).toHaveBeenCalledWith(
        `${url}/api/v4/google_pay/open_session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdHVzZXI6dGVzdHNlY3JldA==',
          },
          body: JSON.stringify(body),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const errorResponse = { error: 'Invalid credentials' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(errorResponse),
      });

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'wrongsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'EUR3D1',
      };

      const result = await openEPSession(url, user, secret, body);

      expect(result).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'testsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'EUR3D1',
      };

      await expect(openEPSession(url, user, secret, body)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getMerchantInfo', () => {
    const mockResponse = {
      account_name: 'test-account',
      order_reference: 'order-123',
      email: 'test@example.com',
      customer_ip: '192.168.1.1',
      customer_url: 'https://example.com',
      payment_created_at: '2023-01-01T00:00:00Z',
      initial_amount: 29.99,
      standing_amount: 29.99,
      payment_reference: 'pay-ref-123',
      payment_link: 'https://example.com/pay',
      payment_methods: [],
      api_username: 'testuser',
      warnings: {},
      stan: null,
      fraud_score: null,
      payment_state: 'pending',
      payment_method: null,
      mobile_access_token: 'access-token-123',
      currency: 'EUR',
      applepay_merchant_identifier: null,
      descriptor_country: 'EE',
      googlepay_merchant_identifier: 'test-merchant-id',
    };

    it('should make correct API call to get merchant info', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'testsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'test-account',
        amount: 29.99,
        label: 'Test Payment',
        currency_code: 'EUR',
        country_code: 'ET',
        order_reference: 'order-123',
        nonce: 'test-nonce',
        mobile_payment: true,
        customer_url: 'https://example.com',
        customer_ip: '192.168.1.1',
        customer_email: 'test@example.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      const result = await getMerchantInfo(url, user, secret, body);

      expect(fetch).toHaveBeenCalledWith(`${url}/api/v4/payments/oneoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdHVzZXI6dGVzdHNlY3JldA==',
        },
        body: JSON.stringify(body),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const errorResponse = { error: 'Invalid payment data' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(errorResponse),
      });

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'testsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'test-account',
        amount: 29.99,
        label: 'Test Payment',
        currency_code: 'EUR',
        country_code: 'ET',
        order_reference: 'order-123',
        nonce: 'test-nonce',
        mobile_payment: true,
        customer_url: 'https://example.com',
        customer_ip: '192.168.1.1',
        customer_email: 'test@example.com',
        timestamp: '2023-01-01T00:00:00Z',
      };

      const result = await getMerchantInfo(url, user, secret, body);

      expect(result).toEqual(errorResponse);
    });
  });

  describe('processPayment', () => {
    const mockResponse = {
      state: 'success',
      payment_id: 'pay-123',
      transaction_id: 'txn-123',
    };

    it('should make correct API call to process payment', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const url = 'https://test-api.everypay.com';
      const authToken = 'access-token-123';
      const body = {
        payment_reference: 'pay-ref-123',
        token_consent_agreed: false,
        signature: 'test-signature',
        intermediateSigningKey: {
          signedKey: 'test-signed-key',
          signatures: ['test-signature'],
        },
        protocolVersion: 'ECv2',
        signedMessage: 'test-signed-message',
      };

      const result = await processPayment(url, authToken, body);

      expect(fetch).toHaveBeenCalledWith(
        `${url}/api/v4/google_pay/payment_data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle payment processing errors', async () => {
      const errorResponse = { error: 'Payment failed', state: 'failed' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(errorResponse),
      });

      const url = 'https://test-api.everypay.com';
      const authToken = 'access-token-123';
      const body = {
        payment_reference: 'pay-ref-123',
        token_consent_agreed: false,
        signature: 'test-signature',
        intermediateSigningKey: {
          signedKey: 'test-signed-key',
          signatures: ['test-signature'],
        },
        protocolVersion: 'ECv2',
        signedMessage: 'test-signed-message',
      };

      const result = await processPayment(url, authToken, body);

      expect(result).toEqual(errorResponse);
    });

    it('should handle network errors during payment processing', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const url = 'https://test-api.everypay.com';
      const authToken = 'access-token-123';
      const body = {
        payment_reference: 'pay-ref-123',
        token_consent_agreed: false,
        signature: 'test-signature',
        intermediateSigningKey: {
          signedKey: 'test-signed-key',
          signatures: ['test-signature'],
        },
        protocolVersion: 'ECv2',
        signedMessage: 'test-signed-message',
      };

      await expect(processPayment(url, authToken, body)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Authentication', () => {
    it('should create correct Basic Auth header', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({}),
      });

      const url = 'https://test-api.everypay.com';
      const user = 'testuser';
      const secret = 'testsecret';
      const body = {
        api_username: 'testuser',
        account_name: 'EUR3D1',
      };

      await openEPSession(url, user, secret, body);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Basic dGVzdHVzZXI6dGVzdHNlY3JldA==',
          }),
        })
      );
    });

    it('should create correct Bearer token header for payment processing', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({}),
      });

      const url = 'https://test-api.everypay.com';
      const authToken = 'access-token-123';
      const body = {
        payment_reference: 'pay-ref-123',
        token_consent_agreed: false,
        signature: 'test-signature',
        intermediateSigningKey: {
          signedKey: 'test-signed-key',
          signatures: ['test-signature'],
        },
        protocolVersion: 'ECv2',
        signedMessage: 'test-signed-message',
      };

      await processPayment(url, authToken, body);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token-123',
          }),
        })
      );
    });
  });
});
