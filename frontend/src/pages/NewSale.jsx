import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import { usePersistentCart } from "../hooks/usePersistentCart";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Search,
  X,
  Receipt
} from "lucide-react";
import toast from "react-hot-toast";

export default function NewSale() {
  const { user, tenant } = useAuth();
  const { execute, loading } = useApi();
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount
  } = usePersistentCart();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [momoPhone, setMomoPhone] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const fetchProducts = async () => {
    const result = await execute(() => API.get("/products"), { showError: true });
    if (result.success) {
      setProducts(result.data.filter(p => !p.deleted && p.stock > 0));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paymentMethod === "MTN_MOMO" && !momoPhone) {
      toast.error("Please enter MoMo phone number");
      return;
    }

    const items = cart.map(item => ({
      id: item.id,
      quantity: item.quantity
    }));

    const result = await execute(
      () => API.post("/sales", {
        items,
        paymentMethod,
        momoPhone: paymentMethod === "MTN_MOMO" ? momoPhone : undefined
      }),
      { showError: true }
    );

    if (result.success) {
      setLastSale(result.data.sale);
      setShowReceipt(true);
      clearCart();
      fetchProducts(); // Refresh stock
      toast.success("Sale completed!");
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Products Panel */}
      <div className="lg:col-span-2 card flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pos-dark">Products</h2>
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search size={48} className="mx-auto mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    product.stock <= 0
                      ? "border-gray-200 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-pos-blue hover:bg-blue-50"
                  }`}
                >
                  <p className="font-semibold text-pos-dark text-sm">{product.name}</p>
                  <p className="text-pos-blue font-bold mt-1">GHS {product.price.toFixed(2)}</p>
                  <p className={`text-xs mt-1 ${product.stock <= 5 ? "text-red-500" : "text-gray-500"}`}>
                    Stock: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="card flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pos-dark flex items-center gap-2">
            <ShoppingCart size={20} />
            Cart ({cartCount})
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p>Cart is empty</p>
              <p className="text-sm">Click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-pos-dark truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">GHS {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod("Cash")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                  paymentMethod === "Cash" ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <Banknote size={16} className="text-green-600" />
                <span className="text-sm font-medium">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod("MTN_MOMO")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                  paymentMethod === "MTN_MOMO" ? "border-yellow-500 bg-yellow-50" : "border-gray-200"
                }`}
              >
                <Smartphone size={16} className="text-yellow-600" />
                <span className="text-sm font-medium">MoMo</span>
              </button>
              <button
                onClick={() => setPaymentMethod("Card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                  paymentMethod === "Card" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-sm font-medium">Card</span>
              </button>
            </div>
          </div>

          {/* MoMo Phone Input */}
          {paymentMethod === "MTN_MOMO" && (
            <input
              type="tel"
              value={momoPhone}
              onChange={(e) => setMomoPhone(e.target.value)}
              placeholder="MoMo phone number"
              className="input-field w-full"
            />
          )}

          {/* Total & Checkout */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total</span>
            <span className="text-2xl font-bold text-pos-dark">GHS {cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Processing...
              </span>
            ) : (
              "Complete Sale"
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} className="text-pos-blue" />
                Receipt
              </h2>
              <div className="flex gap-2">
                <button onClick={printReceipt} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Receipt size={18} />
                </button>
                <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h3 className="font-bold text-xl">{tenant?.name}</h3>
              <p className="text-sm text-gray-500">Receipt #{lastSale.id?.toString().padStart(6, '0')}</p>
            </div>

            <div className="space-y-2">
              {lastSale.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product?.name}</span>
                  <span>GHS {(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>GHS {lastSale.total?.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Paid via {lastSale.paymentMethod}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
