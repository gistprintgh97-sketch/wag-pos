import { useState, useRef, useEffect } from "react";
import { Scan, X } from "lucide-react";

export default function BarcodeScanner({ onScan, placeholder = "Scan or type barcode..." }) {
  const [isScanning, setIsScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const handleInput = (e) => {
    const value = e.target.value;
    setBarcode(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 8) {
        onScan(value.trim());
        setBarcode("");
        if (inputRef.current) inputRef.current.focus();
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && barcode.trim()) {
      e.preventDefault();
      onScan(barcode.trim());
      setBarcode("");
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`p-2.5 rounded-xl transition-all ${
            isScanning 
              ? "bg-pos-blue text-white shadow-lg" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title={isScanning ? "Stop scanning" : "Start barcode scanning"}
        >
          <Scan size={20} />
        </button>
        
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pos-blue/20 focus:border-pos-blue transition-all"
            autoComplete="off"
          />
          {barcode && (
            <button
              onClick={() => { setBarcode(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      
      {isScanning && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-medium">📱 Scanner Mode Active</p>
          <p className="text-xs mt-1">Point your barcode scanner at the input field and scan. The product will be added automatically.</p>
        </div>
      )}
    </div>
  );
}