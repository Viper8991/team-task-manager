import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  
  // Forgot Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetPassword || !resetConfirmPassword) {
      setResetError('Please fill in all fields');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-zA-Z]/.test(resetPassword) || !/\d/.test(resetPassword) || !/[^a-zA-Z0-9]/.test(resetPassword)) {
      setResetError('Password must contain letters, numbers, and symbols');
      return;
    }

    try {
      setResetError('');
      setResetSuccess('');
      setResetSubmitting(true);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password: resetPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess('Password reset successful! You can now log in.');
      setResetEmail('');
      setResetPassword('');
      setResetConfirmPassword('');
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
      }, 3000);
    } catch (err) {
      setResetError(err.message || 'Something went wrong');
    } finally {
      setResetSubmitting(false);
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
                type={showPassword ? 'text' : 'password'}
                className="input-field full-width"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowResetModal(true);
                setResetError('');
                setResetSuccess('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-light)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary full-width"
            style={{ marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one here</Link>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', width: '100%', margin: '0 1rem' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="modal-close"
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {resetError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="reset-email">Registered Email</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
                  <input
                    id="reset-email"
                    type="email"
                    className="input-field full-width"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ paddingLeft: '2.8rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="reset-password">New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
                  <input
                    id="reset-password"
                    type={showResetPassword ? 'text' : 'password'}
                    className="input-field full-width"
                    placeholder="Min. 8 chars (letters, numbers, symbols)"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
                  <input
                    id="reset-confirm-password"
                    type={showResetPassword ? 'text' : 'password'}
                    className="input-field full-width"
                    placeholder="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetSubmitting}
                >
                  {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
