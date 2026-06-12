import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useReactToPrint } from "react-to-print";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Printer,
  X,
  CheckCircle,
  History,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Sales() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const { execute, loading } = useApi();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [momoPhone, setMomoPhone] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [momoProcessing, setMomoProcessing] = useState(false);
  const receiptRef = useRef();

  const momoEnabled = tenant?.settings?.enableMomo || false;

  const fetchProducts = async () => {
    const result = await execute(() => API.get("/products"), { showError: false });
    if (result.success) setProducts(result.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${receipt?.id || Date.now()}`
  });
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Only ${product.stock} units available`);
        return;
      }
      setCart(cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.stock
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map((item) => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.maxStock) {
          toast.error(`Only ${item.maxStock} units available`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (window.confirm("Clear all items from cart?")) setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const checkout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (paymentMethod === "Mobile Money" && !momoPhone) {
      toast.error("Enter customer phone number for MoMo payment");
      return;
    }

    setCheckoutLoading(true);
    const items = cart.map(({ productId, quantity, price }) => ({ productId, quantity, price }));

    const result = await execute(
      () => API.post("/sales", { items, paymentMethod, momoPhone }),
      { successMessage: "Sale completed!" }
    );

    setCheckoutLoading(false);

    if (result.success) {
      const sale = result.data.sale;

      // If MoMo, initiate payment request
      if (paymentMethod === "Mobile Money" && momoPhone) {
        setMomoProcessing(true);
        try {
          await API.post("/momo/pay", {
            phone: momoPhone,
            amount: total,
            saleId: sale.id
          });
          toast.success("MoMo payment request sent to customer!");
        } catch (e) {
          toast.error("MoMo request failed, but sale was recorded");
        }
        setMomoProcessing(false);
      }

      const newReceipt = {
        id: sale.id,
        items: cart,
        total,
        paymentMethod,
        cashier: user?.name,
        date: new Date().toLocaleString(),
        shopName: tenant?.name || "WAG POS"
      };
      setReceipt(newReceipt);
      setShowReceipt(true);
      setCart([]);
      setMomoPhone("");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleShowHistory = async () => {
    const result = await execute(() => API.get("/sales?limit=20"), { showError: true });
    if (result.success) {
      setSalesHistory(result.data.sales || []);
      setShowSalesHistory(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pos-dark">New Sale</h1>
          <p className="text-gray-500 mt-1">Create a new transaction</p>
        </div>
        <button
          onClick={handleShowHistory}
          className="bg-pos-dark hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit"
        >
          <History size={18} />
          Sales History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
            <BarcodeScanner
              onScan={(barcode) => {
                const product = products.find((p) => p.barcode === barcode);
                if (product) {
                  addToCart(product);
                } else {
                  alert("Product not found!");
                }
              }}
              placeholder="Scan product barcode..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`card p-4 text-center transition-all hover:shadow-md ${
                  product.stock <= 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
                }`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 text-gray-500 font-medium text-sm">
                  {product.name.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-sm text-pos-dark mb-1">{product.name}</h3>
                <p className="text-lg font-bold text-primary-600">GHS {product.price.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${product.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                  Stock: {product.stock}
                </p>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={20} className="text-pos-dark" />
              <h2 className="text-xl font-bold text-pos-dark">Cart</h2>
              <span className="ml-auto bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {cart.length} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm mt-1">Click products to add them</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-pos-dark truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">GHS {item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => removeFromCart(item.productId)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 ml-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">GHS {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-pos-dark">
                    <span>Total</span>
                    <span>GHS {total.toFixed(2)}</span>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "Cash", icon: Banknote, label: "Cash" },
                        { value: "Mobile Money", icon: Smartphone, label: "MoMo", disabled: !momoEnabled },
                        { value: "Card", icon: CreditCard, label: "Card" }
                      ].map(({ value, icon: Icon, label, disabled }) => (
                        <button
                          key={value}
                          onClick={() => !disabled && setPaymentMethod(value)}
                          disabled={disabled}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                            paymentMethod === value
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : disabled
                                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                    {!momoEnabled && (
                      <p className="text-xs text-gray-400 mt-1">
                        MoMo not enabled. <button onClick={() => navigate("/momo")} className="text-pos-blue hover:underline">Configure</button>
                      </p>
                    )}
                  </div>

                  {/* MoMo Phone Input */}
                  {paymentMethod === "Mobile Money" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                      <input
                        type="tel"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="e.g. 0241234567"
                        className="input-field"
                      />
                    </div>
                  )}

                  <button
                    onClick={checkout}
                    disabled={checkoutLoading || momoProcessing}
                    className="btn-success w-full py-3.5 text-base flex items-center justify-center gap-2"
                  >
                    {checkoutLoading || momoProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Complete Sale — GHS {total.toFixed(2)}
                      </>
                    )}
                  </button>
                  <button onClick={clearCart} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium text-sm transition-colors">
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Receipt" maxWidth="sm">
        <div className="space-y-4">
          <div ref={receiptRef} className="bg-white p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{receipt?.shopName}</h2>
              <p className="text-xs text-gray-400 mt-1">{receipt?.date}</p>
            </div>
            <div className="border-t border-b border-dashed border-gray-300 py-3 space-y-1 text-sm">
              <p><span className="text-gray-500">Cashier:</span> {receipt?.cashier}</p>
              <p><span className="text-gray-500">Payment:</span> {receipt?.paymentMethod}</p>
              <p><span className="text-gray-500">Receipt #:</span> {receipt?.id}</p>
            </div>
            <div className="py-3 space-y-2">
              {receipt?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x GHS {item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">GHS {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>GHS {receipt?.total?.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
          <div className="flex gap-3 no-print">
            <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Printer size={18} />
              Print Receipt
            </button>
            <button onClick={() => setShowReceipt(false)} className="btn-danger flex items-center justify-center gap-2 px-6">
              <X size={18} />
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Sales History Modal */}
      <Modal isOpen={showSalesHistory} onClose={() => setShowSalesHistory(false)} title="Sales History" maxWidth="2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cashier</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">#{sale.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{sale.items?.length || 0} items</td>
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
                  <td className="py-3 px-4 text-sm text-gray-600">{new Date(sale.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
