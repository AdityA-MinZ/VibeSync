import { useState } from 'react';
import api from '../api';

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Creating account...');

    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
      });
      setStatus(res.data.message || 'Registration successful');
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
      <h2>Register</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your handle"
            required
          />
        </label>

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
            placeholder="choose a strong password"
            required
          />
        </label>

        <button type="submit">Create account</button>
      </form>
      {status && <p style={{ marginTop: '0.75rem' }}>{status}</p>}
    </div>
  );
}

export default RegisterForm;
