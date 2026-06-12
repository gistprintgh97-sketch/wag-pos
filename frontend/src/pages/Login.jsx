import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Lock, Eye, EyeOff, Store } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!slug.trim()) {
      setError("Shop name/URL is required");
      return;
    }
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    const result = await login(slug.trim().toLowerCase(), pin);
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pos-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-pos-dark">WAG POS</h1>
          <p className="text-gray-500 mt-1">Sign in to your shop</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Shop Name / URL
              </label>
              <div className="relative">
                <Store size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/\s/g, "-").toLowerCase())}
                  placeholder="your-shop-name"
                  className="input-field pl-11"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This is the name you chose when signing up
              </p>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PIN
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your PIN"
                  maxLength={6}
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !slug || pin.length < 4}
              className="btn-primary w-full py-3.5 text-base"
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

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Don&apos;t have a shop?{" "}
              <Link to="/register" className="text-pos-blue font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6">
          <p>Demo: slug=demo, pin=1234</p>
        </div>
      </div>
    </div>
  );
}
