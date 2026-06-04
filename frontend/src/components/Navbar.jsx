import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Shield } from 'lucide-react';

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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="nav-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', color: 'var(--primary)', flexShrink: 0 }}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="nav-title">Team Task Manager</span>
            <span className="brand-subtitle">for Ethara AI</span>
          </div>
        </Link>
      </div>

      <div className="sidebar-links">
        <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/projects" className={`sidebar-link ${isActive('/projects') ? 'active' : ''}`}>
          <FolderKanban size={20} />
          <span>Projects</span>
        </Link>
      </div>

      <div className="sidebar-profile">
        <div className="profile-details">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <span className="profile-name">{user?.name}</span>
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

        <button onClick={logout} className="btn btn-secondary btn-logout" title="Sign Out">
          <LogOut size={16} />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
