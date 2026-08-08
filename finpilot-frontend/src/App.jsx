import React from 'react';
import { motion, useScroll } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';

export default function App() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#050505] antialiased selection:bg-[#050505] selection:text-white">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#050505] origin-left z-[60]"
      />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={(u, t) => console.log('Login', u)} />} />
          <Route path="/signup" element={<SignupPage onLoginSuccess={(u, t) => console.log('Signup', u)} />} />
        </Routes>
      </main>
    </div>
  );
}