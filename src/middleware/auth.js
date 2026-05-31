const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_team_task_manager_key_12345');
    
    // Fetch the user from the database to make sure they still exist and check their current role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

const requireAdmin = requireRole(['ADMIN']);
const requireMember = requireRole(['ADMIN', 'MEMBER']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireMember
};
