import express from "express";
import supabase from "../supabaseClient.js";

import {
  createPost,
  getAllPosts,
  getUserPosts, // This function is now redundant with the /your-posts route handler
  deletePost,
  updatePost,
  toggleLike,
  getLikeStatus,
  getLikesCount,
  addComment,
  getCommentsForPost,
  getCommentsCount,
} from "../controllers/postController.js";

import { verifyFirebaseToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Existing User Posts Route (MODIFIED) ---
router.get('/your-posts', verifyFirebaseToken, async (req, res) => {
  try {
    // FIX: Access req.user.uid instead of req.user.id
    const userId = req.user.uid;
    console.log("✅ /your-posts | User ID from token:", userId);

    if (!userId) {
      // This case should ideally not be reached if verifyFirebaseToken works,
      // but it's a good safeguard.
      return res.status(401).json({ error: "User ID not found in token." });
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*, name") // Ensure 'name' is selected if stored directly on post
      .eq("user_id", userId) // Use the correctly extracted userId
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Posts fetched:", data);
    return res.status(200).json({ posts: data }); // Ensure it returns { posts: [...] }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Failed to fetch user posts." });
  }
});


// --- Existing Post Routes ---
router.post("/create", verifyFirebaseToken, createPost);
router.get("/all", getAllPosts);
// Consider removing or renaming this route if '/your-posts' serves the same purpose
router.get("/user", verifyFirebaseToken, getUserPosts);
router.delete("/delete/:id", verifyFirebaseToken, deletePost);
router.put("/edit/:id", verifyFirebaseToken, updatePost);

// --- Like Routes ---
router.post('/:postId/like', verifyFirebaseToken, toggleLike);
router.get('/:postId/like-status', verifyFirebaseToken, getLikeStatus);
router.get('/:postId/likes/count', getLikesCount);

// --- Comment Routes ---
router.post('/:postId/comments', verifyFirebaseToken, addComment);
router.get('/:postId/comments', getCommentsForPost);
router.get('/:postId/comments/count', getCommentsCount);

export default router;
