import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { useUser } from "../UserContext"; // NEW: Import useUser

export default function PostModal({ type, onClose, refetch, currentUserName }) {
  console.log("PostModal: currentUserName prop received:", currentUserName);

  const [content, setContent] = useState("");
  const [skills, setSkills] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [postAs, setPostAs] = useState("You");

  const auth = getAuth();
  const { refreshUserProfile, user } = useUser(); // NEW: Get refreshUserProfile from context

  const handleSubmit = async () => {
   
    if (!user || user.isGuest) {
      alert("You must be logged in");
      return;
    }

    const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    alert("You must be logged in");
    return;
  }

  

    if (type === "Resource" && !file) {
      alert("Please upload a file before submitting.");
      return;
    }

    const token = await user.getIdToken(true);
    const isAnonymous = postAs === "Anonymous";
    let link = "";

    // Upload file to Cloudinary
    if (type === "Resource" && file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "profile"); // Your preset
      try {
        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dzh1ikdmf/raw/upload", // Your Cloudinary endpoint
          {
            method: "POST",
            body: formData,
          }
        );
        const uploadData = await uploadRes.json();
        link = uploadData.secure_url;
      } catch (err) {
        console.error("File upload error:", err);
        alert("Failed to upload file.");
        return;
      }
    }

    const tagArray =
      type === "Team"
        ? skills.split(",").map((t) => t.trim()).filter((t) => t)
        : tags.split(",").map((t) => t.trim()).filter((t) => t);

    // Construct the payload
    const payload = {
      type: type.toLowerCase(),
      isAnonymous,
      tags: tagArray,
      ...(link && { link }),
      ...(content.trim() && { content }),
    };

    // Explicitly add name if not anonymous
    if (!isAnonymous) {
      payload.name = currentUserName || user.displayName || "User";
    }

    console.log("PostModal: Final payload being sent:", payload);

    try {
      const res = await fetch("http://localhost:3000/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Server error:", data);
        alert(data.error || "Failed to post.");
      } else {
        onClose();
        refetch(); // Refresh posts on Dashboard/YourPosts
        await refreshUserProfile(); // NEW: Refresh user profile to update post count
        
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center  bg-opacity-30">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-[#f1e2d1]">
        <h2 className="text-2xl font-bold text-[#7b3f00] mb-5 text-center">
          {type === "Question" && "Ask a Question"}
          {type === "Team" && "Find a Team"}
          {type === "Resource" && "Share a Resource"}
        </h2>

        {/* Description Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#7b3f00] mb-1">
            {type === "Question" && "Your Question"}
            {type === "Team" && "Project Description"}
            {type === "Resource" && "Description (optional)"}
          </label>
          <textarea
            rows={type === "Resource" ? 3 : 4}
            placeholder={
              type === "Question"
                ? "What do you want to ask?"
                : type === "Team"
                ? "Describe your project..."
                : "Describe the file or its use..."
            }
            className="w-full p-3 border border-[#eec6a0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fbd1ac]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Skills Needed */}
        {type === "Team" && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#7b3f00] mb-1">
              Skills Needed (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g., React, ML, UI/UX"
              className="w-full p-3 border border-[#eec6a0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fbd1ac]"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>
        )}

        {/* File Upload for Resource */}
        {type === "Resource" && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#7b3f00] mb-1">
              Upload File <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => document.getElementById("fileInput").click()}
                className="bg-[#d89566] text-white px-4 py-2 rounded-md shadow hover:bg-[#c87d45]"
              >
                {file ? "Change File" : "Upload File"}
              </button>
              {file && (
                <span className="text-sm text-gray-700">{file.name}</span>
              )}
            </div>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Post As */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-[#7b3f00] mr-2">
            Post as:
          </label>
          <select
            className="border border-[#eec6a0] rounded-md px-3 py-2"
            value={postAs}
            onChange={(e) => setPostAs(e.target.value)}
          >
            <option value="You">You</option>
            <option value="Anonymous">Anonymous</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-[#7b3f00] rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#d89566] text-white rounded-lg hover:bg-[#c87d45]"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
