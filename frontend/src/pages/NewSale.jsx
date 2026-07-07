import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Receipt } from "lucide-react";
import toast from "react-hot-toast";

export default function NewSale() {
  const { tenant } = useAuth();
  const { execute, loading } = useApi();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    API.get("/products")
      .then(res => setProducts(res.data?.filter(p => p.stock > 0) || []))
      .catch(err => console.error("Products error:", err));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    
    const items = cart.map(item => ({ id: item.id, quantity: item.quantity }));
    
    try {
      const res = await API.post("/sales", { items, paymentMethod: "Cash" });
      setLastSale(res.data?.sale);
      setShowReceipt(true);
      setCart([]);
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
      }));
      toast.success("Sale completed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Sale</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field flex-1"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 rounded-xl border-2 border-gray-200 text-left hover:border-pos-blue hover:bg-blue-50 transition-all"
              >
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-pos-blue font-bold">GHS {product.price?.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Stock: {product.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            Cart ({cartCount})
          </h2>
          
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">GHS {item.price?.toFixed(2)}</p>
                  </div>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total</span>
                  <span>GHS {cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Complete Sale"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} className="text-pos-blue" />
                Receipt
              </h3>
              <button onClick={() => setShowReceipt(false)}><X size={18} /></button>
            </div>
            <div className="text-center border-b border-dashed pb-4 mb-4">
              <h4 className="font-bold text-xl">{tenant?.name}</h4>
              <p className="text-sm text-gray-500">#{lastSale.id}</p>
            </div>
            {lastSale.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{item.quantity}x {item.product?.name || item.name}</span>
                <span>GHS {(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>GHS {lastSale.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}