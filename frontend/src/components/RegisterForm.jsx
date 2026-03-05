import React, { useState } from 'react';
import { register } from '../services/authService';

function RegisterForm({ onRegister, onBack }) {
  console.log('RegisterForm props:', { onRegister, onBack }); // Debug props
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register form submitted'); // Debug log
    console.log('Username:', username); // Debug username
    console.log('Email:', email); // Debug email
    console.log('Password:', password); // Debug password
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting registration...'); // Debug log
      const result = await register(username, email, password);
      console.log('Registration result:', result); // Debug result
      onRegister(result.user);
      console.log('Registration successful'); // Debug success
    } catch (error) {
      console.log('Registration error:', error); // Debug error
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      console.log('Registration process completed'); // Debug completion
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="registerUsername">Username</label>
          <input
            type="text"
            id="registerUsername"
            placeholder="your handle"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="registerEmail">Email</label>
          <input
            type="email"
            id="registerEmail"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="registerPassword">Password</label>
          <input
            type="password"
            id="registerPassword"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      {onBack && (
        <button type="button" className="btn-submit btn-back" onClick={() => {console.log('Register Back button clicked'); onBack();}}>
          Back
        </button>
      )}
    </div>
  );
}

export default RegisterForm;
