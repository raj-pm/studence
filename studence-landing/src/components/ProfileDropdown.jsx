import { useState } from "react";
import { getAuth } from "firebase/auth";
import defaultAvatar from "../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";

export default function ProfileDropdown({ user, setUser, onLogout }) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || user?.email || "");
  const [imageFile, setImageFile] = useState(null);
  const [editingImage, setEditingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      let avatar_url = user?.avatar_url;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "profile");

        const res = await fetch("https://api.cloudinary.com/v1_1/dzh1ikdmf/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!data.secure_url) throw new Error("Cloudinary upload failed");

        avatar_url = data.secure_url;
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      console.log("Frontend: Sending name to backend:", nameInput);
      console.log("Frontend: Sending avatar_url to backend:", avatar_url);
      console.log("Frontend: User token:", token);

      // FIX: Changed API endpoint to point to the backend server
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameInput, avatar_url }),
      });

      const updated = await response.json();
      console.log("Frontend: Received response from backend:", updated);

      if (!response.ok) {
        console.error("Backend error during profile update:", updated.error || "Unknown error");
        alert(updated.error || "Profile update failed due to server error.");
        return;
      }

      setUser((prev) => ({
        ...prev,
        name: updated.name,
        avatar_url: updated.avatar_url,
        postCount: updated.post_count,
      }));

      setEditingName(false);
      setEditingImage(false);
      setImageFile(null);
    } catch (err) {
      console.error("Profile update failed (network/unexpected error):", err);
      alert("Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNameClick = () => {
    if (editingName) {
      handleSaveProfile();
    } else {
      setEditingName(true);
    }
  };

  const cancelEditImage = () => {
    setEditingImage(false);
    setImageFile(null);
  };

  const handleLogin = () => navigate("/login");

  if (!user || user?.isGuest === true) {
    return (
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl p-6 z-50 text-sm text-[#7b3f00] flex flex-col items-center">
        <button
          onClick={handleLogin}
          className="w-full bg-[#f7c3a0] hover:bg-[#f6b78a] text-[#7b3f00] font-semibold py-2 px-4 rounded-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl p-6 z-50 text-sm text-[#7b3f00]">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-4">
        <label className="relative cursor-pointer w-24 h-24">
          <img
            src={
              imageFile
                ? URL.createObjectURL(imageFile)
                : user?.avatar_url || defaultAvatar
            }
            className="w-24 h-24 rounded-full border-2 border-[#7b3f00] object-cover"
            alt="Avatar"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setImageFile(e.target.files[0]);
              setEditingImage(true);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        {editingImage && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="text-[#7b3f00] hover:text-green-600 text-lg"
            >
              ✅
            </button>
            <button
              onClick={cancelEditImage}
              className="text-[#7b3f00] hover:text-red-600 text-lg"
            >
              ❌
            </button>
          </div>
        )}
      </div>

      {/* Name + Edit */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {editingName ? (
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="border border-[#7b3f00] px-2 py-1 rounded-md w-3/4 text-sm text-center"
          />
        ) : (
          <span className="text-lg font-semibold">{user?.name || user?.email}</span>
        )}
        <button
          onClick={handleEditNameClick}
          className="text-[#7b3f00] hover:text-orange-600 text-sm"
        >
          ✏️
        </button>
      </div>

      {/* Email and Post Count */}
      <div className="text-center text-xs text-gray-500">{user?.email}</div>
      <div className="text-center mt-2 text-[#7b3f00] text-sm">
        <strong>Posts:</strong> {user?.postCount ?? 0}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-[#fbd1ac] hover:bg-[#f7c494] text-[#7b3f00] font-semibold py-2 rounded-lg mt-4"
      >
        Logout
      </button>
    </div>
  );
}
