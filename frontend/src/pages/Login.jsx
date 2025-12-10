import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ identifier: email, password });
      const role = res?.data?.user?.role || res?.user?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setError(apiError || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>
            Email or Username
            <input
              style={styles.input}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="you@example.com or yourusername"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="********"
            />
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>New here?</span>{' '}
          <Link to="/register" style={styles.link}>
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Login;

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fb',
    padding: '32px 16px 48px',
    color: '#1f2937',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
  },
  header: {
    marginBottom: '18px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
    color: '#374151',
  },
  input: {
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#111827',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'none',
  },
  button: {
    height: '46px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    boxShadow: '0 10px 30px rgba(239,68,68,0.25)',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecdd3',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
  },
  footer: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#4b5563',
  },
  link: {
    color: '#dc2626',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
