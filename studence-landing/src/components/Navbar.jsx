import { useEffect, useState, useContext } from "react";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import ProfileDropdown from "./ProfileDropdown";
import defaultAvatar from "../assets/default-avatar.png";
import logo from "../assets/logo.jpeg"; // Assuming you have a logo image

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  // 🟠 Scroll Hide Navbar
  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY <= lastScrollY);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ✅ Fetch profile after login
 useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) return;

    const token = await currentUser.getIdToken();

    try {
      const res = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setUser({
        token,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        postCount: data.postCount,
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  });

  return () => unsubscribe();
}, []);


  // 🔴 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login");
  };

  // ✅ Optional: name update from ProfileDropdown (handled inside too)
  const handleNameUpdate = async (newName) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      const updated = await res.json();
      setUser((prev) => ({ ...prev, name: updated.name }));
    } catch (error) {
      console.error("Name update failed", error);
    }
  };

  return (
    <div
      className={`bg-[#fbd1ac] px-6 py-4 flex justify-between items-center shadow-sm fixed top-0 w-full z-50 transition-transform duration-300 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center text-2xl font-bold text-[#7b3f00] gap-2">
  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
  Studence
</div>


      <div className="flex items-center gap-6 text-[#7b3f00] relative">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/your-posts">Your Posts</Link>
        <Bell className="w-5 h-5 cursor-pointer" />

        {user ? (
          <div className="relative">
            <img
              src={user.avatarUrl || defaultAvatar}
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 rounded-full cursor-pointer border border-[#7b3f00]"
              alt="Profile"
            />
            {showDropdown && (
              <ProfileDropdown
                user={user}
                setUser={setUser}
                onLogout={handleLogout}
                onNameUpdate={handleNameUpdate}
              />
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-[#fbd1ac] border border-[#7b3f00] text-[#7b3f00] px-3 py-1 rounded-md"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}
