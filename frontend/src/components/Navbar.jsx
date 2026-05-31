import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, User, Shield } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', color: 'var(--primary)' }}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Team Task Manager
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/projects" className={`nav-link ${isActive('/projects') ? 'active' : ''}`}>
          <FolderKanban size={18} />
          Projects
        </Link>
      </div>

      <div className="nav-profile">
        <div className="flex-align-center">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</span>
            <div className="flex-align-center gap-2" style={{ marginTop: '0.1rem' }}>
              <span className={`badge badge-small ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                {user?.role === 'ADMIN' ? (
                  <span className="flex-align-center" style={{ gap: '2px' }}>
                    <Shield size={10} />
                    Admin
                  </span>
                ) : 'Member'}
              </span>
            </div>
          </div>
        </div>

        <button onClick={logout} className="btn btn-secondary btn-small" title="Sign Out" style={{ marginLeft: '1rem', padding: '0.4rem' }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
