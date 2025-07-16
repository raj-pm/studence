// middleware/authMiddleware.js
import admin from "../utils/firebaseAdmin.js";
import supabase from "../supabaseClient.js";

export const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decoded;

    // Check if user exists in Supabase, if not, create them
    // This ensures your 'users' table in Supabase is synced with Firebase Auth
    const { data: user, error: fetchUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (fetchUserError && fetchUserError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Error fetching user from Supabase:", fetchUserError.message);
      return res.status(500).json({ error: "Database error during user check" });
    }

    if (!user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: uid,
          email,
          name: name || email.split("@")[0], // Use Firebase name or derive from email
          avatar_url: picture || "", // Use Firebase picture
        },
      ]);
      if (insertError) {
        console.error("Insert user error:", insertError.message);
        return res.status(500).json({ error: "User creation in database failed" });
      }
      console.log(`New user created in Supabase: ${name || email}`);
    }

    // FIX: Attach uid to req.user as 'uid' to match controller expectations
    req.user = { uid: uid, email: email, name: name || email.split("@")[0], avatar_url: picture || "" }; // Also pass name and avatar for convenience
    console.log("✅ Token verified. req.user set:", req.user); // Log to confirm

    next();
  } catch (err) {
    console.error("❌ Auth error (verifyFirebaseToken):", err.message);
    // More specific error handling for common Firebase errors
    let errorMessage = "Invalid token";
    if (err.code === 'auth/id-token-expired') {
      errorMessage = "Authentication token expired. Please log in again.";
    } else if (err.code === 'auth/argument-error') {
      errorMessage = "Invalid authentication token format.";
    }
    return res.status(401).json({ error: errorMessage, detail: err.message });
  }
};
