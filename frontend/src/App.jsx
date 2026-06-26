// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import MoMoConfig from './pages/MoMoConfig';
import PaystackCallback from './pages/PaystackCallback';
import SuperAdmin from './pages/SuperAdmin';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      {/* Landing page is now the homepage at "/" */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/paystack/callback" element={<PaystackCallback />} />

      {/* Protected dashboard routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/momo-config" element={<MoMoConfig />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
      </Route>
    </Routes>
  );
}

export default App;