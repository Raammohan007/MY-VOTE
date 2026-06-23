import React, { useState } from 'react';
import { getGradeLabel, VOTER_GRADES } from '../utils/votingData';
import '../styles/components.css';

function StudentLogin({ onLoginSuccess, onBack, userType = 'student', showBackButton = true, savedVoterEntry, onSaveQuickVoter, onClearQuickVoter }) {
  const [name, setName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [grade, setGrade] = useState('Primary');
  const [error, setError] = useState('');
  const [quickMessage, setQuickMessage] = useState('');

  const isTeacher = userType === 'teacher';

  const handleLogin = () => {
    if (!name.trim()) {
      setError(`Please enter the ${isTeacher ? 'teacher' : 'student'} name`);
      return;
    }

    if (!voterId.trim()) {
      setError(`Please enter the ${isTeacher ? 'teacher ID' : 'roll number or admission number'}`);
      return;
    }

    setError('');
    onLoginSuccess({
      name: name.trim(),
      voterId: voterId.trim(),
      grade: isTeacher ? null : grade,
      group: null,
      type: userType
    });
  };

  const handleUseQuickVoter = () => {
    if (!savedVoterEntry) return;

    const quickUser = {
      ...savedVoterEntry,
      type: savedVoterEntry.type || userType,
      group: null
    };

    setName(quickUser.name || '');
    setVoterId(quickUser.voterId || '');
    setGrade(quickUser.grade || 'Primary');
    setError('');
    onLoginSuccess(quickUser);
  };

  const handleSaveQuickEntry = () => {
    if (!name.trim() || !voterId.trim()) {
      setError('Enter name and ID first to save a quick voter.');
      return;
    }

    if (!onSaveQuickVoter) return;

    onSaveQuickVoter({
      name: name.trim(),
      voterId: voterId.trim(),
      grade: isTeacher ? null : grade,
      group: null,
      type: userType
    });

    setQuickMessage('Quick voter entry saved for faster check-in.');
    setTimeout(() => setQuickMessage(''), 3000);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {showBackButton && <button className="back-btn" onClick={onBack}>Back</button>}

        <div className="login-header">
          <h2>{isTeacher ? 'Teacher' : 'Student'} Voter Activation</h2>
          <p>Polling officer fills this, then hands over only the ballot screen</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{isTeacher ? 'Teacher ID *' : 'Roll No / Admission No *'}</label>
            <input
              type="text"
              placeholder={isTeacher ? 'Enter teacher ID' : 'Enter roll number'}
              value={voterId}
              onChange={(event) => {
                setVoterId(event.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="form-input"
            />
          </div>

          {!isTeacher && (
            <div className="form-group">
              <label>Grade *</label>
              <select
                value={grade}
                onChange={(event) => {
                  setGrade(event.target.value);
                }}
                className="form-input"
              >
                {VOTER_GRADES.map((item) => (
                  <option key={item} value={item}>{getGradeLabel(item)}</option>
                ))}
              </select>
            </div>
          )}


          {error && <div className="error-message">{error}</div>}
          {quickMessage && <div className="success-message">{quickMessage}</div>}

          <div className="quick-voter-row">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleSaveQuickEntry}
              disabled={!name.trim() || !voterId.trim()}
            >
              Save Quick Voter
            </button>
            <button
              type="button"
              className="start-btn"
              onClick={handleUseQuickVoter}
              disabled={!savedVoterEntry}
            >
              Use Saved Voter
            </button>
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                onClearQuickVoter();
                setQuickMessage('Saved quick voter entry cleared.');
                setTimeout(() => setQuickMessage(''), 3000);
              }}
              disabled={!savedVoterEntry}
            >
              Clear Saved Voter
            </button>
          </div>

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={!name.trim() || !voterId.trim()}
          >
            Activate EVM Ballot
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
