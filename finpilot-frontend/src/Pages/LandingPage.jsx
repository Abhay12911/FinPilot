import React from 'react';
import { motion, useScroll } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { TrustSection } from '../components/TrustSection';
import { ProblemSection } from '../components/ProblemSection';
import { HowItWorks } from '../components/HowItWorks';
import { BentoFeatures } from '../components/BentoFeatures';
import { ResearchDemo } from '../components/ResearchDemo';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { FAQ } from '../components/FAQ';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';
import { BackToTop } from '../components/BackToTop';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#050505] antialiased selection:bg-[#050505] selection:text-white">
      
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#050505] origin-left z-[60]"
      />
    
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <ProblemSection />
        <BentoFeatures />
        <HowItWorks />
        <ResearchDemo />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

