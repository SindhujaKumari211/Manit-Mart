import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Button from "../components/ui/Button";
import { Label, Input, FieldError } from "../components/ui/Field";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await API.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-md animate-fade-in bg-white p-8 rounded-2xl shadow-soft border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        {message && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              placeholder="you@college.ac.in"
            />
            <FieldError>{error}</FieldError>
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full mb-4">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          
          <p className="text-center text-sm text-slate-500">
            Remember your password?{" "}
            <Link to="/login" className="text-brand-800 font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
