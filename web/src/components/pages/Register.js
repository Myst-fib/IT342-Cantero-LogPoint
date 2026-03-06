import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import AddModeratorRoundedIcon from '@mui/icons-material/AddModeratorRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    customRole: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    title: '',
    message: '',
    field: null,
    suggestions: []
  });
  const [loading, setLoading] = useState(false);

  // Helper function to translate backend errors to user-friendly messages
  const translateError = (errorData, status) => {
    console.log("Translating error:", { errorData, status });
    
    let userMessage = "Something went wrong. Please try again.";
    let title = "Registration Failed";
    let field = null;
    let suggestions = [];

    if (status === 500) {
      title = "Unable to Complete Registration";
      userMessage = "We're having trouble creating your account right now.";
      suggestions = [
        "✅ Make sure you're using a unique email address that hasn't been registered before",
        "✅ Check that all fields are filled out correctly",
        "✅ Ensure your password is at least 6 characters long"
      ];
      
      if (typeof errorData === 'string') {
        if (errorData.toLowerCase().includes('duplicate') || errorData.toLowerCase().includes('unique')) {
          title = "Email Already Registered";
          userMessage = "This email address is already associated with an account.";
          suggestions = [
            "🔑 Try logging in with this email instead",
            "🔄 Use a different email address to register",
            "❓ Forgot your password? Click 'Forgot Password' on the login page"
          ];
          field = 'email';
        } else if (errorData.toLowerCase().includes('null') || errorData.toLowerCase().includes('required')) {
          userMessage = "Some required information is missing.";
          suggestions = [
            "📝 Make sure all fields are filled out",
            "✅ Check that you've selected a role",
            "🔍 Verify your first and last name are entered"
          ];
        }
      }
    }
    
    if (status === 400) {
      title = "Invalid Information";
      userMessage = "Please check the information you provided.";
      suggestions = [
        "📧 Make sure your email format is correct (name@example.com)",
        "🔒 Password must be at least 6 characters long",
        "✅ Ensure passwords match"
      ];
    }
    
    if (status === 409) {
      title = "Email Already Exists";
      userMessage = "This email is already registered in our system.";
      suggestions = [
        "🔑 Go to the login page to access your account",
        "🔄 Use a different email address to create a new account",
        "❓ If this is your email, try resetting your password"
      ];
      field = 'email';
    }
    
    if (status === 422) {
      title = "Validation Error";
      userMessage = "Some information doesn't meet our requirements.";
      suggestions = [
        "📧 Check that your email is valid",
        "🔒 Password must be at least 6 characters",
        "📝 Make sure all fields are filled correctly"
      ];
    }
    
    if (status === 503 || status === 0) {
      title = "Server Unavailable";
      userMessage = "We can't reach our servers right now.";
      suggestions = [
        "🌐 Check your internet connection",
        "🔄 Refresh the page and try again",
        "⏰ Wait a few minutes and try again",
        "📞 Contact support if the problem persists"
      ];
    }
    
    return { title, userMessage, field, suggestions };
  };

  const showNotification = (type, message, field = null, status = null, errorData = null) => {
    let title = '';
    let userMessage = message;
    let suggestions = [];
    
    if (type === 'error' && status) {
      const translated = translateError(errorData || message, status);
      title = translated.title;
      userMessage = translated.userMessage;
      field = translated.field || field;
      suggestions = translated.suggestions;
    } else {
      switch(type) {
        case 'success':
          title = 'Success!';
          break;
        case 'error':
          title = 'Something Went Wrong';
          break;
        case 'warning':
          title = 'Please Check';
          break;
        case 'info':
          title = 'Did You Know?';
          break;
        default:
          title = 'Notification';
      }
    }

    setNotification({ 
      show: true, 
      type, 
      title,
      message: userMessage,
      field,
      suggestions
    });
    
    const timeout = type === 'success' ? 5000 : 8000;
    setTimeout(() => {
      setNotification({ show: false, type: '', title: '', message: '', field: null, suggestions: [] });
    }, timeout);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && value !== 'Others' && { customRole: '' }),
    }));
    
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
    
    if (notification.field === name) {
      setNotification({ ...notification, show: false });
    }
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showNotification('error', 'Please enter a valid email address', 'email');
      return false;
    }

    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      showNotification('error', 'Password must be at least 6 characters long for security', 'password');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      showNotification('error', 'The passwords you entered do not match', 'confirmPassword');
      return false;
    }

    if (!formData.firstName.trim()) {
      showNotification('error', 'Please enter your first name', 'firstName');
      return false;
    }

    if (!formData.lastName.trim()) {
      showNotification('error', 'Please enter your last name', 'lastName');
      return false;
    }

    if (!formData.role) {
      showNotification('error', 'Please select a role', 'role');
      return false;
    }

    if (formData.role === 'Others' && !formData.customRole.trim()) {
      showNotification('error', 'Please specify your role', 'customRole');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role === 'Others' ? formData.customRole.trim() : formData.role,
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
        
        showNotification(
          'error', 
          'Registration failed', 
          null, 
          response.status, 
          responseData
        );
        return;
      }

      showNotification('success', 'Your account has been created successfully!');
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        customRole: '',
      });
      
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: 'Registration successful! Please login with your credentials.' 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error("Network error:", error);
      showNotification(
        'error', 
        'Cannot connect to server', 
        null, 
        0,
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const closeNotification = () => {
    setNotification({ show: false, type: '', title: '', message: '', field: null, suggestions: [] });
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

  const getFieldClassName = (fieldName) => {
    return `input-with-icon ${notification.field === fieldName ? 'field-error' : ''}`;
  };

  return (
    <div className="register-container">
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-icon-wrapper">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            
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
            
            {notification.field && (
              <div className="notification-hint">
                <small>👉 Check the highlighted field above</small>
              </div>
            )}
          </div>
          <button className="notification-close" onClick={closeNotification}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
      )}
      
      <div className="register-box">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          
          {/* Email field - now first */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className={getFieldClassName('email')}>
              <EmailIcon className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                className={notification.field === 'email' ? 'error-highlight' : ''}
              />
            </div>
            {/* Removed the "We'll never share your email" text */}
          </div>

          {/* Role field - now second */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className={`role-select-container ${getFieldClassName('role')}`}>
              <AddModeratorRoundedIcon className="input-icon role-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`role-select ${notification.field === 'role' ? 'error-highlight' : ''}`}
                required
              >
                <option value="">Select your role</option>
                <option value="Office Administrators">Office Administrators</option>
                <option value="Security Guards">Security Guards</option>
                <option value="Others">Others (please specify)</option>
              </select>
            </div>
          </div>

          {formData.role === 'Others' && (
            <div className="form-group">
              <label htmlFor="customRole">Specify Your Role</label>
              <div className={getFieldClassName('customRole')}>
                <AddModeratorRoundedIcon className="input-icon" />
                <input
                  type="text"
                  id="customRole"
                  name="customRole"
                  value={formData.customRole}
                  onChange={handleChange}
                  placeholder="e.g., Manager, Supervisor"
                  required
                  className={notification.field === 'customRole' ? 'error-highlight' : ''}
                />
              </div>
            </div>
          )}

          {/* First Name and Last Name - now after email and role */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className={getFieldClassName('firstName')}>
                <PersonIcon className="input-icon" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                  className={notification.field === 'firstName' ? 'error-highlight' : ''}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className={getFieldClassName('lastName')}>
                <PersonIcon className="input-icon" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                  className={notification.field === 'lastName' ? 'error-highlight' : ''}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className={getFieldClassName('password')}>
              <LockIcon className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className={notification.field === 'password' ? 'error-highlight' : ''}
              />
            </div>
            <small className="password-hint">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={getFieldClassName('confirmPassword')}>
              <LockIcon className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className={notification.field === 'confirmPassword' ? 'error-highlight' : ''}
              />
            </div>
          </div>

          {passwordError && (
            <div className="password-errors">
              <ErrorIcon className="error-icon" fontSize="small" />
              <div className="error-message">{passwordError}</div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          <p>
            Already have an account?{' '}
            <span className="clickable-link" onClick={navigateToLogin}>
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;