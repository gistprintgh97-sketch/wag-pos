import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  TrendingUp,
  Calendar,
  ArrowRight,
  Receipt,
  X,
  User
} from "lucide-react";

export default function Dashboard() {
  const { tenant } = useAuth();
  const { execute, loading } = useApi();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const fetchDashboard = async () => {
    const result = await execute(() => API.get("/reports/dashboard"), { showError: true });
    if (result.success) {
      setStats(result.data);
    }
  };

  const fetchRecentSales = async () => {
    const result = await execute(() => API.get("/sales/history?limit=5"), { showError: false });
    if (result.success) {
      setRecentSales(result.data.sales?.slice(0, 5) || []);
    }
  };

  const fetchLowStock = async () => {
    const result = await execute(() => API.get("/reports/low-stock"), { showError: false });
    if (result.success) {
      setLowStockProducts(result.data || []);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchRecentSales();
    fetchLowStock();
  }, []);

  const viewSaleDetail = (sale) => {
    setSelectedSale(sale);
    setShowSaleDetail(true);
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick, clickable }) => (
    <div 
      onClick={onClick}
      className={`card flex items-center gap-4 ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold text-pos-dark">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      {clickable && <ArrowRight size={16} className="text-gray-400 ml-auto" />}
    </div>
  );

  if (loading && !stats) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-pos-dark">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {tenant?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={DollarSign} 
          label="Today's Sales" 
          value={`GHS ${stats?.todaySales?.toFixed(2) || "0.00"}`}
          color="bg-green-100 text-green-600"
          clickable={true}
          onClick={() => {
            execute(() => API.get("/sales/history?today=true"), { showError: true })
              .then(res => {
                if (res.success && res.data.sales?.length > 0) {
                  setSelectedSale({
                    id: "TODAY",
                    items: res.data.sales.flatMap(s => s.items || []),
                    total: res.data.sales.reduce((sum, s) => sum + s.total, 0),
                    createdAt: new Date(),
                    cashier: { name: "Multiple Staff" },
                    paymentMethod: "Mixed",
                    isAggregate: true,
                    sales: res.data.sales
                  });
                  setShowSaleDetail(true);
                }
              });
          }}
        />
        <StatCard 
          icon={ShoppingBag} 
          label="Total Sales" 
          value={stats?.totalSales || 0}
          color="bg-blue-100 text-blue-600"
          clickable={true}
          onClick={() => {
            execute(() => API.get("/sales/history"), { showError: true })
              .then(res => {
                if (res.success && res.data.sales?.length > 0) {
                  setSelectedSale({
                    id: "ALL",
                    items: res.data.sales.flatMap(s => s.items || []),
                    total: res.data.sales.reduce((sum, s) => sum + s.total, 0),
                    createdAt: new Date(),
                    cashier: { name: "All Staff" },
                    paymentMethod: "Mixed",
                    isAggregate: true,
                    sales: res.data.sales
                  });
                  setShowSaleDetail(true);
                }
              });
          }}
        />
        <StatCard 
          icon={Package} 
          label="Products" 
          value={stats?.totalProducts || 0}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard 
          icon={Users} 
          label="Staff" 
          value={stats?.totalUsers || 0}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pos-dark">Recent Sales</h2>
          <span className="text-sm text-gray-500">Click any sale for details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Receipt</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => (
                <tr 
                  key={sale.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => viewSaleDetail(sale)}
                >
                  <td className="py-2 px-3">
                    <span className="font-mono text-sm text-pos-blue">#{sale.id?.toString().padStart(6, '0')}</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{sale.cashier?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600">{sale.items?.length || 0} items</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sale.paymentMethod === "Cash" ? "bg-green-100 text-green-700" :
                      sale.paymentMethod === "MTN_MOMO" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-pos-dark">
                    GHS {sale.total?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentSales.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Receipt size={48} className="mx-auto mb-3 opacity-30" />
            <p>No sales yet today</p>
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="card border-l-4 border-red-400">
          <h2 className="text-lg font-bold text-pos-dark mb-3 flex items-center gap-2">
            <TrendingUp size={20} className="text-red-500" />
            Low Stock Alert
          </h2>
          <div className="space-y-2">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-medium text-pos-dark">{product.name}</p>
                  <p className="text-sm text-red-600">Only {product.stock} left</p>
                </div>
                <span className="text-sm font-bold text-red-600">Restock</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showSaleDetail && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-pos-dark flex items-center gap-2">
                <Receipt size={20} className="text-pos-blue" />
                {selectedSale.isAggregate ? "Sales Breakdown" : "Receipt Details"}
              </h2>
              <button 
                onClick={() => setShowSaleDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h3 className="font-bold text-xl text-pos-dark">{tenant?.name}</h3>
                {!selectedSale.isAggregate && (
                  <p className="text-sm text-gray-500">Receipt #{selectedSale.id?.toString().padStart(6, '0')}</p>
                )}
                <p className="text-sm text-gray-500">
                  {selectedSale.isAggregate 
                    ? `${selectedSale.sales?.length || 0} transactions`
                    : new Date(selectedSale.createdAt).toLocaleString()
                  }
                </p>
              </div>

              <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                <span className="text-gray-500 flex items-center gap-1">
                  <User size={14} />
                  Processed by
                </span>
                <span className="font-medium text-pos-dark">{selectedSale.cashier?.name || "Unknown"}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Items Sold</h4>

                {selectedSale.isAggregate ? (
                  Object.values(
                    selectedSale.items.reduce((acc, item) => {
                      const name = item.product?.name || item.name || "Unknown";
                      if (!acc[name]) {
                        acc[name] = { ...item, name, totalQuantity: 0, totalPrice: 0 };
                      }
                      acc[name].totalQuantity += item.quantity;
                      acc[name].totalPrice += item.quantity * item.price;
                      return acc;
                    }, {})
                  ).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-pos-dark">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.totalQuantity} x GHS {item.price?.toFixed(2)}</p>
                      </div>
                      <span className="font-semibold text-pos-dark">GHS {item.totalPrice?.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  selectedSale.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-pos-dark">{item.product?.name || item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x GHS {item.price?.toFixed(2)}</p>
                      </div>
                      <span className="font-semibold text-pos-dark">GHS {(item.quantity * item.price)?.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-pos-dark">Total</span>
                  <span className="text-pos-blue">GHS {selectedSale.total?.toFixed(2)}</span>
                </div>
                {!selectedSale.isAggregate && (
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="font-medium">{selectedSale.paymentMethod}</span>
                  </div>
                )}
              </div>

              {selectedSale.isAggregate && selectedSale.sales && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">Individual Transactions</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSale.sales.map((sale, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <span className="font-mono text-pos-blue">#{sale.id?.toString().padStart(6, '0')}</span>
                          <span className="text-gray-500 ml-2">by {sale.cashier?.name}</span>
                        </div>
                        <span className="font-medium">GHS {sale.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 pt-2">
                Thank you for shopping with us!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}