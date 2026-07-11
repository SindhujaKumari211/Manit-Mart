import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../services/api";
import Button from "../components/ui/Button";
import { Label, Input, TextArea, Select } from "../components/ui/Field";

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [imageMode, setImageMode] = useState("gallery"); // "gallery" | "camera" | "url"
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // Pre-fill seller's existing phone & address
    API.get("/auth/profile").then(({ data }) => {
      setForm((prev) => ({
        ...prev,
        phone: data.phone || "",
        address: data.address || "",
      }));
    }).catch(() => {});
  }, [navigate]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    tags: "",
    condition: "Used",
    department: "",
    hostel: "",
    image: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Store the selected file for upload and show a local preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageMode !== "url" && !imageFile) {
      alert("Please select a product photo");
      return;
    }
    if (imageMode === "url" && !form.image) {
      alert("Please provide an image URL");
      return;
    }

    setLoading(true);

    try {
      // Save phone & address to seller's profile first
      await API.put("/auth/profile", {
        phone: form.phone,
        address: form.address,
      });

      let imageUrl = form.image;
      if (imageMode !== "url") {
        const formData = new FormData();
        formData.append("image", imageFile);
        const { data } = await API.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = `${API_ORIGIN}${data.url}`;
      }

      // Then create the product listing
      await API.post("/products", {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        brand: form.brand.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        condition: form.condition,
        department: form.department,
        hostel: form.hostel,
        image: imageUrl,
      });

      navigate("/");
    } catch (error) {
      console.log(error.response?.data);
      alert(error.response?.data?.message || "Failed to add product");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">List a Product</h2>
          <p className="text-sm text-slate-500 mt-1">Add an item to sell on the campus marketplace</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="e.g. Engineering Mathematics Textbook"
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <TextArea
                name="description"
                placeholder="Describe condition, edition, etc."
                rows={3}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  type="number"
                  name="price"
                  placeholder="250"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" onChange={handleChange} required defaultValue="">
                  <option value="" disabled>Select</option>
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Sports">Sports</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand">Brand <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. HP, Casio, Hero"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
                <Input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="e.g. gaming, i5, 8gb"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  type="text"
                  name="department"
                  placeholder="CSE, ECE..."
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hostel">Hostel</Label>
                <Input
                  type="text"
                  name="hostel"
                  placeholder="H1, H2..."
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Photo</label>

              {/* Mode Tabs */}
              <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => { setImageMode("gallery"); setImagePreview(""); setImageFile(null); setForm(p => ({...p, image: ""})); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition ${
                    imageMode === "gallery"
                      ? "bg-brand-900 text-white"
                      : "bg-white text-slate-500 hover:bg-brand-50 hover:text-brand-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gallery
                </button>
                <button
                  type="button"
                  onClick={() => { setImageMode("camera"); setImagePreview(""); setImageFile(null); setForm(p => ({...p, image: ""})); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-l border-r border-slate-200 transition ${
                    imageMode === "camera"
                      ? "bg-brand-900 text-white"
                      : "bg-white text-slate-500 hover:bg-brand-50 hover:text-brand-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => { setImageMode("url"); setImagePreview(""); setImageFile(null); setForm(p => ({...p, image: ""})); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition ${
                    imageMode === "url"
                      ? "bg-brand-900 text-white"
                      : "bg-white text-slate-500 hover:bg-brand-50 hover:text-brand-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  URL
                </button>
              </div>

              {/* Gallery Upload */}
              {imageMode === "gallery" && (
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition bg-slate-50 hover:bg-brand-50"
                >
                  <svg className="w-8 h-8 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-600">Tap to choose from gallery</p>
                  <p className="text-xs text-slate-400">JPG, PNG, WEBP supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Camera Capture */}
              {imageMode === "camera" && (
                <div
                  onClick={() => cameraInputRef.current.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition bg-slate-50 hover:bg-brand-50"
                >
                  <svg className="w-8 h-8 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-600">Tap to open camera</p>
                  <p className="text-xs text-slate-400">Takes a photo using your device camera</p>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* URL Input */}
              {imageMode === "url" && (
                <input
                  type="text"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
                  onChange={(e) => {
                    handleChange(e);
                    setImagePreview(e.target.value);
                  }}
                  required
                />
              )}

              {/* Preview */}
              {(imagePreview || (imageMode === "url" && form.image)) && (
                <div className="mt-3 relative">
                  <img
                    src={imagePreview || form.image}
                    alt="Preview"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(""); setImageFile(null); setForm(p => ({...p, image: ""})); }}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1 shadow hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                Buyers will see this on the product page so they can reach you directly.
              </p>

              <div className="space-y-3">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number <span className="text-slate-400 font-normal">(required for buyers to contact you)</span>
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
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Room / Address <span className="text-slate-400 font-normal">(where buyer can meet you)</span>
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
                      placeholder="e.g. H4 Room 210, near common room"
                      value={form.address}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-brand-600 transition"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            {loading ? "Adding..." : "List Product"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;