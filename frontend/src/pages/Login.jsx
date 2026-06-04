import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertTriangle, Eye, EyeOff, X, ShieldAlert, ArrowRight } from 'lucide-react';

// Stylized Ethara AI Logo Component
const EtharaLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(50, 50)">
      {[30, 90, 150, 210, 270, 330].map((angle) => (
        <path
          key={angle}
          d="M 0,-8 C -7,-8 -12,-18 -12,-28 C -12,-38 -6,-44 0,-44 C 6,-44 12,-38 12,-28 C 12,-18 7,-8 0,-8 Z"
          fill="#6366f1"
          transform={`rotate(${angle})`}
        />
      ))}
    </g>
  </svg>
);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  
  // Forgot Password Notice Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  
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
      <div className="auth-card">
        <div className="auth-header">
          {/* Logo container matching screenshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <EtharaLogo size={34} />
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1e1b4b', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>Ethara AI</span>
          </div>
          <h2>Welcome to <span className="purple-text">Ethara AI</span></h2>
          <p className="subtitle">Sign in to access your workspace</p>
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
            <div className="input-container">
              <Mail size={18} className="input-icon-left" />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon-left" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="forgot-password-link"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-continue"
            disabled={submitting}
          >
            <span>{submitting ? 'Please wait...' : 'Continue'}</span>
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="divider-container">
          <span className="divider-text">OR</span>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one here</Link>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '420px', width: '100%', margin: '0 1rem', padding: '1.75rem' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <button
                onClick={() => setShowResetModal(false)}
                className="modal-close"
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '-1rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '1.25rem' }}>
                <ShieldAlert size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem' }}>Contact Administrator</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                For security reasons, self-service password resets are disabled. 
                <br /><br />
                Please reach out to your **Workspace Administrator** to reset your account password. They can change it for you directly from the Workspace Members panel.
              </p>
              
              <button 
                onClick={() => setShowResetModal(false)} 
                className="btn btn-primary full-width"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
