import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { Label, Input, FieldError } from "../components/ui/Field";
import { getCollege } from "../lib/college";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const college = getCollege();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    hostel: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 6) next.password = "Must be at least 6 characters";
    if (!form.department.trim()) next.department = "Department is required";
    if (!form.hostel.trim()) next.hostel = "Hostel is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", form);
      login(data.token, data._id);
      navigate("/");
    } catch (error) {
      setErrors({ form: error.response?.data?.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl flex items-center justify-center shadow-brand mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Join the {college.name} campus marketplace</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100"
          noValidate
        >
          {errors.form && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                name="email"
                placeholder={`you@${college.emailDomain}`}
                value={form.email}
                onChange={handleChange}
                error={errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <FieldError>{errors.password}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  type="text"
                  name="department"
                  placeholder="CSE, ECE..."
                  value={form.department}
                  onChange={handleChange}
                  error={errors.department}
                />
                <FieldError>{errors.department}</FieldError>
              </div>
              <div>
                <Label htmlFor="hostel">Hostel</Label>
                <Input
                  type="text"
                  name="hostel"
                  placeholder="H1, H2..."
                  value={form.hostel}
                  onChange={handleChange}
                  error={errors.hostel}
                />
                <FieldError>{errors.hostel}</FieldError>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" hint="(optional)">Phone Number</Label>
              <Input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="address" hint="(optional)">Room / Address</Label>
              <Input
                type="text"
                name="address"
                placeholder="e.g. H4 Room 210"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-800 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
