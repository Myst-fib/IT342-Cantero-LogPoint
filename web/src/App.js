import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Register from './features/auth/Register';
import Login from './features/auth/Login';
import Dashboard from './features/sync/Dashboard';
import Profile from './features/profile/Profile';
import NavBar from './shared/NavBar';
import AddVisitor from './features/visitors/AddVisitor';
import VisitorLog from './features/visitlog/VisitorLog';
import ProtectedRoute from './shared/ProtectedRoute';
import OAuth2Redirect from './features/auth/OAuth2Redirect';

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
            <ProtectedRoute requiredRole="office administrator">
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