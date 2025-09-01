import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Upload from './components/Upload/Upload';
import Products from './components/Products/Products';
import Notes from './components/Notes/Notes';
import Suppliers from './components/Suppliers/Suppliers';
import Reports from './components/Reports/Reports';
import Login from './components/Auth/Login';
import AuthSuccess from './components/Auth/AuthSuccess';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
    
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/auth/success" element={<AuthSuccess onLogin={handleLogin} />} />
          
          {user ? (
            <>
              <Route path="/" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Navigate to="/dashboard" />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/dashboard" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Dashboard />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/upload" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Upload />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/produtos" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Products />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/notas" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Notes />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/fornecedores" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Suppliers />
                    </main>
                  </div>
                </div>
              } />
              
              <Route path="/compras" element={
                <div className="app-layout">
                  <Header user={user} onLogout={handleLogout} />
                  <div className="app-body">
                    <Sidebar />
                    <main className="main-content">
                      <Reports type="compras" />
                    </main>
                  </div>
                </div>
              } />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}
export default App;
