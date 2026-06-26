// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, ArrowRight, Shield, Zap, Globe, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WhatsAppSupport from '../components/WhatsAppSupport';

export default function Login() {
  const [slug, setSlug] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  const features = [
    { icon: Shield, text: "Bank-Grade Security for your business data" },
    { icon: Zap, text: "Lightning-fast checkout experience" },
    { icon: Globe, text: "MTN MoMo integration built-in" },
    { icon: Store, text: "Trusted by 500+ Ghanaian businesses" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(slug.trim(), pin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid shop name or PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setSlug('demo');
    setPin('1234');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div 
            onClick={() => navigate('/')}
            className="mb-8 cursor-pointer"
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Welcome to <span className="text-yellow-400">WAG POS</span>
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              The modern point-of-sale system built specifically for Ghanaian businesses. 
              Sell faster, track smarter, grow bigger.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="relative min-h-[56px]">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = index === currentFeature;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      isActive ? 'opacity-100 translate-x-0 relative' : 'opacity-0 translate-x-4 absolute top-0 left-0'
                    }`}
                  >
                    <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-white font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentFeature ? 'w-8 bg-yellow-400' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-8">
            {[
              { value: '500+', label: 'Businesses' },
              { value: '₵2M+', label: 'Processed' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div 
              onClick={() => navigate('/')}
              className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">WAG POS</h1>
            <p className="text-gray-500 mt-1">Sign in to your shop</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-500 mt-1">Enter your shop credentials to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Name / URL
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="your-shop-name"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1">
                  This is the name you chose when signing up
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your PIN"
                    maxLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tracking-widest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Don&apos;t have a shop?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={handleDemoLogin}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-xl border border-gray-200 transition-all text-sm"
              >
                Try Demo Account — slug: <span className="font-mono text-gray-800">demo</span>, PIN: <span className="font-mono text-gray-800">1234</span>
              </button>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Secured with 256-bit encryption · Made in Ghana
          </p>
        </div>
      </div>

      <WhatsAppSupport />
    </div>
  );
}
