import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Crown,
  Zap,
  Building2,
  Rocket,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function Billing() {
  const { user, tenant } = useAuth();
  const { execute, loading } = useApi();
  const [billingInfo, setBillingInfo] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");

  const fetchBilling = async () => {
    const result = await execute(() => API.get("/billing/info"), { showError: true });
    if (result.success) {
      setBillingInfo(result.data);
      setSelectedPlan(result.data.subscription?.plan || "STARTER");
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleSubscribe = async () => {
    if (selectedPlan === billingInfo?.subscription?.plan && billingInfo?.subscription?.status === "ACTIVE") {
      toast.info("You are already on this plan");
      return;
    }

    const result = await execute(
      () => API.post("/billing/subscribe", { plan: selectedPlan, billingCycle }),
      { showError: true }
    );

    if (result.success) {
      if (result.data.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = result.data.authorizationUrl;
      } else {
        toast.success("Subscription updated!");
        fetchBilling();
      }
    }
  };

  const handleVerify = async (reference) => {
    const result = await execute(
      () => API.post("/billing/verify", { reference }),
      { successMessage: "Payment verified! Subscription active." }
    );
    if (result.success) fetchBilling();
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure? Your access will continue until the end of the billing period.")) return;
    const result = await execute(
      () => API.post("/billing/cancel"),
      { successMessage: "Subscription cancelled." }
    );
    if (result.success) fetchBilling();
  };

  const plans = [
    { 
      id: "STARTER", 
      name: "Starter", 
      icon: Zap, 
      priceMonthly: 0, 
      priceYearly: 0, 
      color: "gray", 
      features: ["1 User", "200 Products", "Basic Reports", "MTN MoMo", "Email Support"] 
    },
    { 
      id: "BASIC", 
      name: "Basic", 
      icon: Building2, 
      priceMonthly: 149, 
      priceYearly: 1520, 
      color: "blue", 
      features: ["3 Users", "1,000 Products", "Advanced Reports", "MTN MoMo + Cards", "Priority Support"] 
    },
    { 
      id: "PRO", 
      name: "Pro", 
      icon: Crown, 
      priceMonthly: 349, 
      priceYearly: 3560, 
      color: "purple", 
      features: ["8 Users", "5,000 Products", "All Features", "Offline Mode", "24/7 Support"] 
    },
    { 
      id: "ENTERPRISE", 
      name: "Enterprise", 
      icon: Rocket, 
      priceMonthly: 799, 
      priceYearly: 8150, 
      color: "amber", 
      features: ["Unlimited Users", "Unlimited Products", "Multi-branch", "API Access", "Dedicated Manager"] 
    }
  ];

  const currentPlan = billingInfo?.subscription?.plan;
  const currentStatus = billingInfo?.subscription?.status;
  const isTrial = currentStatus === "TRIAL";
  const isActive = currentStatus === "ACTIVE";

  if (loading && !billingInfo) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-pos-dark">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and payments</p>
      </div>

      {/* Current Status Card */}
      <div className={`card border-l-4 ${
        isTrial ? "border-amber-400 bg-amber-50" :
        isActive ? "border-green-400 bg-green-50" :
        "border-red-400 bg-red-50"
      }`}>
        <div className="flex items-start gap-3">
          {isTrial ? <AlertTriangle size={24} className="text-amber-500 shrink-0" /> :
           isActive ? <CheckCircle size={24} className="text-green-500 shrink-0" /> :
           <AlertTriangle size={24} className="text-red-500 shrink-0" />}
          <div>
            <p className="font-bold text-lg">
              {isTrial ? "Free Trial Active" :
               isActive ? `${currentPlan} Plan Active` :
               "Subscription Expired"}
            </p>
            {billingInfo?.subscription?.currentPeriodEnd && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Calendar size={14} />
                {isTrial ? "Trial ends" : "Next billing date"}: {new Date(billingInfo.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {isTrial && (
              <p className="text-sm text-amber-700 mt-2">
                Upgrade before your trial ends to keep full access.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="card">
        <h2 className="text-lg font-bold text-pos-dark mb-4">Choose Your Plan</h2>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === "MONTHLY" ? "bg-white shadow-sm text-pos-dark" : "text-gray-500"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              billingCycle === "YEARLY" ? "bg-white shadow-sm text-pos-dark" : "text-gray-500"
            }`}
          >
            Yearly
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Save 15%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            const price = billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan === plan.id
                    ? "border-pos-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${isCurrent ? "ring-2 ring-green-400" : ""}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  plan.color === "gray" ? "bg-gray-100 text-gray-600" :
                  plan.color === "blue" ? "bg-blue-100 text-blue-600" :
                  plan.color === "purple" ? "bg-purple-100 text-purple-600" :
                  "bg-amber-100 text-amber-600"
                }`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-pos-dark">{plan.name}</h3>
                <p className="text-2xl font-bold text-pos-dark mt-1">
                  {price === 0 ? "Free" : `GHS ${price}`}
                  {price > 0 && <span className="text-sm font-normal text-gray-400">/{billingCycle === "YEARLY" ? "yr" : "mo"}</span>}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {selectedPlan === currentPlan && isActive ? "Current Plan" : "Subscribe"}
            <ArrowRight size={16} />
          </button>
          {isActive && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      {billingInfo?.payments?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-pos-dark mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Payment History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingInfo.payments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-sm">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-semibold">GHS {payment.amount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-sm text-gray-600">{payment.method}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        payment.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}