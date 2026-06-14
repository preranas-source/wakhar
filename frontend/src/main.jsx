import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './landing/LandingPage.jsx'
import LoginPage from './landing/components/LoginPage.jsx'
import RegisterPage from './landing/components/RegisterPage.jsx'
import App from './App.jsx'
import AccessDenied from './pages/AccessDenied.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Stakeholder login & signup routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/farmer-login" element={<LoginPage role="farmer" icon="👨‍🌾" />} />
          <Route path="/fpo-login" element={<LoginPage role="fpo" icon="🏭" />} />
          <Route path="/aggregator-login" element={<LoginPage role="aggregator" icon="🔗" />} />
          <Route path="/market-login" element={<LoginPage role="market" icon="🏪" />} />

          {/* Access Denied */}
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Protected Routes by Role */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <App roleKey="admin" />
            </ProtectedRoute>
          } />
          <Route path="/admin/:tabName" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <App roleKey="admin" />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['fpo_manager']}>
              <App roleKey="fpo_manager" />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/:tabName" element={
            <ProtectedRoute allowedRoles={['fpo_manager']}>
              <App roleKey="fpo_manager" />
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['fpo_staff']}>
              <App roleKey="fpo_staff" />
            </ProtectedRoute>
          } />
          <Route path="/staff/:tabName" element={
            <ProtectedRoute allowedRoles={['fpo_staff']}>
              <App roleKey="fpo_staff" />
            </ProtectedRoute>
          } />

          <Route path="/aggregator" element={
            <ProtectedRoute allowedRoles={['aggregator']}>
              <App roleKey="aggregator" />
            </ProtectedRoute>
          } />
          <Route path="/aggregator/:tabName" element={
            <ProtectedRoute allowedRoles={['aggregator']}>
              <App roleKey="aggregator" />
            </ProtectedRoute>
          } />

          <Route path="/marketplace" element={
            <ProtectedRoute allowedRoles={['market_partner']}>
              <App roleKey="market_partner" />
            </ProtectedRoute>
          } />
          <Route path="/marketplace/:tabName" element={
            <ProtectedRoute allowedRoles={['market_partner']}>
              <App roleKey="market_partner" />
            </ProtectedRoute>
          } />

          <Route path="/farmer" element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <App roleKey="farmer" />
            </ProtectedRoute>
          } />
          <Route path="/farmer/:tabName" element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <App roleKey="farmer" />
            </ProtectedRoute>
          } />

          {/* Redirect unknown to landing */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
