import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Register from './components/pages/Register';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Profile from './components/pages/Profile';
import NavBar from './components/common/NavBar';
import AddVisitor from './components/features/AddVisitor';
import ProtectedRoute from './components/common/ProtectedRoute'; // ← ADD THIS


function AppLayout() {
  const location = useLocation();

  const authenticatedRoutes = ['/dashboard', '/profile', '/add-visitor', '/records'];
  const showNavBar = authenticatedRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {showNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Admin only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="office administrators">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Any authenticated user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-visitor"
          element={
            <ProtectedRoute>
              <AddVisitor />
            </ProtectedRoute>
          }
        />
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