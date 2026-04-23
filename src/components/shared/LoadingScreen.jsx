import React from 'react';

const LoadingScreen = ({ logo }) => {
  return (
    <div className="splash-container">
      <img src={logo} alt="Logo SOLO" className="splash-logo" />
      <h1 className="splash-title">SOLO</h1>
      <div className="loading-bar-container">
        <div className="loading-bar"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;