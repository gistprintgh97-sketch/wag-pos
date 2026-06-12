import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  UserCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Crown,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { execute, loading } = useApi();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", pin: "", role: "CASHIER" });

  const fetchUsers = async () => {
    const result = await execute(() => API.get("/users"), { showError: false });
    if (result.success) setUsers(result.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!newUser.name || !newUser.pin) {
      toast.error("Name and PIN are required");
      return;
    }
    if (newUser.pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    const result = await execute(
      () => API.post("/users", newUser),
      { successMessage: "User added successfully!" }
    );

    if (result.success) {
      setNewUser({ name: "", pin: "", role: "CASHIER" });
      setShowAddModal(false);
      fetchUsers();
    }
  };

  const handleToggleActive = async (id, isActive) => {
    const result = await execute(
      () => API.put(`/users/${id}`, { isActive: !isActive }),
      { successMessage: `User ${isActive ? "deactivated" : "activated"}!` }
    );
    if (result.success) fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const result = await execute(
      () => API.delete(`/users/${id}`),
      { successMessage: "User deleted successfully!" }
    );

    if (result.success) fetchUsers();
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role) => {
    if (role === "ADMIN") return <Crown size={12} />;
    if (role === "MANAGER") return <Briefcase size={12} />;
    return <UserCircle size={12} />;
  };

  const getRoleColor = (role) => {
    if (role === "ADMIN") return "bg-amber-100 text-amber-700";
    if (role === "MANAGER") return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pos-dark">Users</h1>
          <p className="text-gray-500 mt-1">Manage system users and cashiers</p>
        </div>
        {currentUser?.role === "ADMIN" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <Plus size={18} />
            Add User
          </button>
        )}
      </div>

      <div className="card flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        u.role === "ADMIN" ? "bg-amber-500" : u.role === "MANAGER" ? "bg-blue-500" : "bg-primary-500"
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-pos-dark">{u.name}</p>
                        <p className="text-xs text-gray-400">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                      {getRoleIcon(u.role)}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.role === "ADMIN" && u.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            className={u.isActive ? "text-green-500" : "text-gray-300"}
                            title={u.isActive ? "Deactivate" : "Activate"}
                          >
                            {u.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="input-field"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN (min 4 digits)</label>
            <input
              type="password"
              value={newUser.pin}
              onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, "") })}
              className="input-field"
              placeholder="Enter PIN"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="input-field"
            >
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} className="btn-primary flex-1">
              Save User
            </button>
            <button onClick={() => setShowAddModal(false)} className="btn-danger flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
