import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PaystackCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { execute } = useApi();
  const [status, setStatus] = useState("verifying"); // verifying, success, failed
  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");

  useEffect(() => {
    const verify = async () => {
      const ref = reference || trxref;
      if (!ref) {
        setStatus("failed");
        return;
      }

      const result = await execute(
        () => API.post("/billing/verify", { reference: ref }),
        { showError: true }
      );

      if (result.success) {
        setStatus("success");
        toast.success("Payment successful! Your subscription is now active.");
        setTimeout(() => navigate("/billing"), 3000);
      } else {
        setStatus("failed");
      }
    };

    verify();
  }, [reference, trxref]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card text-center max-w-md w-full">
        {status === "verifying" && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-pos-blue" />
            <h2 className="text-xl font-bold text-pos-dark">Verifying Payment...</h2>
            <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-pos-dark">Payment Successful!</h2>
            <p className="text-gray-500 mt-2">Your subscription has been activated.</p>
            <p className="text-sm text-gray-400 mt-1">Redirecting to billing page...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-pos-dark">Payment Failed</h2>
            <p className="text-gray-500 mt-2">We couldn&apos;t verify your payment. Please try again.</p>
            <button
              onClick={() => navigate("/billing")}
              className="btn-primary mt-4"
            >
              Back to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
