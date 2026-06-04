import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Shield, Users } from 'lucide-react';

function Navbar() {
  const { user, logout, apiFetch } = useAuth();
  const location = useLocation();
  const [tasksPerUser, setTasksPerUser] = useState([]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchTasksPerUser = async () => {
        try {
          const response = await apiFetch('/api/tasks/dashboard');
          if (response.ok) {
            const data = await response.json();
            if (data.adminStats?.tasksPerUser) {
              setTasksPerUser(data.adminStats.tasksPerUser);
            }
          }
        } catch (err) {
          console.error('Error fetching sidebar tasks per user:', err);
        }
      };
      fetchTasksPerUser();
    }
  }, [user, location.pathname, apiFetch]);

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

        {user?.role === 'ADMIN' && tasksPerUser && tasksPerUser.length > 0 && (
          <div className="sidebar-tasks-per-user" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={14} style={{ color: 'var(--primary)' }} />
              Tasks per User
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {tasksPerUser.map(item => (
                <div key={item.id} className="flex-between" style={{ padding: '0.4rem 0.6rem', background: 'rgba(0, 0, 0, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{item.role}</span>
                  </div>
                  <span className="badge badge-todo" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 600, flexShrink: 0 }}>
                    {item.taskCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
