import React from 'react';

const Loading = ({ size = 'medium', text = 'Carregando...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'loading--small',
    medium: 'loading--medium',
    large: 'loading--large'
  };

  return (
    <div className={`loading ${sizeClasses[size]} ${fullScreen ? 'loading--fullscreen' : ''}`}>
      <div className="loading__spinner">
        <div className="loading__circle"></div>
        <div className="loading__circle"></div>
        <div className="loading__circle"></div>
      </div>
      {text && (
        <div className="loading__text">
          {text}
        </div>
      )}
    </div>
  );
};

export default Loading;
