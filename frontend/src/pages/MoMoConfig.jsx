import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Smartphone,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

export default function MoMoConfig() {
  const { user } = useAuth();
  const { execute, loading } = useApi();
  const [config, setConfig] = useState({
    environment: "SANDBOX",
    apiUser: "",
    apiKey: "",
    subscriptionKey: "",
    callbackUrl: ""
  });
  const [existing, setExisting] = useState(null);

  const fetchConfig = async () => {
    const result = await execute(() => API.get("/momo/config"), { showError: false });
    if (result.success) {
      setExisting(result.data);
      if (result.data.configured) {
        setConfig(prev => ({
          ...prev,
          environment: result.data.environment || "SANDBOX"
        }));
      }
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config.subscriptionKey) {
      toast.error("Subscription Key is required");
      return;
    }

    const result = await execute(
      () => API.post("/momo/config", config),
      { successMessage: "MoMo configuration saved!" }
    );

    if (result.success) {
      fetchConfig();
    }
  };

  const handleTest = async () => {
    toast.info("Testing MoMo connection... (Coming soon)");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-pos-dark flex items-center gap-2">
          <Smartphone size={28} className="text-pos-blue" />
          MTN MoMo Setup
        </h1>
        <p className="text-gray-500 mt-1">Configure Mobile Money payments for your shop</p>
      </div>

      {/* Status Banner */}
      {existing?.configured ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">MoMo is configured</p>
            <p className="text-sm text-green-700 mt-0.5">
              Environment: <span className="font-medium">{existing.environment}</span> | 
              Currency: <span className="font-medium">{existing.currency}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">MoMo not configured</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Set up your MTN MoMo credentials to accept Mobile Money payments.
            </p>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <div className="card">
        <h2 className="text-lg font-bold text-pos-dark mb-3 flex items-center gap-2">
          <Info size={20} className="text-pos-blue" />
          Setup Guide
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Register at <a href="https://momodeveloper.mtn.com" target="_blank" rel="noopener noreferrer" className="text-pos-blue hover:underline inline-flex items-center gap-0.5">MTN Developer Portal <ExternalLink size={12} /></a></li>
          <li>Create a new app and get your <strong>Subscription Key</strong></li>
          <li>Generate an <strong>API User</strong> and <strong>API Key</strong></li>
          <li>For production: request approval from MTN</li>
          <li>Enter your credentials below and save</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
          <strong>Tip:</strong> Start with Sandbox to test. Switch to Production after approval.
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-pos-dark">Credentials</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
          <select
            value={config.environment}
            onChange={(e) => setConfig({ ...config, environment: e.target.value })}
            className="input-field"
          >
            <option value="SANDBOX">Sandbox (Testing)</option>
            <option value="PRODUCTION">Production (Live)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OCP-Apim-Subscription-Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.subscriptionKey}
            onChange={(e) => setConfig({ ...config, subscriptionKey: e.target.value })}
            placeholder="Your MTN subscription key"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API User ID</label>
          <input
            type="text"
            value={config.apiUser}
            onChange={(e) => setConfig({ ...config, apiUser: e.target.value })}
            placeholder="Generated API User UUID"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="Generated API Key"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL</label>
          <input
            type="text"
            value={config.callbackUrl}
            onChange={(e) => setConfig({ ...config, callbackUrl: e.target.value })}
            placeholder="https://yourdomain.com/webhooks/momo"
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">Where MTN will send payment notifications</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Configuration"}
          </button>
          <button
            onClick={handleTest}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Sandbox Test Numbers */}
      {config.environment === "SANDBOX" && (
        <div className="card">
          <h2 className="text-lg font-bold text-pos-dark mb-3">Sandbox Test Numbers</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="font-medium text-pos-dark">Successful Payment</p>
              <p className="text-gray-600 font-mono mt-1">+233 54 000 0000</p>
              <p className="text-xs text-gray-400 mt-0.5">PIN: 1234</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="font-medium text-pos-dark">Failed Payment</p>
              <p className="text-gray-600 font-mono mt-1">+233 54 000 0001</p>
              <p className="text-xs text-gray-400 mt-0.5">PIN: 1234</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
