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
    navigate("/login");
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
    { 
      value: "STARTER", 
      label: "Starter", 
      price: "Free", 
      features: "1 User, 200 Products, Basic Reports" 
    },
    { 
      value: "BASIC", 
      label: "Basic", 
      price: "GHS 149/mo", 
      features: "3 Users, 1,000 Products, Advanced Reports" 
    },
    { 
      value: "PRO", 
      label: "Pro", 
      price: "GHS 349/mo", 
      features: "8 Users, 5,000 Products, All Features" 
    },
    { 
      value: "ENTERPRISE", 
      label: "Enterprise", 
      price: "GHS 799/mo", 
      features: "Unlimited Users, Unlimited Products" 
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628] relative overflow-hidden px-4 py-8">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,180,255,0.4) 1px, transparent 0)',
        backgroundSize: '48px 48px'
      }} />
      {/* Soft glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <ShoppingBag size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Shop</h1>
          <p className="text-slate-400 mt-1">Start your 14-day free trial</p>
        </div>

        <div className="bg-[#111d32]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-500/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Shop Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. GM Supermart"
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Shop URL <span className="text-slate-500 font-normal">(unique identifier)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase())}
                    placeholder="gmsupermart"
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-8 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  app.wagpos.com/{form.slug || "your-shop"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="shop@email.com"
                      className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="020..."
                      className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Business Type</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={form.businessType}
                    onChange={(e) => handleChange("businessType", e.target.value)}
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    {businessTypes.map(t => (
                      <option key={t.value} value={t.value} className="bg-[#0d1525]">{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Admin Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.adminName}
                    onChange={(e) => handleChange("adminName", e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Admin PIN</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPin ? "text" : "password"}
                    value={form.adminPin}
                    onChange={(e) => handleChange("adminPin", e.target.value.replace(/\D/g, ""))}
                    placeholder="4-6 digit PIN"
                    maxLength={6}
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="border-t border-slate-700/50 pt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Choose Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map(plan => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => handleChange("plan", plan.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.plan === plan.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <p className="font-semibold text-sm text-white">{plan.label}</p>
                    <p className="text-xs text-blue-400 font-medium">{plan.price}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.features}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
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

          <div className="mt-4 text-center text-sm text-slate-500">
            Already have a shop?{" "}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}