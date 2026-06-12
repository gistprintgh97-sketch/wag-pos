import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Search,
  Filter,
  Crown
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { execute, loading } = useApi();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const superAdminKey = localStorage.getItem("wag_super_admin_key") || "";

  const fetchData = async () => {
    const [statsRes, tenantsRes, paymentsRes] = await Promise.all([
      execute(() => API.get("/admin/stats", { headers: { "x-super-admin-key": superAdminKey } }), { showError: true }),
      execute(() => API.get("/admin/tenants", { headers: { "x-super-admin-key": superAdminKey } }), { showError: true }),
      execute(() => API.get("/admin/payments", { headers: { "x-super-admin-key": superAdminKey } }), { showError: true })
    ]);

    if (statsRes.success) setStats(statsRes.data);
    if (tenantsRes.success) setTenants(tenantsRes.data?.tenants || []);
    if (paymentsRes.success) setPayments(paymentsRes.data || []);
  };

  useEffect(() => {
    if (superAdminKey) fetchData();
  }, [superAdminKey]);

  const handleStatusChange = async (id, status) => {
    const result = await execute(
      () => API.put(`/admin/tenants/${id}/status`, { status }, {
        headers: { "x-super-admin-key": superAdminKey }
      }),
      { successMessage: `Tenant ${status.toLowerCase()}` }
    );
    if (result.success) fetchData();
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!superAdminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <Crown size={48} className="mx-auto mb-4 text-pos-blue" />
          <h1 className="text-2xl font-bold text-pos-dark mb-2">Super Admin</h1>
          <p className="text-gray-500 mb-4">Enter your super admin key to access the dashboard</p>
          <input
            type="password"
            placeholder="Super Admin Key"
            className="input-field mb-4"
            onChange={(e) => localStorage.setItem("wag_super_admin_key", e.target.value)}
          />
          <button onClick={() => window.location.reload()} className="btn-primary w-full">
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading && !stats) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-pos-dark text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-amber-400" />
            <h1 className="text-xl font-bold">WAG POS Super Admin</h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem("wag_super_admin_key"); window.location.reload(); }}
            className="text-sm text-gray-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Tenants", value: stats.totalTenants, icon: Building2, color: "blue" },
              { label: "Active", value: stats.activeTenants, icon: TrendingUp, color: "green" },
              { label: "In Trial", value: stats.trialTenants, icon: Users, color: "amber" },
              { label: "Total Revenue", value: `GHS ${stats.totalRevenue?.toFixed(2) || 0}`, icon: DollarSign, color: "purple" }
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className={`text-${stat.color}-600`} />
                    </div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-pos-dark">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tenants Table */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-pos-dark">All Shops</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shops..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Shop</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Users</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Products</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Sales</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div>
                        <p className="font-semibold text-sm">{tenant.name}</p>
                        <p className="text-xs text-gray-400">@{tenant.slug}</p>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                        {tenant.subscription?.plan || "STARTER"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        tenant.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                        tenant.status === "TRIAL" ? "bg-amber-100 text-amber-700" :
                        tenant.status === "SUSPENDED" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm">{tenant._count?.users || 0}</td>
                    <td className="py-2 px-3 text-sm">{tenant._count?.products || 0}</td>
                    <td className="py-2 px-3 text-sm">{tenant._count?.sales || 0}</td>
                    <td className="py-2 px-3 text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {tenant.status !== "ACTIVE" && (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "ACTIVE")}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200"
                          >
                            Activate
                          </button>
                        )}
                        {tenant.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleStatusChange(tenant.id, "SUSPENDED")}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-pos-dark mb-4">Recent Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Shop</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(payment => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-medium">{payment.tenant?.name}</td>
                      <td className="py-2 px-3 text-sm font-semibold">GHS {payment.amount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm">{payment.method}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                          payment.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
