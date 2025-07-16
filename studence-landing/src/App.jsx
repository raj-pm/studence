import React from "react";
import { Routes, Route } from "react-router-dom";
import HeroSection from "./components/Hero";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import YourPosts from "./pages/YourPosts"; // 🔥 New page

function App() {
  return (
    <Routes>
      <Route path="/" element={<HeroSection />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes under layout */}
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />
      <Route
        path="/your-posts"
        element={
          <MainLayout>
            <YourPosts />
          </MainLayout>
        }
      />
    </Routes>
  );
}

export default App;
