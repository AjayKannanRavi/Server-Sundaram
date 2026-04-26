import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerMenu from './pages/CustomerMenu'
import CustomerOrderTracker from './pages/CustomerOrderTracker'
import KitchenDashboard from './pages/KitchenDashboard'
import AdminMenuManager from './pages/AdminMenuManager'
import BillPage from './pages/BillPage'
import ReviewPage from './pages/ReviewPage'
import CustomerLogin from './pages/CustomerLogin'
import StaffLogin from './pages/StaffLogin'
import StaffGuard from './components/StaffGuard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SaaSLanding from './pages/SaaSLanding'
import HotelRegistration from './pages/HotelRegistration'
import OwnerDashboard from './pages/OwnerDashboard'
import CaptainDashboard from './pages/CaptainDashboard'
import RedirectLogin from './pages/RedirectLogin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Registration */}
        <Route path="/" element={<SaaSLanding />} />
        <Route path="/register" element={<HotelRegistration />} />
        <Route path="/login" element={<RedirectLogin />} />
        
        {/* Customer Experience */}
        <Route path="/:hotelId/menu" element={<CustomerMenu />} />
        <Route path="/:hotelId/login" element={<CustomerLogin />} />
        <Route path="/:hotelId/tracker" element={<CustomerOrderTracker />} />
        <Route path="/:hotelId/bill" element={<BillPage />} />
        <Route path="/:hotelId/review" element={<ReviewPage />} />

        {/* --- Unified Partner Portal (Strategic/Owner) --- */}
        <Route path="/admin/login" element={<StaffLogin role="OWNER" />} />
        <Route path="/:hotelId/owner/login" element={<StaffLogin role="OWNER" />} />
        <Route path="/:hotelId/owner" element={
          <StaffGuard requiredRole="OWNER">
             <OwnerDashboard />
          </StaffGuard>
        } />

        {/* --- Operational Admin Panel (Tactical/Manager) --- */}
        <Route path="/:hotelId/admin/login" element={<StaffLogin role="ADMIN" />} />
        <Route path="/:hotelId/admin" element={
          <StaffGuard requiredRole="ADMIN">
            <AdminMenuManager />
          </StaffGuard>
        } />

        {/* --- Kitchen Terminal --- */}
        <Route path="/:hotelId/kitchen/login" element={<StaffLogin role="KITCHEN" />} />
        <Route path="/:hotelId/kitchen" element={
          <StaffGuard requiredRole="KITCHEN">
            <KitchenDashboard />
          </StaffGuard>
        } />

        {/* --- Captain Dashboard (Waiter) --- */}
        <Route path="/:hotelId/captain/login" element={<StaffLogin role="WAITER" />} />
        <Route path="/:hotelId/captain" element={
          <StaffGuard requiredRole="WAITER">
            <CaptainDashboard />
          </StaffGuard>
        } />

        {/* --- Platform Super Admin --- */}
        <Route path="/saas-admin" element={<SuperAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
