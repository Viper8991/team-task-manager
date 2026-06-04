import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, CheckCircle, Clock, AlertCircle, 
  Folder, Users, FileText, ChevronRight, Play, Calendar, X, Key
} from 'lucide-react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Admin Reset Password State
  const [targetResetUser, setTargetResetUser] = useState(null);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!targetResetUser || !resetNewPassword) {
      setResetError('Password is required');
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-zA-Z]/.test(resetNewPassword) || !/\d/.test(resetNewPassword) || !/[^a-zA-Z0-9]/.test(resetNewPassword)) {
      setResetError('Password must contain letters, numbers, and symbols');
      return;
    }

    try {
      setResetError('');
      setResetSuccess('');
      setResetSubmitting(true);

      const response = await apiFetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetResetUser.id, newPassword: resetNewPassword })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to reset password');
      }

      setResetSuccess(`Password for ${targetResetUser.name} reset successfully!`);
      setResetNewPassword('');
      setTimeout(() => {
        setShowResetPrompt(false);
        setTargetResetUser(null);
        setResetSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleOpenUsersModal = async () => {
    setShowUsersModal(true);
    try {
      setLoadingUsers(true);
      const response = await apiFetch('/api/auth/users');
      if (response.ok) {
        const usersList = await response.json();
        setSystemUsers(usersList);
      }
    } catch (err) {
      console.error('Error fetching system users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/tasks/dashboard');
      if (response.ok) {
        const stats = await response.json();
        setData(stats);
      } else {
        setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while communicating with the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', color: 'var(--text-muted)' }}>
          Assembling your metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-danger" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', margin: '2rem auto', maxWidth: '500px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
        <h3>Error Accessing Dashboard</h3>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const { personalStats, projectsOverview, adminStats } = data;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, {user?.name}!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Here is the status of your team tasks and active projects.
          </p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <Folder size={18} />
          View Projects
        </Link>
      </div>

      {/* Admin Panel Metrics */}
      {user?.role === 'ADMIN' && adminStats && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            System-Wide Statistics (Admin View)
          </h3>
          <div className="dashboard-grid">
            <div 
              className="glass-card stat-card interactive" 
              onClick={handleOpenUsersModal}
              style={{ cursor: 'pointer' }}
              title="Click to view workspace users"
            >
              <span className="label">Total System Users</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="value">{adminStats.totalUsers}</span>
                <Users size={28} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              </div>
            </div>
            <div className="glass-card stat-card interactive">
              <span className="label">Total Projects</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="value">{adminStats.totalProjects}</span>
                <Folder size={28} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              </div>
            </div>
            <div className="glass-card stat-card interactive">
              <span className="label">Total Tasks</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="value">{adminStats.totalTasks}</span>
                <FileText size={28} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              </div>
            </div>
            <div className="glass-card stat-card interactive">
              <span className="label">Completed Tasks</span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="value">{adminStats.statusBreakdown.COMPLETED}</span>
                <CheckCircle size={28} style={{ color: 'var(--color-completed)', opacity: 0.7 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Assignment Metrics */}
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
        My Tasks Overview
      </h3>
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <span className="label">My Assigned Tasks</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="value">{personalStats.totalTasks}</span>
            <ClipboardList size={28} style={{ color: 'var(--color-todo)', opacity: 0.7 }} />
          </div>
        </div>
        <div className="glass-card stat-card">
          <span className="label">In Progress</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="value">{personalStats.inProgressCount}</span>
            <Play size={28} style={{ color: 'var(--color-progress)', opacity: 0.7 }} />
          </div>
        </div>
        <div className="glass-card stat-card">
          <span className="label">Completed</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="value">{personalStats.completedCount}</span>
            <CheckCircle size={28} style={{ color: 'var(--color-completed)', opacity: 0.7 }} />
          </div>
        </div>
        <div className={`glass-card stat-card ${personalStats.overdueCount > 0 ? 'overdue' : ''}`}>
          <span className="label">Overdue Tasks</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="value">{personalStats.overdueCount}</span>
            <Clock size={28} style={{ color: personalStats.overdueCount > 0 ? 'var(--color-danger)' : 'var(--text-dim)', opacity: 0.7 }} />
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Left column: Projects progress and Overdue alarms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Overdue Alert Widget */}
          {personalStats.overdueCount > 0 && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '1.1rem' }}>
                <AlertCircle size={20} />
                Action Required: Overdue Tasks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {personalStats.overdueTasks.map(task => (
                  <div key={task.id} className="flex-between" style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{task.title}</span>
                    <span className="flex-align-center text-danger" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      <Calendar size={14} />
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Progress tracking */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Active Projects Progress</h3>
            {projectsOverview.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                You are not associated with any active projects.
                {user?.role === 'ADMIN' && (
                  <div style={{ marginTop: '1rem' }}>
                    <Link to="/projects" className="btn btn-secondary btn-small">Create your first Project</Link>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {projectsOverview.map(proj => (
                  <div 
                    key={proj.id} 
                    className="pointer" 
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', transition: 'border-color var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-color-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Folder size={16} style={{ color: 'var(--primary)' }} />
                        {proj.name}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {proj.percentComplete}%
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${proj.percentComplete}%` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <span>{proj.completedTasks} / {proj.totalTasks} Tasks Completed</span>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        View Board <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick Profile / Task focus */}
        <div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>My Profile Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem' }}>{user?.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</span>
                </div>
              </div>
              
              <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Access Role</span>
                <span className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                  {user?.role}
                </span>
              </div>
              <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Working Status</span>
                <span className="flex-align-center" style={{ color: 'var(--color-completed)', fontWeight: 600 }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-completed)' }}></span>
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Admin: Tasks per User Widget */}
          {user?.role === 'ADMIN' && adminStats?.tasksPerUser && (
            <div className="glass-card" style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                Tasks per User
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {adminStats.tasksPerUser.map(item => (
                  <div key={item.id} className="flex-between" style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.role}</span>
                    </div>
                    <span className="badge badge-todo" style={{ fontWeight: 700 }}>
                      {item.taskCount} {item.taskCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} style={{ color: 'var(--primary)' }} />
                Workspace Members
              </h3>
              <button onClick={() => setShowUsersModal(false)} className="modal-close"><X size={20} /></button>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading workspace members...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {systemUsers.map(u => (
                  <div key={u.id} className="flex-between" style={{ padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.9rem', flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`} style={{ fontSize: '0.7rem' }}>
                        {u.role}
                      </span>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setTargetResetUser(u);
                            setShowResetPrompt(true);
                            setResetNewPassword('');
                            setResetError('');
                            setResetSuccess('');
                          }}
                          className="btn btn-secondary btn-small"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'fit-content' }}
                          title="Reset user password"
                        >
                          <Key size={12} />
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowUsersModal(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Password Reset Modal */}
      {showResetPrompt && targetResetUser && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px', width: '100%', margin: '0 1rem' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset User Password</h3>
              <button 
                onClick={() => {
                  setShowResetPrompt(false);
                  setTargetResetUser(null);
                }} 
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Resetting password for: <strong style={{ color: 'var(--text-main)' }}>{targetResetUser.name}</strong> ({targetResetUser.email})
              </p>
            </div>

            {resetError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminResetPassword}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="admin-new-password">New Password</label>
                <input
                  id="admin-new-password"
                  type="text"
                  className="input-field full-width"
                  placeholder="Enter temporary password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                  Must be at least 8 characters and contain letters, numbers, and symbols.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPrompt(false);
                    setTargetResetUser(null);
                  }}
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
                  {resetSubmitting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
