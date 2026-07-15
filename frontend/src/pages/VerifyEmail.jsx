import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../services/api";
import Button from "../components/ui/Button";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    if (called.current) return;
    called.current = true;

    const verify = async () => {
      try {
        const { data } = await API.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Email verification failed.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-md animate-fade-in bg-white p-8 rounded-2xl shadow-soft border border-slate-100 text-center">
        {status === "loading" && (
          <>
            <svg className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Verifying Email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/">
              <Button>Go to Homepage</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
             <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/profile">
              <Button>Go to Profile to Resend</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
