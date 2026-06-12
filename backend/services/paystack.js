const axios = require("axios");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json"
  }
});

/**
 * Initialize a Paystack transaction for subscription payment
 */
async function initializeTransaction({ email, amount, planCode, metadata = {} }) {
  try {
    const response = await paystackApi.post("/transaction/initialize", {
      email,
      amount: Math.round(amount * 100), // Paystack expects amount in pesewas/kobo
      plan: planCode, // Optional: for recurring subscriptions
      metadata,
      callback_url: metadata.callbackUrl || `${process.env.FRONTEND_URL}/billing/callback`
    });
    return response.data;
  } catch (error) {
    console.error("Paystack initialize error:", error.response?.data || error.message);
    throw new Error("Failed to initialize payment");
  }
}

/**
 * Verify a Paystack transaction
 */
async function verifyTransaction(reference) {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error("Paystack verify error:", error.response?.data || error.message);
    throw new Error("Failed to verify payment");
  }
}

/**
 * Create a Paystack plan (for recurring billing)
 */
async function createPlan({ name, amount, interval, currency = "GHS" }) {
  try {
    const response = await paystackApi.post("/plan", {
      name,
      amount: Math.round(amount * 100),
      interval, // 'monthly' or 'annually'
      currency
    });
    return response.data;
  } catch (error) {
    console.error("Paystack create plan error:", error.response?.data || error.message);
    throw new Error("Failed to create billing plan");
  }
}

/**
 * Create a subscription
 */
async function createSubscription({ customerEmail, planCode, startDate }) {
  try {
    const response = await paystackApi.post("/subscription", {
      customer: customerEmail,
      plan: planCode,
      start_date: startDate // ISO 8601 format
    });
    return response.data;
  } catch (error) {
    console.error("Paystack subscription error:", error.response?.data || error.message);
    throw new Error("Failed to create subscription");
  }
}

/**
 * Disable/cancel a subscription
 */
async function disableSubscription({ code, token }) {
  try {
    const response = await paystackApi.post("/subscription/disable", {
      code,
      token
    });
    return response.data;
  } catch (error) {
    console.error("Paystack disable subscription error:", error.response?.data || error.message);
    throw new Error("Failed to cancel subscription");
  }
}

/**
 * Fetch subscription details
 */
async function fetchSubscription(subscriptionCode) {
  try {
    const response = await paystackApi.get(`/subscription/${subscriptionCode}`);
    return response.data;
  } catch (error) {
    console.error("Paystack fetch subscription error:", error.response?.data || error.message);
    throw new Error("Failed to fetch subscription");
  }
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  createPlan,
  createSubscription,
  disableSubscription,
  fetchSubscription,
  paystackApi
};
