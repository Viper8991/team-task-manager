import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertTriangle, Eye, EyeOff, ArrowRight } from 'lucide-react';

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

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must contain letters, numbers, and symbols');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try a different email.');
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
          <h2>Create Workspace Account</h2>
          <p className="subtitle">Join the workspace and collaborate on projects</p>
        </div>

        {error && (
          <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-container">
              <User size={18} className="input-icon-left" />
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <Mail size={18} className="input-icon-left" />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
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
                placeholder="Min. 8 chars (letters, numbers, symbols)"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon-left" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-continue"
            disabled={submitting}
            style={{ marginTop: '1.5rem' }}
          >
            <span>{submitting ? 'Creating Profile...' : 'Register'}</span>
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
