import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './landing/LandingPage.jsx'
import LoginPage from './landing/components/LoginPage.jsx'
import RegisterPage from './landing/components/RegisterPage.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Stakeholder login & signup routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/farmer-login" element={<LoginPage role="farmer" icon="👨‍🌾" />} />
        <Route path="/fpo-login" element={<LoginPage role="fpo" icon="🏭" />} />
        <Route path="/aggregator-login" element={<LoginPage role="aggregator" icon="🔗" />} />
        <Route path="/market-login" element={<LoginPage role="market" icon="🏪" />} />

        {/* Dynamic role and tab routes */}
        <Route path="/:roleKey" element={<App />} />
        <Route path="/:roleKey/:tabName" element={<App />} />

        {/* Existing WMS dashboard app */}
        <Route path="/app" element={<App />} />
        <Route path="/app/*" element={<App />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/dashboard/*" element={<App />} />

        {/* Redirect unknown to landing */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
