import React, { useState , useEffect} from 'react';
import './App.css';
import Login from './pages/Login';
import Dashboard from './components/Admin/Dashboard';
import AdminDashboard from './components/Admin/MainAdmin/AdminDashboard';

function App() {

  useEffect(() => {
  const validateToken = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      // No token, redirect to login
      navigate('/login');
      return;
    }

    try {
      // Validate token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token is invalid or expired
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      // Network error - token might still be valid
      console.error('Token validation error:', error);
    }
  };

  validateToken();
}, []);

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