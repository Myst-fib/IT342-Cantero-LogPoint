import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Register from './components/pages/Register';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Profile from './components/pages/Profile';
import NavBar from './components/common/NavBar';
import AddVisitor from './components/features/AddVisitor';
import VisitorLog from './components/features/VisitorLog';
import ProtectedRoute from './components/common/ProtectedRoute';
import OAuth2Redirect from './components/google/OAuth2Redirect';

function AppLayout() {
  const location = useLocation();

  const authenticatedRoutes = ['/dashboard', '/profile', '/add-visitor', '/visitor-log'];
  const showNavBar = authenticatedRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {showNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

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
        <Route
          path="/visitor-log"
          element={
            <ProtectedRoute>
              <VisitorLog />
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