const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create a task (Admin or Project Owner only)
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, priority, status, dueDate, projectId, assigneeId, assignToAll } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'Title and Project ID are required' });
  }

  try {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify permission: Must be Admin or the Project Owner
    if (req.user.role !== 'ADMIN' && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Only project owner or system admin can create tasks' });
    }

    if (assignToAll) {
      // Fetch all project members
      const members = await prisma.projectMember.findMany({
        where: { projectId }
      });

      if (members.length === 0) {
        return res.status(400).json({ error: 'No members found in this project to assign tasks to' });
      }

      // Create a task for each project member
      const tasks = await Promise.all(
        members.map(member =>
          prisma.task.create({
            data: {
              title,
              description,
              priority: priority || 'MEDIUM',
              status: status || 'TODO',
              dueDate: dueDate ? new Date(dueDate) : null,
              projectId,
              assigneeId: member.userId,
              creatorId: req.user.id
            },
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              creator: {
                select: { id: true, name: true }
              }
            }
          })
        )
      );

      // Create notifications for all assigned members
      await prisma.notification.createMany({
        data: members.map(m => ({
          userId: m.userId,
          title: 'New Task Assigned',
          message: `You have been assigned the task "${title}" in project "${project.name}"`
        }))
      });

      return res.status(201).json(tasks[0]);
    }

    // Verify assignee is a member of this project (if assignee is provided)
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assigneeId
          }
        }
      });

      if (!isMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'New Task Assigned',
          message: `You have been assigned the task "${title}" in project "${project.name}"`
        }
      });
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
// - Admin: can update anything (title, description, priority, status, dueDate, assigneeId)
// - Member: can only update status, and ONLY if the task is assigned to them
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, dueDate, assigneeId } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Find task and check its project
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isProjectOwner = task.project.ownerId === userId;
    if (userRole === 'ADMIN' || isProjectOwner) {
      // Validate assignee if it's being updated
      if (assigneeId && assigneeId !== task.assigneeId) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: task.projectId,
              userId: assigneeId
            }
          }
        });

        if (!isMember) {
          return res.status(400).json({ error: 'Assignee must be a member of this project' });
        }
      }

      // Update everything
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title: title !== undefined ? title : task.title,
          description: description !== undefined ? description : task.description,
          priority: priority !== undefined ? priority : task.priority,
          status: status !== undefined ? status : task.status,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
          assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          creator: {
            select: { id: true, name: true }
          }
        }
      });

      if (assigneeId && assigneeId !== task.assigneeId) {
        await prisma.notification.create({
          data: {
            userId: assigneeId,
            title: 'Task Assigned to You',
            message: `The task "${updatedTask.title}" in project "${task.project.name}" has been assigned to you.`
          }
        });
      }

      return res.json(updatedTask);
    } else {
      // Member path
      // Must be assigned to them to edit status
      if (task.assigneeId !== userId) {
        return res.status(403).json({ error: 'Access denied: You can only update tasks assigned to you' });
      }

      // Verify that they are only attempting to update status
      if (title || description || priority || dueDate || assigneeId) {
        return res.status(403).json({ error: 'Access denied: Members can only update the status of tasks' });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status },
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          creator: {
            select: { id: true, name: true }
          }
        }
      });

      return res.json(updatedTask);
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task (Admin or Project Owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (userRole !== 'ADMIN' && task.project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied: Only project owner or system admin can delete tasks' });
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Tasks stats (assigned to the current user)
    const assignedTasks = await prisma.task.findMany({
      where: { assigneeId: userId }
    });

    const totalTasks = assignedTasks.length;
    const stats = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      COMPLETED: 0
    };

    assignedTasks.forEach(task => {
      if (stats[task.status] !== undefined) {
        stats[task.status]++;
      }
    });

    // Overdue tasks: Due date in past, not completed
    const now = new Date();
    const overdueTasks = assignedTasks.filter(task => {
      return task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED';
    });

    // 2. Project progress overview
    // If Admin, get all projects. If Member, get projects they belong to.
    let userProjects;
    if (userRole === 'ADMIN') {
      userProjects = await prisma.project.findMany({
        include: {
          tasks: true
        }
      });
    } else {
      userProjects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId }
          }
        },
        include: {
          tasks: true
        }
      });
    }

    const projectsOverview = userProjects.map(proj => {
      const total = proj.tasks.length;
      const completed = proj.tasks.filter(t => t.status === 'COMPLETED').length;
      return {
        id: proj.id,
        name: proj.name,
        totalTasks: total,
        completedTasks: completed,
        percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100)
      };
    });

    // 3. System stats for Admin dashboard
    let adminStats = null;
    if (userRole === 'ADMIN') {
      const allUsersCount = await prisma.user.count();
      const allProjectsCount = await prisma.project.count();
      const allTasksCount = await prisma.task.count();
      
      const allTasks = await prisma.task.findMany();
      const allStats = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
      allTasks.forEach(t => {
        if (allStats[t.status] !== undefined) allStats[t.status]++;
      });

      // Tasks per user
      const usersWithTasks = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          _count: {
            select: {
              assignedTasks: true
            }
          }
        },
        orderBy: {
          assignedTasks: {
            _count: 'desc'
          }
        }
      });

      adminStats = {
        totalUsers: allUsersCount,
        totalProjects: allProjectsCount,
        totalTasks: allTasksCount,
        statusBreakdown: allStats,
        tasksPerUser: usersWithTasks.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          taskCount: u._count.assignedTasks
        }))
      };
    }

    return res.json({
      personalStats: {
        totalTasks,
        todoCount: stats.TODO,
        inProgressCount: stats.IN_PROGRESS,
        reviewCount: stats.REVIEW,
        completedCount: stats.COMPLETED,
        overdueCount: overdueTasks.length,
        overdueTasks: overdueTasks.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate }))
      },
      projectsOverview,
      adminStats
    });
  } catch (error) {
    console.error('Error compiling dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
