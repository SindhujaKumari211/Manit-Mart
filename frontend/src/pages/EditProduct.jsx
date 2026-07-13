import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Button from "../components/ui/Button";
import { Label, Input, TextArea, Select } from "../components/ui/Field";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    condition: "Used",
    pricingType: "FIXED",
    department: "",
    hostel: "",
    image: "",
    phone: "",
    address: "",
  });

  const subOptions = categories.find((c) => c.value === form.category)?.subcategories || [];

  // Protect Route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Load Existing Product + seller contact info + category taxonomy
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, profileRes, categoriesRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get("/auth/profile"),
          API.get("/products/categories"),
        ]);
        const product = productRes.data;
        setCategories(categoriesRes.data?.categories || []);
        setForm({
          name: product.name || "",
          description: product.description || "",
          price: product.price ?? "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          condition: product.condition || "Used",
          pricingType: product.pricingType || "FIXED",
          department: product.department || "",
          hostel: product.hostel || "",
          image: product.image || "",
          phone: profileRes.data.phone || "",
          address: profileRes.data.address || "",
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.put("/auth/profile", { phone: form.phone, address: form.address });
      await API.put(`/products/${id}`, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        subcategory: form.subcategory || "",
        condition: form.condition,
        pricingType: form.pricingType,
        department: form.department,
        hostel: form.hostel,
        image: form.image,
      });
      navigate("/");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-900 font-medium transition mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
          <p className="text-sm text-slate-500 mt-1">Update your listing details</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input type="text" name="name" value={form.name} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <TextArea name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input type="number" name="price" value={form.price} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  name="category"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value, subcategory: "" }))}
                >
                  <option value="" disabled>Select</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                  {/* Preserve a legacy category that's no longer in the taxonomy */}
                  {form.category && !categories.some((c) => c.value === form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                </Select>
              </div>
            </div>

            {subOptions.length > 0 && (
              <div>
                <Label htmlFor="subcategory">Subcategory <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Select name="subcategory" value={form.subcategory} onChange={handleChange}>
                  <option value="">None</option>
                  {subOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="condition">Condition</Label>
              <div className="grid grid-cols-2 gap-3">
                {["New", "Used"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, condition: value }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                      form.condition === value
                        ? "bg-brand-700 border-brand-700 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="pricingType">Pricing</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "FIXED", label: "Fixed Price" },
                  { value: "NEGOTIABLE", label: "Negotiable" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, pricingType: opt.value }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                      form.pricingType === opt.value
                        ? "bg-brand-700 border-brand-700 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input type="text" name="department" value={form.department} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="hostel">Hostel</Label>
                <Input type="text" name="hostel" value={form.hostel} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input type="text" name="image" value={form.image} onChange={handleChange} />
              {form.image && (
                <img src={form.image} alt="Preview" className="mt-3 w-full h-40 object-cover rounded-xl border border-slate-200" />
              )}
            </div>

            {/* Contact Info separator */}
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-brand-800 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-100">Your Contact Info</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <p className="text-xs text-slate-500 text-center mb-4">
                Buyers see this on the product page so they can reach you directly.
              </p>

              <div className="space-y-3">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Room / Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      id="address"
                      type="text"
                      name="address"
                      value={form.address}
                      placeholder="e.g. H4 Room 210, near common room"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;