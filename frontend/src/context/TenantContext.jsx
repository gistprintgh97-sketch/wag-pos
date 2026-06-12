import { createContext, useContext, useState, useEffect } from "react";

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(() => {
    const saved = localStorage.getItem("wag_tenant");
    return saved ? JSON.parse(saved) : null;
  });

  const [subscription, setSubscription] = useState(() => {
    const saved = localStorage.getItem("wag_subscription");
    return saved ? JSON.parse(saved) : null;
  });

  const saveTenant = (tenantData) => {
    if (tenantData) {
      localStorage.setItem("wag_tenant", JSON.stringify(tenantData));
      setTenant(tenantData);
    }
  };

  const saveSubscription = (subData) => {
    if (subData) {
      localStorage.setItem("wag_subscription", JSON.stringify(subData));
      setSubscription(subData);
    }
  };

  const clearTenant = () => {
    localStorage.removeItem("wag_tenant");
    localStorage.removeItem("wag_subscription");
    setTenant(null);
    setSubscription(null);
  };

  const isTrialExpired = () => {
    if (!tenant?.trialEndsAt) return false;
    return new Date() > new Date(tenant.trialEndsAt);
  };

  const isSubscriptionActive = () => {
    if (tenant?.status === "TRIAL") return !isTrialExpired();
    return ["ACTIVE", "TRIAL"].includes(tenant?.status);
  };

  return (
    <TenantContext.Provider value={{
      tenant,
      subscription,
      saveTenant,
      saveSubscription,
      clearTenant,
      isTrialExpired,
      isSubscriptionActive,
      slug: tenant?.slug || ""
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within TenantProvider");
  return context;
}
