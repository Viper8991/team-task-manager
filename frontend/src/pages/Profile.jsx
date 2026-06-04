import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Mail, User, Clock, CheckCircle, ClipboardList, 
  Play, FolderOpen, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await apiFetch('/api/tasks/dashboard');
        if (response.ok) {
          const resData = await response.json();
          setData(resData);
        } else {
          setError('Failed to load profile statistics.');
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('An error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [apiFetch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Loading Profile Details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
        {error}
      </div>
    );
  }

  const { personalStats, projectsOverview } = data || {
    personalStats: { totalTasks: 0, todoCount: 0, inProgressCount: 0, completedCount: 0, overdueCount: 0 },
    projectsOverview: []
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Account Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage your credentials, role privileges, and task statistics.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Personal Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div 
              className="avatar-circle" 
              style={{ 
                width: '80px', 
                height: '80px', 
                fontSize: '2.5rem', 
                margin: '0 auto 1.5rem auto',
                background: 'linear-gradient(135deg, var(--primary) 0%, hsl(290, 80%, 50%) 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {user?.name}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {user?.role === 'ADMIN' ? (
                  <span className="flex-align-center" style={{ gap: '4px' }}>
                    <Shield size={12} />
                    System Admin
                  </span>
                ) : 'Workspace Member'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Mail size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={user?.email}>
                  {user?.email}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                <Clock size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  Status: <span style={{ color: 'var(--color-completed)', fontWeight: 600 }}>Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics and Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Personal Task Stats Grid */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
              My Performance Summary
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', display: 'block' }}>{personalStats.totalTasks}</span>
              </div>
              <div style={{ background: 'var(--color-todo-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-todo)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Do</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-todo)', marginTop: '0.25rem', display: 'block' }}>{personalStats.todoCount}</span>
              </div>
              <div style={{ background: 'var(--color-progress-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-progress)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-progress)', marginTop: '0.25rem', display: 'block' }}>{personalStats.inProgressCount}</span>
              </div>
              <div style={{ background: 'var(--color-completed-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-completed)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-completed)', marginTop: '0.25rem', display: 'block' }}>{personalStats.completedCount}</span>
              </div>
            </div>

            {personalStats.overdueCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <Clock size={16} />
                <span>You have <strong>{personalStats.overdueCount}</strong> overdue task{personalStats.overdueCount === 1 ? '' : 's'}. Please review and update their schedules.</span>
              </div>
            )}
          </div>

          {/* Active Projects Membership */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderOpen size={18} style={{ color: 'var(--primary)' }} />
              My Workspace Projects ({projectsOverview.length})
            </h3>

            {projectsOverview.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                You are not currently enrolled in any projects.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projectsOverview.map(proj => (
                  <div key={proj.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{proj.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {proj.percentComplete}% Complete
                      </span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${proj.percentComplete}%` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>{proj.completedTasks} of {proj.totalTasks} Tasks Done</span>
                      <Link to={`/projects/${proj.id}`} style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Go to Board <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;
