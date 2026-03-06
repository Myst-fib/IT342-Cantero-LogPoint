import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import AddModeratorRoundedIcon from '@mui/icons-material/AddModeratorRounded';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Clear customRole if not selecting "Others"
      ...(name === 'role' && value !== 'Others' && { customRole: '' }),
    }));
    
    // Clear password error when user starts typing
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    setPasswordError('Passwords do not match');
    return;
  }

  if (formData.password.length < 6) {
    setPasswordError('Password must be at least 6 characters');
    return;
  }

  // Validate role is selected
  if (!formData.role) {
    alert('Please select a role');
    return;
  }

  // Validate custom role if Others is selected
  if (formData.role === 'Others' && !formData.customRole.trim()) {
    alert('Please specify your role');
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role === 'Others' ? formData.customRole : formData.role,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      alert(error);
      return;
    }

    alert("Registration successful!");
    navigate("/login");

  } catch (error) {
    console.error("Registration error:", error);
    alert("Server error. Try again.");
  }
};


  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className='input-with-icon'>
              <EmailIcon className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className="input-with-icon">
              <AddModeratorRoundedIcon className="input-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-select"
                required
              >
                <option value="">Select a role</option>
                <option value="Office Administrators">Office Administrators</option>
                <option value="Security Guards">Security Guards</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          {formData.role === 'Others' && (
            <div className="form-group">
              <label htmlFor="customRole">Specify Your Role</label>
              <div className="input-with-icon">
                <AddModeratorRoundedIcon className="input-icon" />
                <input
                  type="text"
                  id="customRole"
                  name="customRole"
                  value={formData.customRole}
                  onChange={handleChange}
                  placeholder="Enter your role"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-with-icon">
                <PersonIcon className="input-icon" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className="input-with-icon">
                <PersonIcon className="input-icon" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
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
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <LockIcon className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {passwordError && (
            <div className="password-errors">
              <div className="error-message">{passwordError}</div>
            </div>
          )}

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>

        <div className="login-link">
          <p>
            Already have an account?{' '}
            <span className="clickable-link" onClick={navigateToLogin}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
