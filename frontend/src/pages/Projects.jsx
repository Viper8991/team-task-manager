import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Folder, Users, FileText, Trash2, X, AlertTriangle } from 'lucide-react';

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

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} />
          New Project
        </button>
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
            You haven't created or joined any projects yet. Click 'New Project' to get started!
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">Create Project</button>
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
                  {user?.role === 'ADMIN' && (
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
                  )}
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
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={20} /></button>
            </div>

            {createError && (
              <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projName">Project Name</label>
                <input
                  id="projName"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projDesc">Description (Optional)</label>
                <textarea
                  id="projDesc"
                  className="input-field"
                  placeholder="Describe the scope, objectives, and parameters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div className="flex-align-center" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
