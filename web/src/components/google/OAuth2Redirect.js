import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/OAuth2Redirect.css';

function OAuth2Redirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const firstName = params.get('firstName');
    const lastName = params.get('lastName');
    const picture = params.get('picture');

    if (email) {
      // Create user object
      const user = {
        email,
        firstName,
        lastName,
        picture,
        authProvider: 'GOOGLE'
      };

      // Store in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(user));

      // Call backend to complete login
      fetch('http://localhost:8080/api/auth/oauth2/success', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('OAuth2 login failed');
          }
          return response.json();
        })
        .then(data => {
          // Update user with backend data
          const updatedUser = { ...user, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('OAuth2 login error:', error);
          navigate('/login?error=oauth2_failed');
        });
    } else {
      navigate('/login?error=oauth2_failed');
    }
  }, [location, navigate]);

  return (
    <div className="oauth2-redirect-container">
      <div className="oauth2-redirect-box">
        <div className="loading-spinner"></div>
        <h3>Completing Google Login...</h3>
        <p>Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
}

export default OAuth2Redirect;