import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Register from './components/pages/Register';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Profile from './components/pages/Profile';
import NavBar from './components/common/NavBar';

function AppLayout() {
  const location = useLocation();
  
  // Show navbar on authenticated routes (dashboard, profile, etc.)
  const authenticatedRoutes = ['/dashboard', '/profile', '/borrow'];
  const showNavBar = authenticatedRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {showNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
