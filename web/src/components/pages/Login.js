import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Login.css';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    title: '',
    message: '',
    suggestions: []
  });
  const [loading, setLoading] = useState(false);

  // Check for registration success message from navigation state
  React.useEffect(() => {
    if (location.state?.message) {
      showNotification('success', location.state.message);
      // Clear the state so message doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear notification when user starts typing
    if (notification.show) {
      setNotification({ ...notification, show: false });
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const showNotification = (type, message, suggestions = []) => {
    let title = '';
    
    switch(type) {
      case 'success':
        title = 'Success!';
        break;
      case 'error':
        title = 'Login Failed';
        break;
      case 'warning':
        title = 'Please Check';
        break;
      case 'info':
        title = 'Information';
        break;
      default:
        title = 'Notification';
    }

    setNotification({ 
      show: true, 
      type, 
      title,
      message,
      suggestions
    });
    
    // Auto-hide after 5 seconds for success, 8 for errors
    const timeout = type === 'success' ? 5000 : 8000;
    setTimeout(() => {
      setNotification({ show: false, type: '', title: '', message: '', suggestions: [] });
    }, timeout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username.trim()) {
      showNotification('error', 'Please enter your username');
      return;
    }
    
    if (!formData.password.trim()) {
      showNotification('error', 'Please enter your password');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      let responseData;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        console.log("Error response:", response.status, responseData);
        
        // Handle different error scenarios
        let errorMessage = "Login failed. Please try again.";
        let suggestions = [];
        
        if (response.status === 401) {
          errorMessage = "Invalid username or password";
          suggestions = [
            "🔑 Check that your username and password are correct",
            "🔄 Try resetting your password if you've forgotten it",
            "📝 Make sure Caps Lock is turned off"
          ];
        } else if (response.status === 404) {
          errorMessage = "Account not found";
          suggestions = [
            "📝 Check that you've entered the correct username",
            "🆕 Don't have an account? Sign up below",
            "❓ Contact support if you need assistance"
          ];
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
          suggestions = [
            "⏰ Wait a few minutes and try again",
            "🌐 Check your internet connection",
            "📞 Contact support if the problem persists"
          ];
        }
        
        showNotification('error', errorMessage, suggestions);
        return;
      }

      console.log("Logged in user:", responseData);

      // Store login flag and user details
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(responseData));

      showNotification('success', 'Login successful! Redirecting to dashboard...');
      
      // Redirect after delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (error) {
      console.error("Login error:", error);
      showNotification('error', 'Cannot connect to server. Please check your connection.', [
        "🌐 Check your internet connection",
        "🔄 Make sure the server is running",
        "⏰ Try again in a few moments"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const closeNotification = () => {
    setNotification({ show: false, type: '', title: '', message: '', suggestions: [] });
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircleIcon className="notification-icon" />;
      case 'error': return <ErrorIcon className="notification-icon" />;
      case 'warning': return <WarningIcon className="notification-icon" />;
      case 'info': return <InfoIcon className="notification-icon" />;
      default: return null;
    }
  };

  return (
    <div className="login-container">
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-icon-wrapper">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            
            {/* Show suggestions if available */}
            {notification.suggestions && notification.suggestions.length > 0 && (
              <div className="notification-suggestions">
                <div className="suggestions-title">💡 What you can do:</div>
                <ul className="suggestions-list">
                  {notification.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button className="notification-close" onClick={closeNotification}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
      )}
      
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <EmailIcon className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon password-field">
              <LockIcon className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <IconButton
                className="password-toggle"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="small"
                disabled={loading}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="social-login">
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            className="google-btn"
            onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}
            disabled={loading}
          >
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48px' height='48px'%3E%3Cpath fill='%23FFC107' d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'/%3E%3Cpath fill='%23FF3D00' d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'/%3E%3Cpath fill='%234CAF50' d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'/%3E%3Cpath fill='%231976D2' d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'/%3E%3C/svg%3E"
              alt="Google" 
              className="google-icon" 
            />
            Continue with Google
          </button>
        </div>
        <div className="signup-link">
          <p>
            Don't have an account?{' '}
            <span className="clickable-link" onClick={navigateToRegister}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;