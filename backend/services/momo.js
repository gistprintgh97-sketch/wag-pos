const axios = require("axios");
const crypto = require("crypto");

/**
 * MTN MoMo API Integration Service
 * Supports both Sandbox (testing) and Production environments
 * 
 * Setup required:
 * 1. Register at https://momodeveloper.mtn.com
 * 2. Create an app to get subscription keys
 * 3. Generate API User and API Key
 * 4. For production: request approval and get live credentials
 */

class MomoService {
  constructor(config) {
    this.config = config;
    this.baseURL = config.environment === "PRODUCTION"
      ? "https://momocollectapi.mtn.com"
      : "https://sandbox.momodeveloper.mtn.com";

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Generate a UUID v4
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Create API User (one-time setup per tenant)
   * Sandbox: auto-generates user
   * Production: must be done via MTN portal
   */
  async createApiUser() {
    const uuid = this.generateUUID();
    try {
      await this.api.post("/v1_0/apiuser", {
        providerCallbackHost: this.config.callbackUrl || "https://yourdomain.com/webhooks/momo"
      }, {
        headers: { "X-Reference-Id": uuid }
      });
      return { apiUserId: uuid, success: true };
    } catch (error) {
      console.error("MoMo createApiUser error:", error.response?.data || error.message);
      throw new Error("Failed to create MoMo API user");
    }
  }

  /**
   * Create API Key for the user
   */
  async createApiKey(apiUserId) {
    try {
      const response = await this.api.post(`/v1_0/apiuser/${apiUserId}/apikey`);
      return response.data;
    } catch (error) {
      console.error("MoMo createApiKey error:", error.response?.data || error.message);
      throw new Error("Failed to create MoMo API key");
    }
  }

  /**
   * Get API User details
   */
  async getApiUser(apiUserId) {
    try {
      const response = await this.api.get(`/v1_0/apiuser/${apiUserId}`);
      return response.data;
    } catch (error) {
      console.error("MoMo getApiUser error:", error.response?.data || error.message);
      throw new Error("Failed to fetch MoMo API user");
    }
  }

  /**
   * Request payment (Collection) from customer
   * @param {Object} params
   * @param {string} params.phone - Customer phone number (format: 233XXXXXXXXX or 024XXXXXXX)
   * @param {number} params.amount - Amount to collect
   * @param {string} params.currency - Currency code (EUR for sandbox, GHS for production)
 * @param {string} params.externalId - Your internal transaction reference
   * @param {string} params.payerMessage - Message shown to payer
   * @param {string} params.payeeNote - Internal note
   */
  async requestToPay({ phone, amount, currency, externalId, payerMessage, payeeNote }) {
    const referenceId = this.generateUUID();

    // Format phone number
    let formattedPhone = phone.replace(/\s/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "233" + formattedPhone.substring(1);
    }

    try {
      // Get access token first
      const token = await this.getAccessToken();

      await this.api.post("/collection/v1_0/requesttopay", {
        amount: amount.toString(),
        currency: currency || this.config.currency || "EUR",
        externalId: externalId || referenceId,
        payer: {
          partyIdType: "MSISDN",
          partyId: formattedPhone
        },
        payerMessage: payerMessage || "Payment for purchase",
        payeeNote: payeeNote || "WAG POS Transaction"
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": this.config.targetEnvironment || "sandbox"
        }
      });

      return {
        success: true,
        referenceId,
        message: "Payment request sent to customer"
      };
    } catch (error) {
      console.error("MoMo requestToPay error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to initiate MoMo payment");
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(referenceId) {
    try {
      const token = await this.getAccessToken();
      const response = await this.api.get(`/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Target-Environment": this.config.targetEnvironment || "sandbox"
        }
      });
      return response.data;
    } catch (error) {
      console.error("MoMo getPaymentStatus error:", error.response?.data || error.message);
      throw new Error("Failed to check payment status");
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const token = await this.getAccessToken();
      const response = await this.api.get("/collection/v1_0/account/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Target-Environment": this.config.targetEnvironment || "sandbox"
        }
      });
      return response.data;
    } catch (error) {
      console.error("MoMo getAccountBalance error:", error.response?.data || error.message);
      throw new Error("Failed to fetch account balance");
    }
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.baseURL}/collection/token/`,
        {},
        {
          headers: {
            "Ocp-Apim-Subscription-Key": this.config.subscriptionKey
          },
          auth: {
            username: this.config.apiUser,
            password: this.config.apiKey
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("MoMo getAccessToken error:", error.response?.data || error.message);
      throw new Error("Failed to get MoMo access token");
    }
  }
}

module.exports = MomoService;
