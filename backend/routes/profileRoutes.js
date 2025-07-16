import express from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";
import supabase from "../supabaseClient.js";

const router = express.Router();

// Get profile
router.get("/", verifyFirebaseToken, async (req, res) => {
  const { uid } = req.user; // Use uid from req.user
  console.log("Backend: GET /api/profile | User UID from token:", uid); // DEBUG LOG

  if (!uid) { // Check for uid, not just email
    return res.status(400).json({ error: "Guest users have no profile or UID missing" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*, post_count") // MODIFIED: Explicitly select post_count
    .eq("id", uid) // Query by id (UID)
    .maybeSingle();

  if (error) {
    console.error("Fetch user error:", error.message);
    return res.status(500).json({ error: "Failed to fetch user" });
  }

  if (!data) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(data);
});

// Update profile
router.put("/", verifyFirebaseToken, async (req, res) => {
  const { name, avatar_url } = req.body;
  const { uid } = req.user; // FIX: Use uid from req.user

  console.log("Backend: PUT /api/profile | Received name:", name); // DEBUG LOG
  console.log("Backend: PUT /api/profile | Received avatar_url:", avatar_url); // DEBUG LOG
  console.log("Backend: PUT /api/profile | User UID from token:", uid); // DEBUG LOG

  try {
    // Attempt to update the user
    const { data, error } = await supabase
      .from("users")
      .update({ name, avatar_url })
      .eq("id", uid) // FIX: Use uid to match the users table's primary key
      .select("name, avatar_url, post_count") // MODIFIED: Select post_count to return it
      .single();

    // Handle case: update failed or no user was found
    if (error || !data) {
      console.error("Update profile error:", error || "No user found with given ID");
      return res.status(404).json({ error: "User not found or update failed" });
    }

    console.log("Backend: PUT /api/profile | Supabase update successful. Returned data:", data); // DEBUG LOG
    res.json({ name: data.name, avatar_url: data.avatar_url, post_count: data.post_count }); // MODIFIED: Return post_count
  } catch (err) {
    console.error("Update profile exception:", err);
    res.status(500).json({ error: "Failed to update profile", detail: err.message });
  }
});

export default router;
