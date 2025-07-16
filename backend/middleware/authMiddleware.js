// middleware/authMiddleware.js
import admin from "../utils/firebaseAdmin.js";
import supabase from "../supabaseClient.js";

export const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decoded;

    // Try to get existing user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    // If user doesn't exist (error message: "Row not found")
    if (error && error.message === "Row not found") {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: uid,
          email,
          name: name || email.split("@")[0],
          avatar_url: picture || "",
        },
      ]);
      if (insertError) {
        console.error("Insert user error:", insertError.message);
        return res.status(500).json({ error: "User creation failed" });
      }
    } else if (error) {
      // Some other unexpected error
      console.error("Fetch user error:", error.message);
      return res.status(500).json({ error: "Failed to fetch user" });
    }

    req.user = { id: uid, email };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token", detail: err.message });
  }
};
