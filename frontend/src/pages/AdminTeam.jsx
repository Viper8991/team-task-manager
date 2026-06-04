import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Mail, Calendar, ArrowLeft, ClipboardList } from 'lucide-react';

function AdminTeam() {
  const { adminId } = useParams();
  const { apiFetch } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const response = await apiFetch('/api/auth/admins-members');
        if (response.ok) {
          const data = await response.json();
          const selectedAdmin = data.find(item => item.id === adminId);
          if (selectedAdmin) {
            setAdminData(selectedAdmin);
          } else {
            setError('Admin team details not found.');
          }
        } else {
          setError('Failed to fetch team data.');
        }
      } catch (err) {
        console.error('Error fetching team details:', err);
        setError('An error occurred while loading team information.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetails();
  }, [adminId, apiFetch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', color: 'var(--text-muted)' }}>
          Retrieving workspace team roster...
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem', width: 'fit-content' }}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="avatar-circle" style={{ width: '64px', height: '64px', fontSize: '1.8rem', background: 'linear-gradient(135deg, var(--primary) 0%, hsl(290, 80%, 55%) 100%)', color: 'white' }}>
          {adminData.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="badge badge-admin" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', marginBottom: '0.4rem', display: 'inline-block' }}>
            <span className="flex-align-center" style={{ gap: '2px' }}>
              <Shield size={10} />
              Team Manager / Admin
            </span>
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{adminData.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={14} />
            {adminData.email}
          </p>
        </div>
      </div>

      {/* Members table card */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Users size={20} style={{ color: 'var(--primary)' }} />
          Assigned Team Members ({adminData.members.length})
        </h3>

        {adminData.members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No members are currently assigned to this manager's projects.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Member Info</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>System Role</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tasks Count</th>
                </tr>
              </thead>
              <tbody>
                {adminData.members.map(member => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '1rem', flexShrink: 0 }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{member.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-member" style={{ fontSize: '0.7rem' }}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 500 }}>
                        <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
                        {member.taskCount} task{member.taskCount === 1 ? '' : 's'} assigned
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTeam;
