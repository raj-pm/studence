// src/UserContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react"; // Added useCallback
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch and set user profile data
  const fetchUserProfile = useCallback(async (firebaseUser, token, isGuest) => {
    if (isGuest) {
      setUser({
        uid: firebaseUser.uid,
        email: null,
        name: "Guest",
        avatar_url: "",
        token,
        isGuest: true,
        postCount: 0, // Guest users typically don't have posts
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/profile", { // Explicitly use backend URL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: data.name || firebaseUser.displayName || firebaseUser.email.split("@")[0],
          avatar_url: data.avatar_url || firebaseUser.photoURL || "",
          token,
          isGuest: false,
          postCount: data.post_count ?? 0, // Ensure post_count is read from backend response
        });
      } else {
        console.error("Failed to fetch profile in UserContext:", data.error || res.statusText);
        // Fallback to basic Firebase user info if profile fetch fails
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          avatar_url: firebaseUser.photoURL || "",
          token,
          isGuest: false,
          postCount: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching profile in UserContext", err);
      // Fallback to basic Firebase user info on network error
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
        avatar_url: firebaseUser.photoURL || "",
        token,
        isGuest: false,
        postCount: 0,
      });
    }
  }, []); // No dependencies, as firebaseUser and token are passed as arguments


  // NEW: Function to manually refresh user profile data
  const refreshUserProfile = useCallback(async () => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    if (firebaseUser && !firebaseUser.isAnonymous) {
      const token = await firebaseUser.getIdToken(true); // Force refresh token
      await fetchUserProfile(firebaseUser, token, false); // Re-fetch profile
    }
  }, [fetchUserProfile]); // Depends on fetchUserProfile

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const isGuest = firebaseUser.isAnonymous;
        await fetchUserProfile(firebaseUser, token, isGuest);
      } else {
        setUser(null); // No user logged in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]); // Depends on fetchUserProfile

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUserProfile }}> {/* Expose refreshUserProfile */}
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
