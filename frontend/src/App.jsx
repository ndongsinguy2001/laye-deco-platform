import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Events from './pages/Events';
import Assignments from './pages/Assignments';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Materials from './pages/Materials';
import Profile from './pages/Profile';
import Users from './pages/Users';

// Composant pour protéger les routes
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-xl text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin', 'team_leader', 'accountant']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin']}>
                <Employees />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin', 'team_leader']}>
                <Events />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assignments" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin', 'team_leader']}>
                <Assignments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin', 'accountant']}>
                <Payments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/materials" 
            element={
              <ProtectedRoute allowedRoles={['director', 'admin']}>
                <Materials />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <Users />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;