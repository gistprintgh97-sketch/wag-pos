import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
  Download
} from "lucide-react";
import toast from "react-hot-toast";

export default function Reports() {
  const { user } = useAuth();
  const { execute, loading } = useApi();
  const [report, setReport] = useState({});
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [rangeReport, setRangeReport] = useState(null);
  const [showRangeReport, setShowRangeReport] = useState(false);

  const fetchReport = async () => {
    const result = await execute(() => API.get("/reports"), { showError: false });
    if (result.success) setReport(result.data);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRangeReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    const result = await execute(
      () => API.get(`/reports/range?startDate=${dateRange.start}&endDate=${dateRange.end}`),
      { showError: true }
    );

    if (result.success) {
      setRangeReport(result.data);
      setShowRangeReport(true);
    }
  };

  const exportToCSV = () => {
    if (!rangeReport?.sales) return;

    const headers = ["Sale ID", "Date", "Amount", "Payment Method", "Cashier"];
    const rows = rangeReport.sales.map(s => [
      s.id,
      new Date(s.createdAt).toLocaleString(),
      s.total,
      s.paymentMethod,
      s.cashier?.name || "N/A"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
  };

  const stats = [
    {
      title: "Today's Sales",
      value: report.today?.totalSales || 0,
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Today's Revenue",
      value: `GHS ${(report.today?.revenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Today's Profit",
      value: `GHS ${(report.today?.profit || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "All-Time Revenue",
      value: `GHS ${(report.allTime?.revenue || 0).toFixed(2)}`,
      icon: BarChart3,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-pos-dark">Reports</h1>
        <p className="text-gray-500 mt-1">View your business analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.textColor}`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              </div>
              <p className="text-2xl font-bold text-pos-dark">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Date Range Report */}
      <div className="card">
        <h2 className="text-lg font-bold text-pos-dark mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Date Range Report
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRangeReport}
              className="btn-primary h-[46px] px-6"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {report.topProducts && report.topProducts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-pos-dark mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Units Sold</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-primary-600">{product.quantity}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-pos-success">
                      GHS {product.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {report.lowStock && report.lowStock.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-pos-dark mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Low Stock Alert
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.lowStock.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${product.stock <= 0 ? "text-red-500" : "text-amber-500"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {product.stock <= 0 ? (
                        <span className="inline-flex px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          Low Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Range Report Results */}
      {showRangeReport && rangeReport && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-pos-dark">
              Report: {dateRange.start} to {dateRange.end}
            </h2>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-pos-dark">{rangeReport.summary?.totalSales || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-pos-success">GHS {(rangeReport.summary?.revenue || 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500">By Payment</p>
              <div className="text-sm mt-1">
                {Object.entries(rangeReport.summary?.byPaymentMethod || {}).map(([method, data]) => (
                  <p key={method} className="text-gray-600">
                    {method}: <span className="font-semibold">{data.count}</span> (GHS {data.amount.toFixed(2)})
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cashier</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {rangeReport.sales?.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">#{sale.id}</td>
                    <td className="py-3 px-4 font-bold text-pos-success">GHS {sale.total?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sale.paymentMethod === "Cash" ? "bg-green-100 text-green-700" :
                        sale.paymentMethod === "Mobile Money" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{sale.cashier?.name || "N/A"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
