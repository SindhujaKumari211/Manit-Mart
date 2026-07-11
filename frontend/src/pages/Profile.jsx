import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../services/api";
import Button from "../components/ui/Button";
import { Label, Input, TextArea } from "../components/ui/Field";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [imageMode, setImageMode] = useState("gallery");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    hostel: "",
    phone: "",
    address: "",
    profilePicture: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get("/auth/profile");
      const user = response.data;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        hostel: user.hostel || "",
        phone: user.phone || "",
        address: user.address || "",
        profilePicture: user.profilePicture || "",
      });
      setImagePreview(user.profilePicture || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setMessage("Failed to load profile");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageFile(null);
    setFormData((prev) => ({ ...prev, profilePicture: url }));
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setImageFile(null);
    setFormData((prev) => ({ ...prev, profilePicture: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let profilePicture = formData.profilePicture;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const { data } = await API.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        profilePicture = `${API_ORIGIN}${data.url}`;
      }

      await API.put("/auth/profile", {
        phone: formData.phone,
        address: formData.address,
        profilePicture,
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
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

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
            <p className="text-slate-500">Update your profile information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Profile Picture
              </label>

              {/* Current Profile Picture */}
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-brand-100">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {getInitials(formData.name)}
                    </span>
                  )}
                </div>
              </div>

              {/* Image Upload Options */}
              <div className="space-y-3">
                {/* Tab Buttons */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImageMode("gallery")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      imageMode === "gallery"
                        ? "bg-brand-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("camera")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      imageMode === "camera"
                        ? "bg-brand-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      imageMode === "url"
                        ? "bg-brand-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    URL
                  </button>
                </div>

                {/* Upload Area */}
                {imageMode === "gallery" && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-brand-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-center"
                    >
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-brand-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-slate-600">
                        Click to upload from gallery
                      </span>
                    </button>
                  </div>
                )}

                {imageMode === "camera" && (
                  <div>
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-brand-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-center"
                    >
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-brand-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm text-slate-600">
                        Click to take a photo
                      </span>
                    </button>
                  </div>
                )}

                {imageMode === "url" && (
                  <input
                    type="url"
                    value={formData.profilePicture}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/your-photo.jpg"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                )}

                {/* Remove Button */}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Name (Read-only) */}
            <div>
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" type="text" value={formData.name} disabled />
            </div>

            {/* Email (Read-only) */}
            <div>
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" value={formData.email} disabled />
            </div>

            {/* Department (Read-only) */}
            <div>
              <Label htmlFor="profile-department">Department</Label>
              <Input id="profile-department" type="text" value={formData.department} disabled />
            </div>

            {/* Hostel (Read-only) */}
            <div>
              <Label htmlFor="profile-hostel">Hostel</Label>
              <Input id="profile-hostel" type="text" value={formData.hostel} disabled />
            </div>

            {/* Phone (Editable) */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address (Editable) */}
            <div>
              <Label htmlFor="address">Address</Label>
              <TextArea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("success")
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
