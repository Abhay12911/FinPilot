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
import Overview from './Pages/Overview';
import MarketOverview from './Pages/MarketOverview';
import MarketSignals from './Pages/MarketSignals';
import CompanyWorkspace from './Pages/CompanyWorkspace';
import ChatBot from './Pages/ChatBot';
import Compare from './Pages/Compare';
import AIResearch from './Pages/AIResearch';
import Portfolio from './Pages/Portfolio';
import Watchlist from './Pages/Watchlist';
import PersonalAnalyzer from './Pages/PersonalAnalyzer';
import MarketNews from './Pages/MarketNews';
import Documents from './Pages/Documents';
import Reports from './Pages/Reports';
import BrokerIntegration from './Pages/BrokerIntegration';

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
                <Route index element={<Overview />} />
                <Route path="market-overview" element={<MarketOverview />} />
                <Route path="market-signals" element={<MarketSignals />} />
                <Route path="companies" element={<CompanyWorkspace />} />
                <Route path="companies/:ticker" element={<CompanyWorkspace />} />
                <Route path="research" element={<ChatBot />} />
                <Route path="compare" element={<Compare />} />
                <Route path="ai-research" element={<AIResearch />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="watchlist" element={<Watchlist />} />
                <Route path="personal-analyzer" element={<PersonalAnalyzer />} />
                <Route path="market-news" element={<MarketNews />} />
                <Route path="documents" element={<Documents />} />
                <Route path="reports" element={<Reports />} />
                <Route path="brokers" element={<BrokerIntegration />} />
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