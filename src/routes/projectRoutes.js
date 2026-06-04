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

// Add a member to a project (Admin or Project Owner only)
router.post('/:id/members', authenticateToken, checkProjectOwnerOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to project
    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return res.status(201).json(member);
  } catch (error) {
    // Handle unique constraint (user already in project)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }
    console.error('Error adding member:', error);
    return res.status(500).json({ error: 'Failed to add member to project' });
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
