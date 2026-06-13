import React, { useState } from 'react';
import '../styles/components.css';

function AdminLogin({ onAdminSuccess, onBack, correctPin = '1234', showBackButton = true }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [adminName, setAdminName] = useState('');

  const handlePinInput = (value) => {
    const cleanedValue = value.replace(/\s+/g, '');
    if (cleanedValue.length <= 6) {
      setPin(cleanedValue);
      setError('');
    }
  };

  const handleLogin = () => {
    const adminNameTrimmed = adminName.trim();
    const pinTrimmed = pin.trim();

    if (!adminNameTrimmed) {
      setError('Please enter your name');
      return;
    }

    if (pinTrimmed === correctPin) {
      onAdminSuccess(adminNameTrimmed);
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        {showBackButton && <button className="back-btn" onClick={onBack}>Back</button>}

        <div className="login-header">
          <h2>Admin Login</h2>
          <p>Enter your credentials to manage candidates and results</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label>Admin Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
              onKeyDown={handleKeyDown}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>PIN Code</label>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(event) => handlePinInput(event.target.value)}
              onKeyDown={handleKeyDown}
              className="form-input"
              maxLength="6"
            />
            <small className="hint">Demo PIN: 1234</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={!pin || !adminName.trim()}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
