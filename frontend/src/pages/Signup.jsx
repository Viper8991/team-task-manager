import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertTriangle } from 'lucide-react';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <UserPlus size={28} />
          </div>
          <h2>Create Workspace Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Join the workspace and collaborate on projects
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
            <label htmlFor="name">Full Name</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
              <input
                id="name"
                type="text"
                className="input-field full-width"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
              <input
                id="email"
                type="email"
                className="input-field full-width"
                placeholder="john@example.com"
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
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-dim)' }} />
              <input
                id="confirmPassword"
                type="password"
                className="input-field full-width"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {submitting ? 'Creating Profile...' : 'Register'}
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
