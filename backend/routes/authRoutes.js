import express from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyFirebaseToken, (req, res) => {
  const { name, email, picture } = req.user;

  res.json({
    name: name || "Anonymous",
    email,
    avatarUrl: picture || null,
  });
});

export default router;
