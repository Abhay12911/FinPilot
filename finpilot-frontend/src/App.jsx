import React from 'react';
import { motion, useScroll } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DashboardLayout from './Pages/DashboardLayout';

// Page imports
import LandingPage from './Pages/LandingPage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import MarketOverview from './Pages/MarketOverview';
import ChatBot from './Pages/ChatBot';
import AIResearch from './Pages/AIResearch';

export default function App() {
  const { scrollYProgress } = useScroll();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#050505] antialiased selection:bg-[#050505] selection:text-white">
        {/* Scroll progress bar */}
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="fixed top-0 left-0 right-0 h-[2px] bg-[#050505] origin-left z-[60]"
        />

        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="market-overview" replace />} />
                <Route path="market-overview" element={<MarketOverview />} />
                <Route path="chat" element={<ChatBot />} />
                <Route path="ai-research" element={<AIResearch />} />
                <Route path="*" element={<Navigate to="/dashboard/market-overview" replace />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
