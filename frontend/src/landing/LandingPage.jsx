import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import StakeholderSelection from './components/StakeholderSelection';
import './landing.css';

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-root">
      <Navbar />
      <Hero />
      <About />
      <StakeholderSelection />
    </div>
  );
}
