// routes/profileRoutes.js
import express from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";
import supabase from "../supabaseClient.js";

const router = express.Router();

// Get profile
router.get("/", verifyFirebaseToken, async (req, res) => {
  const { email } = req.user;

  if (!email) {
    return res.status(400).json({ error: "Guest users have no profile" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
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
// Update profile
router.put("/", verifyFirebaseToken, async (req, res) => {
  const { name, avatar_url } = req.body;
  const { id } = req.user;

  try {
    // Attempt to update the user
    const { data, error } = await supabase
      .from("users")
      .update({ name, avatar_url })
      .eq("id", id)
      .select()
      .single();

    // Handle case: update failed or no user was found
    if (error || !data) {
      console.error("Update profile error:", error || "No user found with given ID");
      return res.status(404).json({ error: "User not found or update failed" });
    }

    res.json({ name: data.name, avatar_url: data.avatar_url });
  } catch (err) {
    console.error("Update profile exception:", err);
    res.status(500).json({ error: "Failed to update profile", detail: err.message });
  }
});


export default router;
