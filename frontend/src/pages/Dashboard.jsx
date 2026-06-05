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

  // Superadmin Role Assignment State
  const [pendingRoles, setPendingRoles] = useState([]);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('MEMBER');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const fetchPendingRoles = async () => {
    if (user?.role !== 'SUPERADMIN') return;
    try {
      const response = await apiFetch('/api/auth/pending-roles');
      if (response.ok) {
        const list = await response.json();
        setPendingRoles(list);
      }
    } catch (err) {
      console.error('Error fetching pending roles:', err);
    }
  };

  const handleAssignRole = async (e, directEmail = null, directRole = null) => {
    if (e) e.preventDefault();
    
    const emailToAssign = directEmail || assignEmail;
    const roleToAssign = directRole || assignRole;

    if (!emailToAssign) {
      setAssignError('Email is required');
      return;
    }

    try {
      setAssignError('');
      setAssignSuccess('');
      setAssignSubmitting(true);

      const response = await apiFetch('/api/auth/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToAssign, role: roleToAssign })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to assign role');
      }

      setAssignSuccess(resData.message || 'Successfully updated role assignment!');
      if (!directEmail) {
        setAssignEmail('');
      }

      // Re-fetch users and pending roles
      const usersResponse = await apiFetch('/api/auth/users');
      if (usersResponse.ok) {
        const usersList = await usersResponse.json();
        setSystemUsers(usersList);
      }
      await fetchPendingRoles();
    } catch (err) {
      console.error(err);
      setAssignError(err.message || 'Failed to assign role');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeletePendingRole = async (id) => {
    try {
      const response = await apiFetch(`/api/auth/pending-roles/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchPendingRoles();
      } else {
        const resData = await response.json();
        alert(resData.error || 'Failed to delete pending role assignment');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting pending role');
    }
  };

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
    setAssignError('');
    setAssignSuccess('');
    try {
      setLoadingUsers(true);
      const response = await apiFetch('/api/auth/users');
      if (response.ok) {
        const usersList = await response.json();
        setSystemUsers(usersList);
      }
      await fetchPendingRoles();
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
      {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && adminStats && (
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
            <div 
              className="glass-card stat-card interactive"
              onClick={() => navigate('/projects')}
              style={{ cursor: 'pointer' }}
              title="Click to view all projects"
            >
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
              <span className="label">Tasks Done</span>
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
          <span className="label">Done</span>
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
              {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
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
                    <span>{proj.completedTasks} / {proj.totalTasks} Tasks Done</span>
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

      {/* Users Modal */}
      {showUsersModal && (
        <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} style={{ color: 'var(--primary)' }} />
                Workspace Members
              </h3>
              <button onClick={() => setShowUsersModal(false)} className="modal-close"><X size={20} /></button>
            </div>

            {/* Role Assignment Form for SUPERADMIN */}
            {user?.role === 'SUPERADMIN' && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Assign Role by Email</h4>
                
                {assignError && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>{assignError}</div>
                )}
                {assignSuccess && (
                  <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.5rem' }}>{assignSuccess}</div>
                )}

                <form onSubmit={handleAssignRole} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    className="input-field"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    style={{ flex: 2, minWidth: '150px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', height: '34px' }}
                    required
                  />
                  <select
                    className="input-field"
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    style={{ flex: 1, minWidth: '100px', padding: '0.4rem', fontSize: '0.85rem', height: '34px' }}
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={assignSubmitting}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', height: '34px' }}
                  >
                    Assign
                  </button>
                </form>
              </div>
            )}
 
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading workspace members...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
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
                      {user?.role === 'SUPERADMIN' && u.role !== 'SUPERADMIN' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleAssignRole(null, u.email, e.target.value)}
                          className="input-field badge-small"
                          style={{
                            padding: '0.1rem 1.5rem 0.1rem 0.4rem',
                            fontSize: '0.7rem',
                            height: 'auto',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backgroundPosition: 'right 0.4rem center',
                            borderColor: 'transparent',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)'
                          }}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`badge ${u.role === 'SUPERADMIN' ? 'badge-superadmin' : (u.role === 'ADMIN' ? 'badge-admin' : 'badge-member')}`} style={{ fontSize: '0.7rem' }}>
                          {u.role}
                        </span>
                      )}
                      
                      {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
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

            {/* Pending Role Assignments Section for SUPERADMIN */}
            {user?.role === 'SUPERADMIN' && pendingRoles.length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-dim)' }}>Pending Role Assignments ({pendingRoles.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {pendingRoles.map(p => (
                    <div key={p.id} className="flex-between" style={{ padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.email}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Pre-assigned role</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${p.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}>
                          {p.role}
                        </span>
                        <button
                          onClick={() => handleDeletePendingRole(p.id)}
                          className="btn"
                          style={{ background: 'none', border: 'none', padding: '0.2rem', color: 'var(--text-dim)', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          title="Revoke Pre-assigned Role"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
