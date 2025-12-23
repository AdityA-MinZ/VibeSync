import { useState } from 'react';
import api from '../api';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Logging in...');

    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      setStatus('Login successful');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;
      setStatus('Error: ' + msg);
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit">Log in</button>
      </form>
      {status && <p style={{ marginTop: '0.75rem' }}>{status}</p>}
    </div>
  );
}

export default LoginForm;
