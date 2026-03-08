import React, { useState } from 'react';
import { login } from '../services/authService';

function LoginForm({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted'); // Debug log
    console.log('Email:', email); // Debug email
    console.log('Password:', password); // Debug password
    setError('');
    setLoading(true);

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      console.log('Email validation failed'); // Debug log
      return;
    }

    try {
      console.log('Attempting login...'); // Debug log
      const result = await login(email, password);
      console.log('Login result:', result); // Debug result
      onLogin(result); // Pass full result (includes token and user)
      console.log('Login successful'); // Debug success
    } catch (error) {
      console.log('Login error:', error); // Debug error
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      console.log('Login process completed'); // Debug completion
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-form-title">Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="loginEmail">Email</label>
          <input
            type="email"
            id="loginEmail"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
          />
          {emailError && <span className="field-error">{emailError}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="loginPassword">Password</label>
          <input
            type="password"
            id="loginPassword"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      {onBack && (
        <button type="button" className="btn-submit btn-back" onClick={() => {console.log('Back button clicked'); onBack();}}>
          Back
        </button>
      )}
    </div>
  );
}

export default LoginForm;
