import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { Store, Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ForgotPin() {
  const [step, setStep] = useState("email"); // email | code | newpin
  const [shopSlug, setShopSlug] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const resetForm = () => {
    setError("");
    setMessage("");
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      const res = await API.post("/users/forgot-pin", {
        email,
        shopSlug
      });
      setMessage(res.data.message);
      if (res.data.debugCode) setCode(res.data.debugCode);
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      const res = await API.post("/users/verify-reset-code", {
        email,
        code,
        shopSlug
      });
      setUserId(res.data.userId);
      setStep("newpin");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      await API.post("/users/confirm-reset-pin", {
        userId,
        code,
        newPin,
        shopSlug
      });
      setMessage("PIN reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628] relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,180,255,0.4) 1px, transparent 0)',
        backgroundSize: '48px 48px'
      }} />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Your PIN</h1>
          <p className="text-slate-400 mt-1">
            {step === "email" && "Enter your shop details to get a reset code"}
            {step === "code" && "Enter the 6-digit code sent to your email"}
            {step === "newpin" && "Create a new PIN for your account"}
          </p>
        </div>

        <div className="bg-[#111d32]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-500/20">
          {(message || error) && (
            <div className={`mb-4 p-3 rounded-xl text-sm text-center ${
              error ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"
            }`}>
              {error || message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Shop Slug</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(e) => setShopSlug(e.target.value.toLowerCase().trim())}
                    placeholder="your-shop-name"
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    placeholder="you@example.com"
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Sending...</span> : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-4 py-3 text-center text-white text-xl tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Verifying...</span> : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-slate-400 text-sm hover:text-white transition-colors"
              >
                Back to email
              </button>
            </form>
          )}

          {step === "newpin" && (
            <form onSubmit={handleResetPin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New PIN</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="4-6 digits"
                    maxLength={6}
                    className="w-full bg-[#0d1525] border border-slate-700 rounded-xl px-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPin.length < 4}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50"
              >
                {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Updating...</span> : "Update PIN"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate("/login")}
              className="text-sm text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}