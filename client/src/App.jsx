import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Import Context (Update path to look inside 'context' folder)
import { AuthProvider } from './context/AuthContext'; 

// 2. Import Components (Update path to look inside 'components' folder)
import ProtectedRoute from './components/ProtectedRoute';

// 3. Import Pages (Update paths to look inside 'pages' folder)
import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import AdminDashboard from './pages/AdminDashboard';
import SuccessPage from './pages/SuccessPage';
import Register from './pages/Register';
import OrderPage from './pages/OrderPage';
import QRScanPage from './pages/QRScanPage';


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/orders" element={<OrderPage />} />


          {/* Dynamic Route for Scanning */}
          <Route path="/scan/:token" element={<ProductPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
             <Route path="/admin" element={<AdminDashboard />} />
             <Route path="/admin/poster/:productId" element={<QRScanPage />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}