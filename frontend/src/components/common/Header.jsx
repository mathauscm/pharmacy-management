import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>myFarm - Sistema de Farmácia</h1>
        <div className="header-actions">
          {user && (
            <>
              <div className="user-info">
                {user.photo && (
                  <img 
                    src={user.photo} 
                    alt={user.name} 
                    className="user-avatar"
                  />
                )}
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
