import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Sistema de Farmácia</h1>
        <div className="header-actions">
          <span>Admin</span>
          <button className="btn-logout">Sair</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
