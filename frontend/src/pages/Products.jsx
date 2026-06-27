import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Tag
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import BulkUploadModal from '../components/BulkUploadModal';

export default function Products() {
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const fetchProducts = async () => {
    // your existing fetch logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product inventory</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => {/* existing add product */}}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* ... existing products table ... */}

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const { execute, loading } = useApi();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockSupplier, setRestockSupplier] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    costPrice: "",
    stock: "",
    barcode: "",
    category: "General"
  });

  const fetchProducts = async () => {
    const result = await execute(() => API.get("/products"), { showError: false });
    if (result.success) setProducts(result.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast.error("Name, price, and stock are required");
      return;
    }

    const result = await execute(
      () => API.post("/products", {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.costPrice || 0),
        stock: parseInt(newProduct.stock),
        barcode: newProduct.barcode?.trim() || undefined,
        category: newProduct.category?.trim() || "General"
      }),
      { successMessage: "Product added successfully!" }
    );

    if (result.success) {
      setNewProduct({ name: "", price: "", costPrice: "", stock: "", barcode: "", category: "General" });
      setShowAddModal(false);
      fetchProducts();
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;

    const result = await execute(
      () => API.put(`/products/${editingProduct.id}`, {
        name: editingProduct.name.trim(),
        price: parseFloat(editingProduct.price),
        costPrice: parseFloat(editingProduct.costPrice || 0),
        stock: parseInt(editingProduct.stock),
        barcode: editingProduct.barcode?.trim() || null,
        category: editingProduct.category?.trim() || "General"
      }),
      { successMessage: "Product updated successfully!" }
    );

    if (result.success) {
      setShowEditModal(false);
      setEditingProduct(null);
      fetchProducts();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const result = await execute(
      () => API.delete(`/products/${id}`),
      { successMessage: "Product deleted successfully!" }
    );

    if (result.success) fetchProducts();
  };

  const handleRestock = async () => {
    if (!restockingProduct || !restockQty || parseInt(restockQty) <= 0) {
      toast.error("Valid quantity required");
      return;
    }

    const result = await execute(
      () => API.put(`/products/restock/${restockingProduct.id}`, {
        quantity: parseInt(restockQty),
        supplier: restockSupplier.trim() || undefined
      }),
      { successMessage: "Product restocked successfully!" }
    );

    if (result.success) {
      setShowRestockModal(false);
      setRestockingProduct(null);
      setRestockQty("");
      setRestockSupplier("");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pos-dark dark:text-white">Products</h1>
          <p className="text-gray-500 mt-1 dark:text-slate-400">Manage your product inventory</p>
        </div>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card flex items-center gap-3 dark:bg-slate-800 dark:border-slate-700">
      <Search size={20} className="text-gray-400 dark:text-slate-500" />
      <input
      type="text"
      placeholder="Search products..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 outline-none text-gray-700 placeholder-gray-400 dark:text-slate-100 dark:placeholder-slate-500 bg-transparent"
    />
  </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= 10;
                const isOutOfStock = product.stock <= 0;

                return (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold text-sm">
                          {product.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-pos-dark">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        <Tag size={10} />
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary-600">
                      GHS {product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      GHS {product.costPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-500" : "text-green-600"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <AlertTriangle size={12} />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          <AlertTriangle size={12} />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {user?.role === "ADMIN" && (
                          <>
                            <button
                              onClick={() => {
                                setRestockingProduct(product);
                                setShowRestockModal(true);
                              }}
                              className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                              title="Restock"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditModal(true);
                              }}
                              className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Product">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product Name</label>
            <input className="input-field dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100" />
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Coca Cola"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (GHS)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (GHS)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProduct.costPrice}
                onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="input-field"
                placeholder="General"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
            <input
              type="text"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
              className="input-field"
              placeholder="Scan or enter barcode"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} className="btn-primary flex-1">
              Save Product
            </button>
            <button onClick={() => setShowAddModal(false)} className="btn-danger flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingProduct(null); }} title="Edit Product">
        {editingProduct && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.costPrice}
                  onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={editingProduct.barcode || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleUpdate} className="btn-primary flex-1">
                Save Changes
              </button>
              <button onClick={() => { setShowEditModal(false); setEditingProduct(null); }} className="btn-danger flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={showRestockModal} onClose={() => { setShowRestockModal(false); setRestockingProduct(null); }} title={`Restock: ${restockingProduct?.name}`}>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500">Current Stock</p>
            <p className="text-2xl font-bold text-pos-dark">{restockingProduct?.stock}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
            <input
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="input-field"
              placeholder="Enter quantity"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Optional)</label>
            <input
              type="text"
              value={restockSupplier}
              onChange={(e) => setRestockSupplier(e.target.value)}
              className="input-field"
              placeholder="e.g. Supplier Name"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleRestock} className="btn-primary flex-1">
              Restock
            </button>
            <button onClick={() => { setShowRestockModal(false); setRestockingProduct(null); }} className="btn-danger flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
