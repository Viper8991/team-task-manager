import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertTriangle } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card animate-pulse-slow-disabled">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <LogIn size={28} />
          </div>
          <h2>Access Workspace</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Sign in to manage tasks and projects
          </p>
        </div>

        {error && (
          <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
              <input
                id="email"
                type="email"
                className="input-field full-width"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
              <input
                id="password"
                type="password"
                className="input-field full-width"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary full-width"
            style={{ marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
