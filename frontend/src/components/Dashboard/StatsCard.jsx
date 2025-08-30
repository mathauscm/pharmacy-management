import React from 'react';

const StatsCard = ({ title, value, icon, color = 'blue', subtitle, trend }) => {
  const getIcon = (iconName) => {
    const icons = {
      package: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,2A3,3 0 0,1 15,5V7H20A1,1 0 0,1 21,8V19A3,3 0 0,1 18,22H6A3,3 0 0,1 3,19V8A1,1 0 0,1 4,7H9V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7H13V5A1,1 0 0,0 12,4Z" />
        </svg>
      ),
      suppliers: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16,4C18.209,4 20,5.791 20,8V16C20,18.209 18.209,20 16,20H4C1.791,20 0,18.209 0,16V8C0,5.791 1.791,4 4,4H16M16,6H4C2.896,6 2,6.896 2,8V16C2,17.104 2.896,18 4,18H16C17.104,18 18,17.104 18,16V8C18,6.896 17.104,6 16,6M4,8H16V10H4V8M4,12H16V14H4V12Z" />
        </svg>
      ),
      document: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      ),
      money: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
        </svg>
      )
    };
    return icons[iconName] || icons.package;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.direction === 'up') {
      return (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="trend-up">
          <path d="M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z" />
        </svg>
      );
    } else if (trend.direction === 'down') {
      return (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="trend-down">
          <path d="M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__header">
        <div className="stats-card__icon">
          {getIcon(icon)}
        </div>
        <div className="stats-card__title">
          {title}
        </div>
      </div>
      
      <div className="stats-card__content">
        <div className="stats-card__value">
          {value}
        </div>
        
        {subtitle && (
          <div className="stats-card__subtitle">
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className={`stats-card__trend stats-card__trend--${trend.direction}`}>
            {getTrendIcon()}
            <span>{trend.value}</span>
            {trend.label && <small>{trend.label}</small>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
