// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Search,
  Plus,
  History,
  Crown,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { execute } = useApi();
  const [products, setProducts] = useState([]);
  const [report, setReport] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const isTrial = tenant?.status === "TRIAL";
  const trialDaysLeft = tenant?.trialEndsAt
    ? Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, reportRes] = await Promise.all([
        API.get("/products"),
        API.get("/reports")
      ]);
      setProducts(productsRes.data);
      setReport(reportRes.data);
      setLowStock(reportRes.data.lowStock || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleShowSalesHistory = async () => {
    const result = await execute(() => API.get("/sales?limit=10"), { showError: true });
    if (result.success) {
      setSalesHistory(result.data.sales || []);
      setShowSalesHistory(true);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    {
      title: "Total Sales",
      value: report.today?.totalSales || 0,
      subtitle: "Today",
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Revenue",
      value: `GHS ${(report.today?.revenue || 0).toFixed(2)}`,
      subtitle: "Today",
      icon: TrendingUp,
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Profit",
      value: `GHS ${(report.today?.profit || 0).toFixed(2)}`,
      subtitle: "Today",
      icon: DollarSign,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 p-6">
      {/* Trial Banner */}
      {isTrial && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={24} />
              <div>
                <p className="font-bold">Free Trial Active</p>
                <p className="text-sm opacity-90">
                  {trialDaysLeft > 0
                    ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`
                    : "Trial ending soon"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/billing")}
              className="bg-white text-orange-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{tenant?.name || "Dashboard"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as: <span className="font-semibold text-blue-600">{user?.name}</span>
            {user?.role === "ADMIN" && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                <Crown size={10} /> Admin
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.role === "ADMIN" && (
            <button
              onClick={() => navigate("/products")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Product
            </button>
          )}
          <button
            onClick={handleShowSalesHistory}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <History size={18} />
            Sales History
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center ${stat.textColor}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{stat.value}</p>
                <p className={`text-xs font-medium ${stat.textColor} mt-1`}>{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700 mt-1">
              {lowStock.length} product(s) running low: {lowStock.map(p => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onUpdate={fetchData} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No products found</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-slate-400 pt-4">
        © 2025 WAG POS System. All rights reserved.
      </div>

      {/* Sales History Modal */}
      <Modal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        title="Sales History"
        maxWidth="2xl"
      >
        <SalesHistoryTable sales={salesHistory} />
      </Modal>
    </div>
  );
}

function ProductCard({ product, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { execute } = useApi();
  const [showActions, setShowActions] = useState(false);

  const isLowStock = product.stock <= 10;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-500 font-bold text-xl">
        {product.name.substring(0, 2).toUpperCase()}
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{product.name}</h3>
      <p className="text-xl font-bold text-blue-600 mb-1">GHS {product.price.toFixed(2)}</p>
      <p className={`text-sm font-medium mb-4 ${isLowStock ? "text-red-500" : "text-slate-500"}`}>
        Stock: {product.stock}
      </p>
      <div className="space-y-2">
        <button
          onClick={() => navigate("/sales")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            {showActions ? "Hide Actions" : "Manage"}
          </button>
        )}

        {showActions && user?.role === "ADMIN" && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate("/products")}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Edit Product
            </button>
            <button
              onClick={async () => {
                const qty = prompt("Enter restock quantity:");
                if (!qty || isNaN(qty)) return;
                const result = await execute(() =>
                  API.put(`/products/restock/${product.id}`, { quantity: parseInt(qty) }),
                  { successMessage: "Restocked successfully!" }
                );
                if (result.success) onUpdate();
              }}
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Restock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SalesHistoryTable({ sales }) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <History size={40} className="mx-auto mb-2" />
        <p>No sales recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Payment</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4 font-medium text-slate-800">#{sale.id}</td>
              <td className="py-3 px-4 font-bold text-emerald-600">GHS {sale.total?.toFixed(2)}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                  sale.paymentMethod === "Cash" ? "bg-green-100 text-green-700" :
                  sale.paymentMethod === "Mobile Money" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {sale.paymentMethod}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {new Date(sale.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}