import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Folder, Users, Plus, Trash2, Calendar, Edit3, CheckSquare, 
  UserPlus, X, AlertTriangle, AlertCircle, Info, ChevronLeft, Shield
} from 'lucide-react';

function ProjectDetails() {
  const { id } = useParams();
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]); // All users in DB (to add to project)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals and Forms
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // If editing a task, holds the task object. If null, we are creating.
  
  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [assignToAll, setAssignToAll] = useState(false); // Bulk assign state

  // Member Management Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch project details
      const projResponse = await apiFetch(`/api/projects/${id}`);
      if (!projResponse.ok) {
        if (projResponse.status === 403) {
          setError('Access denied: You are not a member of this project');
        } else {
          setError('Failed to fetch project details');
        }
        return;
      }
      
      const projData = await projResponse.json();
      setProject(projData);

      // If user is Admin, fetch system users list to allow adding them as members
      if (user.role === 'ADMIN') {
        const usersResponse = await apiFetch('/api/auth/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setSystemUsers(usersData);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading workspace details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Open task modal for CREATE
  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskStatus('TODO');
    setTaskDueDate('');
    setTaskAssigneeId('');
    setTaskError('');
    setAssignToAll(false);
    setShowTaskModal(true);
  };

  // Open task modal for EDIT
  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
    setTaskAssigneeId(task.assigneeId || '');
    setTaskError('');
    setAssignToAll(false);
    setShowTaskModal(true);
  };

  // Submit Task (Create or Edit)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle) {
      setTaskError('Task title is required');
      return;
    }

    try {
      setTaskSubmitting(true);
      setTaskError('');

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      const body = {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null,
        projectId: id,
        assigneeId: assignToAll ? null : (taskAssigneeId || null),
        assignToAll: editingTask ? false : assignToAll
      };

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setShowTaskModal(false);
        // Refresh project data
        fetchData();
      } else {
        setTaskError(data.error || 'Failed to submit task');
      }
    } catch (err) {
      console.error(err);
      setTaskError('Network error while processing task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Quick Task Status Switch (Accessible by Assignee or Admin)
  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const response = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Optimistic UI update or full refetch
        setProject(prev => {
          const updatedTasks = prev.tasks.map(t => {
            if (t.id === taskId) {
              return { ...t, status: newStatus };
            }
            return t;
          });
          return { ...prev, tasks: updatedTasks };
        });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update task status');
        fetchData(); // Reset layout state
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating status');
    }
  };

  // Delete Task (Admin only)
  const handleDeleteTask = async (taskId, taskTitle) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the task "${taskTitle}"?`);
    if (!confirmDelete) return;

    try {
      const response = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== taskId)
        }));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting task');
    }
  };

  // Add Member (Admin only)
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMemberError('Select a user to add');
      return;
    }

    try {
      setMemberSubmitting(true);
      setMemberError('');

      const response = await apiFetch(`/api/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId })
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedUserId('');
        fetchData(); // Reload details and members list
      } else {
        setMemberError(data.error || 'Failed to add member');
      }
    } catch (err) {
      console.error(err);
      setMemberError('Network error adding member');
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Remove Member (Admin only)
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (memberUserId === project.ownerId) return; // Prevent removing owner

    const confirmRemove = window.confirm(`Remove "${memberName}" from this project? They will be unassigned from all tasks in this project.`);
    if (!confirmRemove) return;

    try {
      const response = await apiFetch(`/api/projects/${id}/members/${memberUserId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData(); // Reload project to update members list and task assignees
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
      alert('Network error removing member');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', color: 'var(--text-muted)' }}>
          Syncing workspace pipeline...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-danger" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', margin: '2rem auto', maxWidth: '500px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
        <h3>Access Conflict</h3>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{error}</p>
        <Link to="/projects" className="btn btn-primary">Return to Projects</Link>
      </div>
    );
  }

  if (!project) return null;

  // Kanban task breakdown
  const tasksByColumn = {
    TODO: project.tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS'),
    REVIEW: project.tasks.filter(t => t.status === 'REVIEW'),
    COMPLETED: project.tasks.filter(t => t.status === 'COMPLETED')
  };

  const totalTasks = project.tasks.length;
  const completedTasks = tasksByColumn.COMPLETED.length;
  const percentComplete = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Filter out system users who are already project members
  const memberUserIds = project.members.map(m => m.userId);
  const potentialNewMembers = systemUsers.filter(u => !memberUserIds.includes(u.id));

  return (
    <div>
      {/* Upper Navigation and Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/projects" className="flex-align-center" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1rem', width: 'fit-content' }}>
          <ChevronLeft size={16} /> Back to Projects
        </Link>

        <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="flex-align-center" style={{ gap: '0.5rem' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>{project.name}</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', maxWidth: '800px', lineHeight: 1.5 }}>
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {user.role === 'ADMIN' && (
            <button onClick={openCreateTaskModal} className="btn btn-primary">
              <Plus size={18} />
              Create Task
            </button>
          )}
        </div>

        {/* Project progress summary banner */}
        <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '150px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--primary)' }}>{percentComplete}%</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="progress-bar-container" style={{ height: '8px' }}>
              <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>{completedTasks} of {totalTasks} Tasks completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Split main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
        
        {/* Kanban Board Container */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Task Board</h2>
          
          <div className="board-columns">
            
            {/* COLUMN: TODO */}
            <div className="board-column">
              <div className="column-header todo">
                <span className="column-title"><CheckSquare size={16} style={{ color: 'var(--color-todo)' }} /> To Do</span>
                <span className="column-count">{tasksByColumn.TODO.length}</span>
              </div>
              <div className="column-tasks">
                {tasksByColumn.TODO.map(task => renderTaskCard(task))}
              </div>
            </div>

            {/* COLUMN: IN PROGRESS */}
            <div className="board-column">
              <div className="column-header progress">
                <span className="column-title"><CheckSquare size={16} style={{ color: 'var(--color-progress)' }} /> In Progress</span>
                <span className="column-count">{tasksByColumn.IN_PROGRESS.length}</span>
              </div>
              <div className="column-tasks">
                {tasksByColumn.IN_PROGRESS.map(task => renderTaskCard(task))}
              </div>
            </div>

            {/* COLUMN: REVIEW */}
            <div className="board-column">
              <div className="column-header review">
                <span className="column-title"><CheckSquare size={16} style={{ color: 'var(--color-review)' }} /> Under Review</span>
                <span className="column-count">{tasksByColumn.REVIEW.length}</span>
              </div>
              <div className="column-tasks">
                {tasksByColumn.REVIEW.map(task => renderTaskCard(task))}
              </div>
            </div>

            {/* COLUMN: COMPLETED */}
            <div className="board-column">
              <div className="column-header completed">
                <span className="column-title"><CheckSquare size={16} style={{ color: 'var(--color-completed)' }} /> Completed</span>
                <span className="column-count">{tasksByColumn.COMPLETED.length}</span>
              </div>
              <div className="column-tasks">
                {tasksByColumn.COMPLETED.map(task => renderTaskCard(task))}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar panels (Members & Project details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Members list & add panel */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Team Members ({project.members.length})
            </h3>

            {/* User Addition (Admins only) */}
            {user.role === 'ADMIN' && (
              <form onSubmit={handleAddMember} style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ADD NEW MEMBER</span>
                {memberError && <div className="text-danger" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{memberError}</div>}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)} 
                    className="input-field" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                  >
                    <option value="">Select User...</option>
                    {potentialNewMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 0.8rem' }}
                    disabled={memberSubmitting || !selectedUserId}
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Members Directory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {project.members.map(member => (
                <div key={member.id} className="flex-between">
                  <div className="flex-align-center" style={{ gap: '0.5rem' }}>
                    <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block' }}>{member.user.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{member.user.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex-align-center">
                    {member.userId === project.ownerId ? (
                      <span className="badge badge-small badge-admin" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>Owner</span>
                    ) : (
                      member.user.role === 'ADMIN' && <span className="badge badge-small badge-admin" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>Admin</span>
                    )}

                    {user.role === 'ADMIN' && member.userId !== project.ownerId && (
                      <button 
                        onClick={() => handleRemoveMember(member.userId, member.user.name)} 
                        className="btn" 
                        style={{ background: 'none', border: 'none', padding: '0.2rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                        title="Remove Member"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details Box */}
          <div className="glass-card" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} style={{ color: 'var(--primary)' }} /> Project Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className="flex-between">
                <span>Owner</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{project.owner.name}</span>
              </div>
              <div className="flex-between">
                <span>Created</span>
                <span style={{ color: 'var(--text-main)' }}>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex-between">
                <span>Total Tasks</span>
                <span style={{ color: 'var(--text-main)' }}>{totalTasks}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Task Dialog Modal (CREATE/EDIT) */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task Details' : 'Create New Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="modal-close"><X size={20} /></button>
            </div>

            {taskError && (
              <div className="flex-align-center text-danger" style={{ background: 'var(--color-danger-bg)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title</label>
                <input
                  id="taskTitle"
                  type="text"
                  className="input-field"
                  placeholder="Summarize the action item..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDesc">Description (Optional)</label>
                <textarea
                  id="taskDesc"
                  className="input-field"
                  placeholder="Provide sub-tasks, implementation notes, or references..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    className="input-field"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    className="input-field"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="TODO">TO DO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">UNDER REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="taskDueDate">Due Date</label>
                  <input
                    id="taskDueDate"
                    type="date"
                    className="input-field"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="taskAssignee">Assignee</label>
                  <select
                    id="taskAssignee"
                    className="input-field"
                    value={taskAssigneeId}
                    disabled={assignToAll}
                    style={{ opacity: assignToAll ? 0.5 : 1 }}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(member => (
                      <option key={member.userId} value={member.userId}>{member.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingTask && (
                <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="assignToAll"
                    type="checkbox"
                    checked={assignToAll}
                    onChange={(e) => {
                      setAssignToAll(e.target.checked);
                      if (e.target.checked) {
                        setTaskAssigneeId('');
                      }
                    }}
                    style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
                  />
                  <label htmlFor="assignToAll" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    Assign a separate copy of this task to all project members
                  </label>
                </div>
              )}

              <div className="flex-align-center" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskSubmitting}>
                  {taskSubmitting ? 'Processing...' : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer: Render each individual task card
  function renderTaskCard(task) {
    const overdue = isOverdue(task.dueDate, task.status);
    
    // Check if the current user has permission to change this task's status
    // Admin has permissions for all. Members can ONLY change status of tasks assigned to them.
    const canChangeStatus = user.role === 'ADMIN' || task.assigneeId === user.id;

    return (
      <div key={task.id} className="glass-card task-card">
        <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          {/* Priority badge */}
          <span className={`badge badge-small badge-${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>

          {/* Admin Action Menu */}
          {user.role === 'ADMIN' && (
            <div className="flex-align-center" style={{ gap: '0.2rem' }}>
              <button 
                onClick={() => openEditTaskModal(task)} 
                className="btn" 
                style={{ background: 'none', border: 'none', padding: '0.2rem', color: 'var(--text-dim)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                title="Edit Task"
              >
                <Edit3 size={12} />
              </button>
              <button 
                onClick={() => handleDeleteTask(task.id, task.title)} 
                className="btn" 
                style={{ background: 'none', border: 'none', padding: '0.2rem', color: 'var(--text-dim)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                title="Delete Task"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        <h4 className="task-title">{task.title}</h4>
        {task.description && <p className="task-desc">{task.description}</p>}

        {/* Due date marker */}
        {task.dueDate && (
          <span className={`task-date ${overdue ? 'overdue' : ''}`} style={{ display: 'inline-flex', marginTop: '0.2rem' }}>
            <Calendar size={12} />
            Due: {formatDate(task.dueDate)} {overdue && '(Overdue)'}
          </span>
        )}

        <div className="task-meta">
          {/* Status selector (custom select block) */}
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            <select
              value={task.status}
              disabled={!canChangeStatus}
              onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
              className="input-field badge-small"
              style={{
                width: '100%',
                padding: '0.2rem 1.5rem 0.2rem 0.4rem',
                fontSize: '0.75rem',
                height: 'auto',
                fontWeight: 600,
                cursor: canChangeStatus ? 'pointer' : 'not-allowed',
                backgroundPosition: 'right 0.4rem center',
                borderColor: 'transparent',
                backgroundColor: 'rgba(255,255,255,0.03)',
                opacity: canChangeStatus ? 1 : 0.7
              }}
              title={!canChangeStatus ? 'You can only update tasks assigned to you' : ''}
            >
              <option value="TODO">TO DO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Assignee Avatar */}
          <div className="task-assignee">
            {task.assignee ? (
              <div 
                className="avatar-circle" 
                style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} 
                title={`Assigned to: ${task.assignee.name}`}
              >
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ProjectDetails;
