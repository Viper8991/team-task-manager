const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireAdmin, requireMember } = require('../middleware/auth');

const router = express.Router();

// Helper: Check if user is a member of the project or is an Admin
async function checkProjectAccess(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'ADMIN') {
    return next();
  }

  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    next();
  } catch (error) {
    console.error('Project access check error:', error);
    return res.status(500).json({ error: 'Internal server error during access check' });
  }
}

// Helper: Check if user is either project owner or system admin
async function checkProjectOwnerOrAdmin(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'ADMIN') {
    return next();
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied: Only the project owner or system admin can perform this action' });
    }

    next();
  } catch (error) {
    console.error('Project owner check error:', error);
    return res.status(500).json({ error: 'Internal server error during owner check' });
  }
}

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      // Admins see all projects
      projects = await prisma.project.findMany({
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { members: true, tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Members see projects they are assigned to
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: req.user.id
            }
          }
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { members: true, tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project details (accessible by members and admins)
router.get('/:id', authenticateToken, checkProjectAccess, async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            creator: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    console.error('Error fetching project details:', error);
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Create a project (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    // Create project and automatically add owner as a member
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      }
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Add a member (or multiple members) to a project (Admin or Project Owner only)
router.post('/:id/members', authenticateToken, checkProjectOwnerOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { userId, userIds } = req.body;

  let idsToAdd = [];
  if (userId) {
    idsToAdd.push(userId);
  } else if (Array.isArray(userIds)) {
    idsToAdd = userIds;
  }

  if (idsToAdd.length === 0) {
    return res.status(400).json({ error: 'User ID or User IDs array is required' });
  }

  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Filter out users already in project
    const existingMembers = await prisma.projectMember.findMany({
      where: {
        projectId: id,
        userId: { in: idsToAdd }
      },
      select: { userId: true }
    });
    const existingUserIds = existingMembers.map(m => m.userId);
    const newUserIds = idsToAdd.filter(uid => !existingUserIds.includes(uid));

    if (newUserIds.length === 0) {
      return res.status(400).json({ error: 'All selected users are already members of this project' });
    }

    // Check if users exist in the database
    const validUsers = await prisma.user.findMany({
      where: { id: { in: newUserIds } },
      select: { id: true }
    });
    const validUserIds = validUsers.map(u => u.id);

    if (validUserIds.length === 0) {
      return res.status(404).json({ error: 'No valid users found to add' });
    }

    // Add them using createMany (supported by SQLite in modern Prisma)
    await prisma.projectMember.createMany({
      data: validUserIds.map(uid => ({
        projectId: id,
        userId: uid
      }))
    });

    // Create notifications for each successfully added user
    await prisma.notification.createMany({
      data: validUserIds.map(uid => ({
        userId: uid,
        title: 'Assigned to Project',
        message: `You have been added to the project "${project.name}"`
      }))
    });

    // Return the count and status
    return res.status(201).json({
      message: `${validUserIds.length} member(s) added successfully`,
      addedCount: validUserIds.length
    });
  } catch (error) {
    console.error('Error adding member(s):', error);
    return res.status(500).json({ error: 'Failed to add member(s) to project' });
  }
});

// Remove a member from a project (Admin or Project Owner only)
router.delete('/:id/members/:userId', authenticateToken, checkProjectOwnerOrAdmin, async (req, res) => {
  const { id, userId } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Prevent removing the owner unless the project is deleted entirely
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner from members. Delete the project instead.' });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId
        }
      }
    });

    // Also unassign tasks in this project from this user
    await prisma.task.updateMany({
      where: {
        projectId: id,
        assigneeId: userId
      },
      data: {
        assigneeId: null
      }
    });

    return res.json({ message: 'Member removed successfully and their tasks in this project unassigned' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Failed to remove member from project' });
  }
});

// Update project details (Admin or Project Owner only)
router.put('/:id', authenticateToken, checkProjectOwnerOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name, description },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      }
    });

    return res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project (Admin or Project Owner only)
router.delete('/:id', authenticateToken, checkProjectOwnerOrAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.project.delete({
      where: { id }
    });
    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
