import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  ShoppingCart, 
  Calendar, 
  User, 
  CreditCard, 
  ChevronDown, 
  ChevronUp,
  Receipt,
  Printer,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export default function Sales() {
  const { user, tenant } = useAuth();
  const { execute, loading } = useApi();
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");

  const fetchSales = async () => {
    const result = await execute(() => API.get("/sales/history"), { showError: true });
    if (result.success) {
      setSales(result.data);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "today":
        return sales.filter(s => new Date(s.createdAt) >= today);
      case "week":
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return sales.filter(s => new Date(s.createdAt) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return sales.filter(s => new Date(s.createdAt) >= monthAgo);
      default:
        return sales;
    }
  };

  const viewSaleDetail = (sale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  const printReceipt = () => {
    window.print();
  };

  const totalAmount = filteredSales().reduce((sum, s) => sum + s.total, 0);

  if (loading && !sales.length) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pos-dark">Sales History</h1>
          <p className="text-gray-500 mt-1">View all transactions with itemized details</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="text-2xl font-bold text-pos-blue">GHS {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
          { key: "all", label: "All Time" }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setDateFilter(filter.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              dateFilter === filter.key 
                ? "bg-white shadow-sm text-pos-dark" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sales List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Receipt #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales().map((sale, index) => (
                <tr 
                  key={sale.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => viewSaleDetail(sale)}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-pos-blue">#{sale.id.toString().padStart(6, '0')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar size={14} />
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{sale.cashier?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{sale.items?.length || 0} items</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sale.paymentMethod === "Cash" ? "bg-green-100 text-green-700" :
                      sale.paymentMethod === "MTN_MOMO" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-pos-dark">GHS {sale.total.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      className="text-pos-blue hover:text-blue-700 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewSaleDetail(sale);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales().length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p>No sales found for this period</p>
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {showReceipt && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-pos-dark flex items-center gap-2">
                <Receipt size={20} className="text-pos-blue" />
                Receipt Details
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={printReceipt}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Print"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h3 className="font-bold text-xl text-pos-dark">{tenant?.name || "WAG POS"}</h3>
                <p className="text-sm text-gray-500">Receipt #{selectedSale.id.toString().padStart(6, '0')}</p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedSale.createdAt).toLocaleDateString()} at {new Date(selectedSale.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Staff Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Processed by:</span>
                <span className="font-medium text-pos-dark">{selectedSale.cashier?.name || "Unknown"}</span>
              </div>

              {/* Itemized List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Items</h4>
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="font-medium text-pos-dark">{item.product?.name || item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x GHS {item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-pos-dark">GHS {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">GHS {selectedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">GHS 0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-pos-dark">Total</span>
                  <span className="text-pos-blue">GHS {selectedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <CreditCard size={14} />
                    Payment Method
                  </span>
                  <span className="font-medium">{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.momoPhone && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">MoMo Number</span>
                    <span className="font-medium">{selectedSale.momoPhone}</span>
                  </div>
                )}
              </div>

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
