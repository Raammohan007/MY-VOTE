import React, { useState } from 'react';
import { getGradeLabel, GROUPS, hasGroups, VOTER_GRADES } from '../utils/votingData';
import '../styles/components.css';

function StudentLogin({ onLoginSuccess, onBack, userType = 'student', showBackButton = true }) {
  const [name, setName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [grade, setGrade] = useState('Primary');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  const isTeacher = userType === 'teacher';
  const showGroup = !isTeacher && hasGroups(grade);

  const handleLogin = () => {
    if (!name.trim()) {
      setError(`Please enter the ${isTeacher ? 'teacher' : 'student'} name`);
      return;
    }

    if (!voterId.trim()) {
      setError(`Please enter the ${isTeacher ? 'teacher ID' : 'roll number or admission number'}`);
      return;
    }

    if (showGroup && !group) {
      setError('Please select your group');
      return;
    }

    setError('');
    onLoginSuccess({
      name: name.trim(),
      voterId: voterId.trim(),
      grade: isTeacher ? null : grade,
      group: showGroup ? group : null,
      type: userType
    });
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
                  setGroup('');
                }}
                className="form-input"
              >
                {VOTER_GRADES.map((item) => (
                  <option key={item} value={item}>{getGradeLabel(item)}</option>
                ))}
              </select>
            </div>
          )}

          {showGroup && (
            <div className="form-group">
              <label>Group *</label>
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="form-input"
              >
                <option value="">Select your group</option>
                {GROUPS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={!name.trim() || !voterId.trim() || (showGroup && !group)}
          >
            Activate EVM Ballot
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
