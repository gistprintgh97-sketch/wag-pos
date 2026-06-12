const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(req, secret) {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");
  return hash === req.headers["x-paystack-signature"];
}

/**
 * Handle Paystack webhook events
 */
async function handlePaystackWebhook(req, res) {
  try {
    // Verify signature in production
    if (process.env.NODE_ENV === "production") {
      const isValid = verifyPaystackSignature(req, process.env.PAYSTACK_SECRET_KEY);
      if (!isValid) {
        console.error("Invalid Paystack signature");
        return res.sendStatus(400);
      }
    }

    const event = JSON.parse(req.body);
    const { event: eventType, data } = event;

    console.log(`📩 Paystack webhook: ${eventType}`);

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;

      case "subscription.create":
        await handleSubscriptionCreate(data);
        break;

      case "subscription.disable":
        await handleSubscriptionDisable(data);
        break;

      case "invoice.create":
        await handleInvoiceCreate(data);
        break;

      case "invoice.update":
        await handleInvoiceUpdate(data);
        break;

      case "subscription.not_renew":
        await handleSubscriptionNotRenew(data);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
}

async function handleChargeSuccess(data) {
  const { reference, metadata, amount, currency } = data;

  if (!metadata?.tenantId) {
    console.log("No tenantId in metadata, skipping");
    return;
  }

  // Update or create payment record
  await prisma.payment.upsert({
    where: { paystackRef: reference },
    update: {
      status: "SUCCESS",
      amount: amount / 100,
      currency: currency || "GHS"
    },
    create: {
      tenantId: metadata.tenantId,
      amount: amount / 100,
      currency: currency || "GHS",
      status: "SUCCESS",
      method: "PAYSTACK",
      paystackRef: reference,
      description: metadata.description || "Paystack payment"
    }
  });

  // If this is a subscription payment, update subscription
  if (metadata.type === "subscription") {
    const periodEnd = new Date();
    if (metadata.billingCycle === "YEARLY") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await prisma.subscription.update({
      where: { tenantId: metadata.tenantId },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd
      }
    });

    await prisma.tenant.update({
      where: { id: metadata.tenantId },
      data: { status: "ACTIVE" }
    });
  }

  console.log(`✅ Payment ${reference} processed for tenant ${metadata.tenantId}`);
}

async function handleSubscriptionCreate(data) {
  const { subscription_code, email_token, plan, customer } = data;

  // Find tenant by email
  const tenant = await prisma.tenant.findFirst({
    where: { email: customer.email }
  });

  if (tenant) {
    await prisma.subscription.update({
      where: { tenantId: tenant.id },
      data: {
        paystackSubCode: subscription_code,
        paystackEmailToken: email_token
      }
    });
  }
}

async function handleSubscriptionDisable(data) {
  const { subscription_code } = data;

  const subscription = await prisma.subscription.findFirst({
    where: { paystackSubCode: subscription_code }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" }
    });

    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { status: "CANCELLED" }
    });
  }
}

async function handleInvoiceCreate(data) {
  console.log("Invoice created:", data.reference);
  // Could send email notification here
}

async function handleInvoiceUpdate(data) {
  const { status, subscription, amount } = data;

  if (status === "success") {
    // Payment succeeded - extend subscription
    const sub = await prisma.subscription.findFirst({
      where: { paystackSubCode: subscription.subscription_code }
    });

    if (sub) {
      const periodEnd = new Date(sub.currentPeriodEnd);
      if (sub.billingCycle === "YEARLY") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: periodEnd
        }
      });

      await prisma.payment.create({
        data: {
          tenantId: sub.tenantId,
          amount: amount / 100,
          currency: "GHS",
          status: "SUCCESS",
          method: "PAYSTACK",
          description: `Subscription renewal - ${sub.plan}`
        }
      });
    }
  }
}

async function handleSubscriptionNotRenew(data) {
  const { subscription_code } = data;

  const subscription = await prisma.subscription.findFirst({
    where: { paystackSubCode: subscription_code }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "PAST_DUE" }
    });
  }
}

module.exports = { handlePaystackWebhook, verifyPaystackSignature };
