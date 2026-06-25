import React, { useState } from "react";

export default function WhatsAppSupport() {
  const [isOpen, setIsOpen] = useState(false);

  const supportNumber = "+233599775362";
  const supportName = "WAG POS Support";

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
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: isOpen ? "#ef4444" : "#22c55e",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            width: "300px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            overflow: "hidden",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              padding: "16px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                📱
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                  {supportName}
                </h3>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                  🟢 Typically replies in minutes
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "16px", background: "#f8fafc" }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                Hello! 👋 Welcome to <strong>WAG POS</strong>. How can we help you today?
              </p>
            </div>

            <div style={{ marginBottom: "12px" }}>
              {[
                "Account setup & login issues",
                "Payment & MoMo problems",
                "Product & inventory help",
                "Subscription & billing",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#6b7280",
                    padding: "4px 0",
                  }}
                >
                  <span style={{ color: "#22c55e" }}>✓</span>
                  {item}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                onClick={handleChatClick}
                style={{
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#16a34a")}
                onMouseLeave={(e) => (e.target.style.background = "#22c55e")}
              >
                💬 Chat on WhatsApp
              </button>
              <a
                href={`tel:${supportNumber}`}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#2563eb")}
                onMouseLeave={(e) => (e.target.style.background = "#3b82f6")}
              >
                📞 Call Us
              </a>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              Powered by WAG POS • Ghana
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
