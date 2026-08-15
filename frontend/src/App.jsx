import React, { useState } from 'react';
import './App.css';
import Login from './pages/Login';
import Dashboard from './components/Admin/Dashboard';
import AdminDashboard from './components/Admin/MainAdmin/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('authToken')
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('employee') || 'null')
  );

  const handleLogin = (data) => {
    setUser(data.employee);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('employee');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Check if user is admin
  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;