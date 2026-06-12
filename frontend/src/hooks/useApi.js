import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export function useApi() {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { showError = true, successMessage, onSuccess } = options;
    setLoading(true);

    try {
      const response = await apiCall();
      if (successMessage) toast.success(successMessage);
      if (onSuccess) onSuccess(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      if (showError) toast.error(message);
      return { success: false, message, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading };
}
