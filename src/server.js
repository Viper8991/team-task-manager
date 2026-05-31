const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for local development (frontend running on port 5173 or similar)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Log requests middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback to index.html for SPA (React Router) in production
app.get('*', (req, res, next) => {
  // If it starts with /api, it's a missing API route
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // In development, the dist folder might not exist yet, which is expected
      res.status(200).send('Backend is running! Frontend is in development mode.');
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📂 Serving static frontend from: ${frontendDistPath}`);
  console.log(`===============================================`);
});
