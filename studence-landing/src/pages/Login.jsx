import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email;

      if (!email.endsWith('@sit.ac.in')) {
        alert('Please use your SIT college email.');
        auth.signOut();
        return;
      }

      const token = await user.getIdToken();

      // Send token to backend to create/update user in Supabase
      const response = await fetch('/api/profile', {
        method: 'GET', // optional, just to trigger auto-create
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Update local user context
      setUser({
        name: data.name || user.displayName || email,
        email,
        avatar_url: data.avatar_url || user.photoURL,
        token,
        postCount: data.postCount || 0,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error.message);
      alert('Google sign-in failed');
    }
  };

 
 const handleGuestLogin = () => {
  console.log("Guest login triggered");
  setUser({
    name: "Guest",
    email: "guest@studence.app",
    avatar_url: "",
    token: null,
    postCount: 0,
  });
  console.log("Navigating to dashboard...");
  navigate('/dashboard');
};




  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/Hero.jpg')" }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-70 z-10" />

      {/* Login Card */}
      <div className="relative z-20 bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full border border-white/20">
        <h1 className="text-2xl font-bold mb-6 text-[#3B1F1F]">
          Login to Studence
        </h1>

        {/* Guest Button */}
        <button
          onClick={handleGuestLogin}
          className="w-full mb-4 bg-[#F9CBA7] hover:bg-[#f4b68d] text-[#3B1F1F] font-semibold py-2 px-4 rounded transition transform hover:scale-105 hover:shadow-lg duration-300"
        >
          Continue as Guest
        </button>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border border-[#3B1F1F] bg-white hover:bg-[#f9cba7]/30 text-[#3B1F1F] font-semibold py-2 px-4 rounded transition duration-300 flex items-center justify-center gap-2 hover:-translate-y-1"
        >
          <FcGoogle size={22} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
