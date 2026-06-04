import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Folder, Users, FileText, Trash2, X, AlertTriangle, 
  Edit3, Search, UserPlus, UserMinus 
} from 'lucide-react';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Project Form State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Project & Members State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Members list states for current project
  const [projectMembers, setProjectMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [memberActionError, setMemberActionError] = useState('');

  const { user, apiFetch, refreshUser } = useAuth();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError('Failed to fetch projects list');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while fetching projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      setCreateError('Project name is required');
      return;
      }

    try {
      setCreating(true);
      setCreateError('');
      const response = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();

      if (response.ok) {
        setName('');
        setDescription('');
        setShowModal(false);
        // Refresh project list
        setProjects([data, ...projects]);
        // Sync the user's new ADMIN role on the client-side
        await refreshUser();
      } else {
        setCreateError(data.error || 'Failed to create project');
      }
    } catch (err) {
      console.error(err);
      setCreateError('Network error during project creation');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the project "${projectName}"? All related tasks will be deleted permanently.`);
    if (!confirmDelete) return;

    try {
      const response = await apiFetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting project');
    }
  };

  // Open Edit Project Modal
  const openEditModal = async (project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditError('');
    setMemberActionError('');
    setSelectedUserToAdd('');
    setShowEditModal(true);

    // Fetch full project details (to get member list)
    try {
      const response = await apiFetch(`/api/projects/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error fetching project members:', err);
    }

    // Fetch all users in system for the dropdown (only if admin/owner)
    try {
      const response = await apiFetch('/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Error fetching system users:', err);
    }
  };

  // Handle Edit Project details submission
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editName) {
      setEditError('Project name is required');
      return;
    }

    try {
      setUpdating(true);
      setEditError('');
      const response = await apiFetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, description: editDescription })
      });

      const data = await response.json();

      if (response.ok) {
        // Update project card state
        setProjects(projects.map(p => p.id === editingProject.id ? { 
          ...p, 
          name: editName, 
          description: editDescription 
        } : p));
        setShowEditModal(false);
      } else {
        setEditError(data.error || 'Failed to update project details');
      }
    } catch (err) {
      console.error(err);
      setEditError('Network error during project update');
    } finally {
      setUpdating(false);
    }
  };

  // Add Member
  const handleAddMember = async () => {
    if (!selectedUserToAdd) return;
    setMemberActionError('');

    try {
      const response = await apiFetch(`/api/projects/${editingProject.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserToAdd })
      });

      const data = await response.json();

      if (response.ok) {
        // Re-fetch project members to sync
        const projRes = await apiFetch(`/api/projects/${editingProject.id}`);
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjectMembers(projData.members || []);
          // Sync count on main list
          setProjects(projects.map(p => p.id === editingProject.id ? {
            ...p,
            _count: { ...p._count, members: projData.members.length }
          } : p));
        }
        setSelectedUserToAdd('');
      } else {
        setMemberActionError(data.error || 'Failed to add member');
      }
    } catch (err) {
      console.error(err);
      setMemberActionError('Error adding member to project');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId) => {
    if (memberId === editingProject.ownerId) {
      setMemberActionError('Cannot remove the project owner.');
      return;
    }
    setMemberActionError('');

    try {
      const response = await apiFetch(`/api/projects/${editingProject.id}/members/${memberId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        // Update local members state
        const updatedMembers = projectMembers.filter(m => m.user.id !== memberId);
        setProjectMembers(updatedMembers);
        // Sync count on main list
        setProjects(projects.map(p => p.id === editingProject.id ? {
          ...p,
          _count: { ...p._count, members: updatedMembers.length }
        } : p));
      } else {
        setMemberActionError(data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
      setMemberActionError('Error removing member from project');
    }
  };

  // Filter out system users who are already members
  const unassignedUsers = allUsers.filter(
    user => !projectMembers.some(m => m.user.id === user.id)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', color: 'var(--text-muted)' }}>
          Retrieving projects archive...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="projects-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Project Workspace</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {user?.role === 'ADMIN' 
              ? 'Manage organization projects, configure access scopes, and audit tasks.' 
              : 'Browse active workspaces and task board pipelines you belong to.'}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {error && (
        <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '2rem' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Folder size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h3>No Projects Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {user?.role === 'ADMIN' 
              ? "You haven't created or joined any projects yet. Click 'New Project' to get started!"
              : "You are not assigned to any projects. Please contact your workspace administrator."}
          </p>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">Create Project</button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="glass-card project-card interactive">
              <div>
                <div className="flex-between">
                  <Link to={`/projects/${project.id}`} className="title">
                    {project.name}
                  </Link>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {(user?.role === 'ADMIN' || project.ownerId === user?.id) && (
                      <>
                        <button 
                          onClick={() => openEditModal(project)} 
                          className="btn btn-secondary btn-small" 
                          style={{ padding: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-dim)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          title="Edit Project & Members"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id, project.name)} 
                          className="btn btn-secondary btn-small" 
                          style={{ padding: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-dim)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="description">{project.description || 'No description provided.'}</p>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  Managed by: <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{project.owner?.name}</span>
                </div>
                
                <div className="project-meta">
                  <span className="flex-align-center">
                    <Users size={14} style={{ color: 'var(--primary)' }} />
                    {project._count?.members || 0} Members
                  </span>
                  <span className="flex-align-center">
                    <FileText size={14} style={{ color: 'var(--primary)' }} />
                    {project._count?.tasks || 0} Tasks
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name">Project Name</label>
                <input 
                  type="text" 
                  id="proj-name" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter project name..."
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea 
                  id="proj-desc" 
                  className="form-control" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Provide a description of the project workspace..."
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary animate-pulse-slow" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project & Members Management Modal */}
      {showEditModal && editingProject && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Project & Team</h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '0.5rem' }}>
              
              {/* Left Side: Edit Project Details Form */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Workspace Info
                </h4>
                <form onSubmit={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-proj-name">Project Name</label>
                    <input 
                      type="text" 
                      id="edit-proj-name" 
                      className="form-control" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      placeholder="Enter project name..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-proj-desc">Description</label>
                    <textarea 
                      id="edit-proj-desc" 
                      className="form-control" 
                      value={editDescription} 
                      onChange={(e) => setEditDescription(e.target.value)} 
                      placeholder="Provide a description..."
                      rows={5}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={updating}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={updating}>
                      {updating ? 'Updating...' : 'Save Details'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Manage Members Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Workspace Members
                </h4>

                {/* Add member sub-form */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <select 
                    className="form-control" 
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    <option value="">Select user to add...</option>
                    {unassignedUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={handleAddMember}
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    disabled={!selectedUserToAdd}
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                </div>

                {memberActionError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginBottom: '0.75rem', marginTop: '-0.25rem' }}>
                    {memberActionError}
                  </p>
                )}

                {/* Assigned members list */}
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                  {projectMembers.map(member => (
                    <div 
                      key={member.user.id} 
                      className="flex-between"
                      style={{ 
                        padding: '0.5rem', 
                        background: 'rgba(0,0,0,0.01)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {member.user.name} {member.user.id === editingProject.ownerId && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>(Owner)</span>}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{member.user.email}</span>
                      </div>
                      
                      {member.user.id !== editingProject.ownerId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.user.id)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                          title="Remove from project"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Projects;
