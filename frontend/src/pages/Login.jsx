import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Store, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  const [form, setForm] = useState({ slug: "", pin: "" });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.slug || !form.pin) {
      setError("Shop URL and PIN are required");
      return;
    }

    setLoading(true);
    const result = await login(form.slug, form.pin);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <ShoppingBag size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to WAG Point of Sales</h1>
          <p className="text-slate-400 mt-1">Access your shop dashboard</p>
        </div>

        <div className="bg-[#111d32]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-500/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Shop URL</label>
              <div className="relative">
                <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().trim() })}
                  placeholder="your-shop-name"
                  className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">app.wagpos.com/{form.slug || "your-shop"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">PIN</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPin ? "text" : "password"}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                  placeholder="Enter your PIN"
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

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

                    <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={() => navigate('/forgot-pin')}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              Forgot your PIN?
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            Don't have a shop?{" "}
            <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}