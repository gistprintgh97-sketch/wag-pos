import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Lock, Eye, EyeOff, Store, Mail, Phone, User, Building2 } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    businessType: "SUPERMARKET",
    adminName: "",
    adminPin: "",
    plan: "STARTER"
  });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.slug || !form.email || !form.adminName || !form.adminPin) {
      setError("All required fields must be filled");
      return;
    }
    if (form.adminPin.length < 4) {
      setError("Admin PIN must be at least 4 digits");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  const businessTypes = [
    { value: "SUPERMARKET", label: "Supermarket" },
    { value: "MINI_STORE", label: "Mini Store" },
    { value: "PHARMACY", label: "Pharmacy" },
    { value: "RESTAURANT", label: "Restaurant" },
    { value: "RETAIL", label: "Retail Shop" },
    { value: "OTHER", label: "Other" }
  ];

  const plans = [
    { value: "STARTER", label: "Starter", price: "Free", features: "2 users, 100 products" },
    { value: "BASIC", label: "Basic", price: "GHS 49/mo", features: "5 users, 500 products, MoMo" },
    { value: "PRO", label: "Pro", price: "GHS 99/mo", features: "15 users, 2000 products, All features" },
    { value: "ENTERPRISE", label: "Enterprise", price: "GHS 249/mo", features: "50 users, 10K products, Priority support" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-pos-blue rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShoppingBag size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-pos-dark">Create Your Shop</h1>
          <p className="text-gray-500 mt-1">Start your 14-day free trial</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. ABC Supermarket"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop URL <span className="text-gray-400 font-normal">(unique identifier)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase())}
                    placeholder="abc-shop"
                    className="input-field pl-8"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  app.wagpos.com/{form.slug || "your-shop"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="shop@email.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+233..."
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={form.businessType}
                    onChange={(e) => handleChange("businessType", e.target.value)}
                    className="input-field pl-10"
                  >
                    {businessTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.adminName}
                    onChange={(e) => handleChange("adminName", e.target.value)}
                    placeholder="Your name"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPin ? "text" : "password"}
                    value={form.adminPin}
                    onChange={(e) => handleChange("adminPin", e.target.value.replace(/\D/g, ""))}
                    placeholder="4-6 digit PIN"
                    maxLength={6}
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map(plan => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => handleChange("plan", plan.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.plan === plan.value
                        ? "border-pos-blue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-sm text-pos-dark">{plan.label}</p>
                    <p className="text-xs text-pos-blue font-medium">{plan.price}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{plan.features}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating shop...
                </span>
              ) : (
                "Create Shop & Start Free Trial"
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have a shop?{" "}
            <Link to="/login" className="text-pos-blue font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
