import React, { useState } from "react";
import { MessageCircle, X, Phone, Clock, CheckCircle } from "lucide-react";

export default function WhatsAppSupport() {
  const [isOpen, setIsOpen] = useState(false);

  const supportNumber = "+233599775362"; // Your WhatsApp number
  const supportName = "WAG POS Support";
  const supportStatus = "Typically replies in minutes";

  const handleChatClick = () => {
    const message = encodeURIComponent(
      "Hi WAG POS Support! I need help with my account."
    );
    window.open(
      `https://wa.me/${supportNumber.replace(/\+/g, "")}?text=${message}`,
      "_blank"
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{supportName}</h3>
                <div className="flex items-center gap-1 text-green-100 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{supportStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 bg-gray-50">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Hello! 👋 Welcome to <strong>WAG POS</strong>. How can we help you today?
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Account setup & login issues</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Payment & MoMo problems</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Product & inventory help</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Subscription & billing</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleChatClick}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </button>
              <a
                href={`tel:${supportNumber}`}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Phone className="w-4 h-4" />
                Call Us
              </a>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 pt-2 border-t">
              Powered by WAG POS • Ghana
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
