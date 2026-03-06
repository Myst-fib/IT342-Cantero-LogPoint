import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Login.css';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
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
            <div className="input-with-icon">
              <LockIcon className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
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