import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingBag,
  Package, Users, AlertTriangle, Receipt, ArrowUpRight,
  ArrowDownRight, Activity, Calendar, Clock
} from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { tenant } = useAuth();
  const { execute, loading } = useApi();
  const [data, setData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const fetchDashboard = async () => {
    const result = await execute(() => API.get("/reports/dashboard"), { showError: true });
    if (result.success) setData(result.data);
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return <LoadingSpinner fullScreen />;
  if (!data) return <div className="p-6 text-center text-gray-500">Failed to load dashboard</div>;

  const {
    todaySales, todaySalesCount, totalSales, totalRevenue,
    weekRevenue, monthRevenue, totalProducts, totalUsers,
    lowStockCount, revenueTrend, salesTrend,
    salesByDay, salesByPayment, topProducts, hourlySales,
    recentSales, lowStock
  } = data;

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: entry.color }} />
            {entry.name}: <span className="font-semibold">GHS {entry.value?.toFixed?.(2) ?? entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Activity size={14} className="text-green-500" />
            Welcome back, {tenant?.name} • Live updates
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === p.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Sales"
          value={`GHS ${todaySales.toFixed(2)}`}
          subtitle={`${todaySalesCount} transactions`}
          icon={DollarSign}
          trend={revenueTrend}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <KPICard
          title="This Week"
          value={`GHS ${weekRevenue.toFixed(2)}`}
          subtitle={`${totalSales} total sales`}
          icon={ShoppingBag}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <KPICard
          title="Products"
          value={totalProducts}
          subtitle={`${lowStockCount} low stock`}
          icon={Package}
          color="bg-gradient-to-br from-violet-500 to-violet-600"
        />
        <KPICard
          title="Staff"
          value={totalUsers}
          subtitle="Active members"
          icon={Users}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts Row 1: Revenue Trend + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Revenue Trend
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-gray-500">Sales</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesByDay}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `GHS${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorRevenue)" name="Revenue" />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Sales Count" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Receipt size={18} className="text-violet-500" />
            Payment Methods
          </h3>
          <p className="text-xs text-gray-400 mb-4">This month</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={salesByPayment}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {salesByPayment.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {salesByPayment.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-600">{p.name}</span>
                </div>
                <span className="font-semibold text-gray-900">GHS {p.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Hourly Sales + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Sales Today */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Today's Hourly Sales
          </h3>
          <p className="text-xs text-gray-400 mb-4">Sales activity by hour</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} interval={2} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Package size={18} className="text-emerald-500" />
            Top Products
          </h3>
          <p className="text-xs text-gray-400 mb-4">Best sellers this month</p>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (product.quantity / (topProducts[0]?.quantity || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{product.quantity}</p>
                  <p className="text-xs text-gray-400">sold</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-gray-400 py-8">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Sales + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Receipt size={18} className="text-blue-500" />
              Recent Sales
            </h3>
            <span className="text-xs text-gray-400">Click for details</span>
          </div>
          <div className="space-y-2">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Receipt size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.receiptNumber}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">GHS {sale.amount.toFixed(2)}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                    sale.paymentMethod === 'MTN_MOMO' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {sale.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-gray-400 py-8">No sales yet today</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Low Stock Alert
            </h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {lowStockCount} items
            </span>
          </div>
          <div className="space-y-2">
            {lowStock.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Package size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-red-500 font-medium">{product.stock} remaining</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
                  Restock
                </button>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-center text-gray-400 py-8">All stock levels healthy</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}