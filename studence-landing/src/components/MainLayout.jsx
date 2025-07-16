import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const isGuest = user && !user.token; // token is null for guest

  return (
    <>
      <Navbar isGuest={isGuest} />
      <div className="pt-16">{children}</div>
    </>
  );
}
