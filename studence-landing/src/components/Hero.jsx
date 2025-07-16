import React from 'react';
import { useNavigate } from 'react-router-dom';
const HeroSection = () => {
    const navigate = useNavigate();
  return (
    <div className="relative h-screen w-full overflow-hidden text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('Hero.jpg')",
        }}
      />
      <div className="absolute inset-0  bg-gradient-to-br from-black via-gray-900 to-black opacity-70" />

      {/* Logo */}
      <div className="absolute top-6 left-6 z-20 text-3xl md:text-4xl font-bold text-[#F9CBA7]">
        Studence
      </div>

      {/* Hero Text */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center h-full px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
          <span className="relative underline-animation">
            Your Campus Hub
          </span>
          <br />
          Awaits You!
        </h1>

        <p className="mt-6 max-w-2xl text-lg md:text-xl font-light text-white/90">
          Welcome to Studence, the ultimate platform designed for students.
          Discover innovative projects, essential resources, and a vibrant
          community to support your academic journey. Join us and unlock your
          full potential!
        </p>
      </div>

      {/* Button */}
      <div className="absolute bottom-10 w-full z-20 flex justify-center">
        <button onClick={() => navigate('/login')} className="bg-[#F9CBA7] hover:bg-[#f4b68d] text-[#3B1F1F] px-8 py-3 rounded-xl text-lg font-semibold transition duration-300 flex items-center gap-2 shadow-lg">
              
          Get Started <span className="text-xl">➜</span>
        </button>
      </div>

      {/* Custom underline styling */}
      <style>
        {`
          .underline-animation::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: -10px;
            height: 8px;
            width: 0%;
            background-color: #F9CBA7;
            transition: width 1.8s ease-out;
            animation: grow-underline 2s ease-out forwards;
          }

          @keyframes grow-underline {
            from {
              width: 0%;
              opacity: 0;
            }
            to {
              width: 100%;
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HeroSection;
