const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain letters, numbers, and symbols' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine the role
    const userCount = await prisma.user.count();
    let role = 'MEMBER';
    
    if (userCount === 0) {
      role = 'SUPERADMIN';
    } else {
      const pendingAssignment = await prisma.pendingRole.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
      if (pendingAssignment) {
        role = pendingAssignment.role;
        // Delete pending assignment
        await prisma.pendingRole.delete({
          where: { email: email.toLowerCase().trim() }
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_team_task_manager_key_12345',
      { expiresIn: '24h' }
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_team_task_manager_key_12345',
      { expiresIn: '24h' }
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

// Get all users in the system (for assignment lists)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// Admin-assisted password reset
router.post('/admin-reset-password', authenticateToken, async (req, res) => {
  // Check if the requester is an ADMIN or SUPERADMIN
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must contain letters, numbers, and symbols' });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: passwordHash }
    });

    return res.json({ message: `Password for ${targetUser.name} reset successfully.` });
  } catch (error) {
    console.error('Error in admin password reset:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get admins with their grouped members and member counts (for Admin Teams view)
router.get('/admins-members', authenticateToken, async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const adminsWithMembers = await Promise.all(admins.map(async (admin) => {
      // Find projects owned by this admin
      const projects = await prisma.project.findMany({
        where: { ownerId: admin.id },
        select: { id: true }
      });
      const projectIds = projects.map(p => p.id);

      if (projectIds.length === 0) {
        return {
          ...admin,
          memberCount: 0,
          members: []
        };
      }

      // Find all unique project members in projects owned by this admin
      const memberships = await prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Filter to get unique member users
      const memberMap = new Map();
      memberships.forEach(m => {
        if (m.user.id !== admin.id && !memberMap.has(m.user.id)) {
          memberMap.set(m.user.id, m.user);
        }
      });

      const uniqueMembers = Array.from(memberMap.values());

      // Fetch task count for each unique member in the projects owned by this admin
      const membersWithTaskCount = await Promise.all(uniqueMembers.map(async (member) => {
        const taskCount = await prisma.task.count({
          where: {
            assigneeId: member.id,
            projectId: { in: projectIds }
          }
        });
        return {
          ...member,
          taskCount
        };
      }));

      return {
        ...admin,
        memberCount: membersWithTaskCount.length,
        members: membersWithTaskCount
      };
    }));

    return res.json(adminsWithMembers);
  } catch (error) {
    console.error('Error fetching admins and members:', error);
    return res.status(500).json({ error: 'Failed to fetch admins and members list' });
  }
});

// Assign role (SUPERADMIN only)
router.post('/assign-role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied. Superadmins only.' });
  }

  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  if (role !== 'ADMIN' && role !== 'MEMBER') {
    return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });
  }

  const targetEmail = email.toLowerCase().trim();

  try {
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (targetUser) {
      if (targetUser.role === 'SUPERADMIN') {
        return res.status(400).json({ error: 'Cannot modify the role of a SUPERADMIN' });
      }

      const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      return res.json({ message: `Successfully updated ${updatedUser.name}'s role to ${role}.`, user: updatedUser });
    } else {
      // User doesn't exist, create a pending role assignment
      const pending = await prisma.pendingRole.upsert({
        where: { email: targetEmail },
        update: { role },
        create: { email: targetEmail, role }
      });

      return res.json({ message: `Role ${role} pre-assigned to unregistered email ${targetEmail}.`, pending });
    }
  } catch (error) {
    console.error('Error assigning role:', error);
    return res.status(500).json({ error: 'Failed to assign role' });
  }
});

// Get all pending role assignments (SUPERADMIN only)
router.get('/pending-roles', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied. Superadmins only.' });
  }

  try {
    const pending = await prisma.pendingRole.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(pending);
  } catch (error) {
    console.error('Error fetching pending roles:', error);
    return res.status(500).json({ error: 'Failed to fetch pending roles' });
  }
});

// Delete a pending role assignment (SUPERADMIN only)
router.delete('/pending-roles/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied. Superadmins only.' });
  }

  const { id } = req.params;

  try {
    await prisma.pendingRole.delete({
      where: { id }
    });
    return res.json({ message: 'Pending role assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting pending role:', error);
    return res.status(500).json({ error: 'Failed to delete pending role assignment' });
  }
});

module.exports = router;
