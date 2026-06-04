import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import AdminTeam from './pages/AdminTeam';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div className="animate-pulse-slow" style={{ fontFamily: 'Outfit', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
          Loading Workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Only Route Wrapper (for Login/Signup)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppLayout() {
  const { user } = useAuth();
  return (
    <div className="app-container">
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin-team/:adminId" element={<ProtectedRoute><AdminTeam /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public authentication views */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          {/* Protected workspace views */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
