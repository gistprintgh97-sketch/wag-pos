const axios = require("axios");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "https://api.paystack.co";

const paystackApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json"
  }
});

module.exports = {
  // Initialize standard transaction (card/bank)
  initializeTransaction: async ({ email, amount, metadata, callback_url }) => {
    const response = await paystackApi.post("/transaction/initialize", {
      email,
      amount: Math.round(amount),
      metadata,
      callback_url: callback_url || `${process.env.FRONTEND_URL}/paystack/callback`
    });
    return response.data;
  },

  // Charge with mobile money (MoMo)
  charge: async ({ email, amount, currency, mobile_money, metadata }) => {
    const response = await paystackApi.post("/charge", {
      email,
      amount: Math.round(amount),
      currency: currency || "GHS",
      mobile_money,
      metadata
    });
    return response.data;
  },

  // Submit OTP for MoMo verification
  submitOtp: async ({ reference, otp }) => {
    const response = await paystackApi.post("/charge/submit_otp", {
      reference,
      otp
    });
    return response.data;
  },

  // Verify transaction
  verifyTransaction: async (reference) => {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  },

  // Create subscription plan
  createPlan: async ({ name, amount, interval }) => {
    const response = await paystackApi.post("/plan", {
      name,
      amount: Math.round(amount),
      interval
    });
    return response.data;
  },

  // Create subscription
  createSubscription: async ({ customer, plan, authorization }) => {
    const response = await paystackApi.post("/subscription", {
      customer,
      plan,
      authorization
    });
    return response.data;
  },

  // Disable subscription
  disableSubscription: async ({ code, token }) => {
    const response = await paystackApi.post("/subscription/disable", {
      code,
      token
    });
    return response.data;
  }
};
