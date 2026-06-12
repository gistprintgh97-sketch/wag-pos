import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import {
  Settings,
  Store,
  Receipt,
  AlertTriangle,
  Save,
  Smartphone,
  CreditCard,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, tenant } = useAuth();
  const { execute } = useApi();
  const [settings, setSettings] = useState({
    shopName: "",
    currency: "GHS",
    receiptFooter: "",
    receiptHeader: "",
    taxRate: 0,
    lowStockThreshold: 10,
    enableMomo: false,
    enableCard: false,
    enableCreditSales: false
  });
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const result = await execute(() => API.get("/settings"), { showError: false });
    if (result.success) setSettings(result.data);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await execute(
      () => API.put("/settings", settings),
      { successMessage: "Settings saved successfully!" }
    );
    setSaving(false);
    if (result.success) {
      document.title = settings.shopName;
    }
  };

  const toggleFeature = (feature) => {
    setSettings(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-pos-dark">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your POS system</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Store size={20} className="text-primary-600" />
          <h2 className="text-lg font-bold text-pos-dark">Shop Information</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={settings.shopName}
            onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="input-field"
          >
            <option value="GHS">Ghana Cedi (GHS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="NGN">Nigerian Naira (NGN)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Receipt size={20} className="text-primary-600" />
          <h2 className="text-lg font-bold text-pos-dark">Receipt Settings</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header</label>
          <input
            type="text"
            value={settings.receiptHeader || ""}
            onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
            className="input-field"
            placeholder="Optional header text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
          <textarea
            value={settings.receiptFooter}
            onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
            rows={3}
            className="input-field resize-none"
            placeholder="Thank you for your purchase!"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input
              type="number"
              min="1"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 10 })}
              className="input-field"
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-lg font-bold text-pos-dark mb-4">Payment Features</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-pos-blue" />
                <div>
                  <p className="font-medium text-sm">Mobile Money (MoMo)</p>
                  <p className="text-xs text-gray-400">Accept MTN MoMo payments</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeature("enableMomo")}
                className={settings.enableMomo ? "text-pos-blue" : "text-gray-300"}
              >
                {settings.enableMomo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-green-600" />
                <div>
                  <p className="font-medium text-sm">Card Payments</p>
                  <p className="text-xs text-gray-400">Accept credit/debit cards</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeature("enableCard")}
                className={settings.enableCard ? "text-pos-blue" : "text-gray-300"}
              >
                {settings.enableCard ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Danger Zone */}
      {user?.role === "ADMIN" && (
        <div className="card border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These actions are destructive and cannot be undone.
          </p>
          <button
            onClick={() => toast.info("Contact support to delete your shop")}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Delete Shop Account
          </button>
        </div>
      )}
    </div>
  );
}
