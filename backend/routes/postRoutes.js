// routes/postRoutes.js
import express from "express";
import supabase from "../supabaseClient.js";

import {
  createPost,
  getAllPosts,
  getUserPosts,
  deletePost,
  updatePost,
} from "../controllers/postController.js";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";

const router = express.Router();
// In backend route file
router.get('/your-posts', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.user; // from authMiddleware
    console.log("✅ /your-posts | User ID from token:", id);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Posts fetched:", data);
    return res.status(200).json({ posts: data });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Failed to fetch user posts." });
  }
});




router.post("/create", verifyFirebaseToken, createPost);
router.get("/all", getAllPosts);
router.get("/user", verifyFirebaseToken, getUserPosts);
router.delete("/delete/:id", verifyFirebaseToken, deletePost);
router.put("/edit/:id", verifyFirebaseToken, updatePost);


export default router;
