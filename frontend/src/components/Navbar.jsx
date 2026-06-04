import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, FolderKanban, LogOut, Shield, Users, 
  Bell, ChevronDown, ChevronRight, Check, CheckCheck, Trash2 
} from 'lucide-react';

function Navbar() {
  const { user, logout, apiFetch } = useAuth();
  const location = useLocation();
  
  // Teams Accordion State
  const [teams, setTeams] = useState([]);
  const [expandedAdmins, setExpandedAdmins] = useState({});

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch Admins & Members list
  const fetchTeams = async () => {
    try {
      const response = await apiFetch('/api/auth/admins-members');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Error fetching teams list:', err);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const response = await apiFetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchNotifications();

    // Poll for notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [location.pathname, apiFetch]);

  const toggleAdmin = (adminId) => {
    setExpandedAdmins(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

  const handleMarkRead = async (id) => {
    try {
      const response = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (response.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      const response = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

        {/* Live Notifications Panel Trigger */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`sidebar-link ${showNotifications ? 'active' : ''}`}
            style={{ 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              color: 'var(--text-muted)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={20} />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span 
                className="badge" 
                style={{ 
                  fontSize: '0.65rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '10px', 
                  background: 'var(--color-danger)', 
                  color: 'white', 
                  fontWeight: 700 
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notifications Card */}
          {showNotifications && (
            <div 
              className="glass-card" 
              style={{ 
                position: 'absolute', 
                left: '105%', 
                bottom: '-50px', 
                width: '320px', 
                zIndex: 1000, 
                maxHeight: '380px', 
                overflowY: 'auto', 
                padding: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem', 
                boxShadow: '0 12px 30px rgba(0,0,0,0.25)', 
                border: '1px solid var(--border-color)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--primary)', 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '2px',
                      fontWeight: 600
                    }}
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  No notifications yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.25rem', 
                        padding: '0.6rem', 
                        background: notif.read ? 'rgba(0,0,0,0.01)' : 'rgba(139, 92, 246, 0.04)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)', 
                        position: 'relative' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: notif.read ? 'var(--text-muted)' : 'var(--text-main)', paddingRight: '1rem' }}>
                          {notif.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'absolute', right: '4px', top: '4px' }}>
                          {!notif.read && (
                            <button 
                              onClick={() => handleMarkRead(notif.id)} 
                              title="Mark as Read" 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px' }}
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteNotif(notif.id)} 
                            title="Delete" 
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingRight: '1.5rem', lineHeight: '1.2' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Teams Accordion */}
        {teams && teams.length > 0 && (
          <div className="sidebar-tasks-per-user" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={14} style={{ color: 'var(--primary)' }} />
              Workspace Teams
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {teams.map(admin => {
                const isExpanded = !!expandedAdmins[admin.id];
                return (
                  <div 
                    key={admin.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.25rem', 
                      background: 'rgba(0, 0, 0, 0.01)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '0.4rem 0.6rem' 
                    }}
                  >
                    <div 
                      className="flex-between pointer" 
                      onClick={() => toggleAdmin(admin.id)} 
                      style={{ userSelect: 'none' }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={admin.name}>
                        {admin.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0.25rem 0', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Members:</span>
                        <Link 
                          to={`/admin-team/${admin.id}`}
                          style={{ 
                            background: 'var(--primary-bg)', 
                            color: 'var(--primary)', 
                            fontWeight: 750, 
                            padding: '0.1rem 0.5rem', 
                            borderRadius: '10px', 
                            textDecoration: 'none',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          {admin.memberCount}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-profile">
        <Link 
          to="/profile" 
          className={`profile-details-link ${isActive('/profile') ? 'active' : ''}`}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            textDecoration: 'none', 
            padding: '0.5rem', 
            borderRadius: 'var(--radius-md)', 
            transition: 'all var(--transition-fast)',
            cursor: 'pointer',
            width: '100%',
            color: 'inherit'
          }}
        >
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info" style={{ textAlign: 'left' }}>
            <span className="profile-name" style={{ display: 'block' }}>{user?.name}</span>
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
        </Link>

        <button onClick={logout} className="btn btn-secondary btn-logout" title="Sign Out">
          <LogOut size={16} />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
