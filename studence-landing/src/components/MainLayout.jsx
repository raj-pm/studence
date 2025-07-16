import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const isGuest = user && !user.token;

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>; // 🔄 Prevent redirect while loading
  }

  return (
    <>
      <Navbar isGuest={isGuest} />
      <div className="pt-16">{children}</div>
    </>
  );
}
