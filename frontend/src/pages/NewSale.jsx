import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Receipt, Printer, CheckCircle } from "lucide-react";
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-pos-dark flex items-center gap-2">
                <Receipt size={20} className="text-pos-blue" />
                Receipt
              </h2>
              <button 
                onClick={() => setShowReceipt(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Receipt Content */}
            <div className="p-6 space-y-4">
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h3 className="font-bold text-xl text-pos-dark">{tenant?.name}</h3>
                <p className="text-sm text-gray-500">Receipt #{lastSale.id?.toString().padStart(6, '0')}</p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              
              <div className="space-y-2">
                {lastSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.product?.name || item.name}</span>
                    <span className="font-medium">GHS {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-gray-300 pt-4">
                <div className="flex justify-between text-xl font-bold text-pos-dark">
                  <span>Total</span>
                  <span className="text-pos-blue">GHS {lastSale.total?.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 text-center">Paid via {lastSale.paymentMethod}</p>
              </div>
            </div>

            {/* Action Buttons - Bottom */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print
                </button>
                
                <button
                  onClick={() => {
                    const text = `*Receipt from ${tenant?.name}*%0A%0A${lastSale.items?.map(item => `${item.quantity}x ${item.product?.name || item.name} - GHS ${(item.quantity * item.price).toFixed(2)}`).join('%0A')}%0A%0A*Total: GHS ${lastSale.total?.toFixed(2)}*%0A%0AThank you for shopping!`;
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 border border-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-600 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share
                </button>
                
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-pos-blue rounded-lg text-sm font-medium text-white hover:bg-blue-600 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
