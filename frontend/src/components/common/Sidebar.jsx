import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3>Menu Principal</h3>
          <ul>
            <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>📊 Dashboard</Link></li>
            <li><Link to="/upload" className={isActive('/upload') ? 'active' : ''}>📤 Upload XML</Link></li>
            <li><Link to="/produtos" className={isActive('/produtos') ? 'active' : ''}>📦 Produtos</Link></li>
            <li><Link to="/notas" className={isActive('/notas') ? 'active' : ''}>📄 Notas Fiscais</Link></li>
            <li><Link to="/fornecedores" className={isActive('/fornecedores') ? 'active' : ''}>🏪 Fornecedores</Link></li>
          </ul>
        </div>
        <div className="nav-section">
          <h3>Relatórios</h3>
          <ul>
            <li><Link to="/compras" className={isActive('/compras') ? 'active' : ''}>🛒 Histórico de Compras</Link></li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
