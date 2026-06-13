import React, { useState } from 'react';
import '../styles/components.css';

function Home({ sessionActive, sessionUser, onOpenBallot, onStartVoting, onClearActiveSession, onAdminClick }) {
  const [selected, setSelected] = useState('student');

  const actions = {
    student: {
      label: 'Student',
      title: 'Student Login',
      text: 'Student voter entry',
      button: 'Continue',
      onClick: () => onStartVoting('student')
    },
    teacher: {
      label: 'Teacher',
      title: 'Teacher Login',
      text: 'Full ballot for staff',
      button: 'Continue',
      onClick: () => onStartVoting('teacher')
    },
    admin: {
      label: 'Admin',
      title: 'Admin Panel',
      text: 'Candidates and results',
      button: 'Open Admin',
      onClick: onAdminClick
    }
  };

  const selectedAction = actions[selected];

  if (sessionActive) {
    return (
      <div className="home-gateway">
        <header className="gateway-header">
          <div className="brand-block">
            <span className="brand-mark">MV</span>
            <div>
              <p className="eyebrow">Active Ballot</p>
              <h1>MyVote</h1>
            </div>
          </div>
        </header>

        <main className="gateway-main compact">
          <section className="gateway-copy">
            <p className="eyebrow">Voting in progress</p>
            <h2>{sessionUser?.name || 'Voter'} is active</h2>
            <div className="hero-highlights">
              <span>{sessionUser?.type || 'Voter'}</span>
              <span>ID {sessionUser?.voterId || 'N/A'}</span>
            </div>
          </section>

          <section className="access-panel">
            <button className="start-btn" onClick={onOpenBallot}>Open Ballot</button>
            <button className="secondary-btn" onClick={onClearActiveSession}>Clear Session</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="home-gateway">
      <header className="gateway-header">
        <div className="brand-block">
          <span className="brand-mark">MV</span>
          <div>
            <p className="eyebrow">Election Desk</p>
            <h1>MyVote</h1>
          </div>
        </div>
        <div className="gateway-status">
          <span>Student Voting</span>
          <span>Live Results</span>
        </div>
      </header>

      <main className="gateway-main">
        <section className="gateway-copy">
          <p className="eyebrow">School Voting Platform</p>
          <h2>Vote clean. Count clear.</h2>
          <div className="hero-highlights">
            <span>Student ballot</span>
            <span>Teacher ballot</span>
            <span>Result graphs</span>
          </div>
        </section>

        <section className="access-panel">
          <div className="access-grid">
            {Object.entries(actions).map(([key, action]) => (
              <button
                key={key}
                className={`access-card ${selected === key ? 'active' : ''}`}
                onClick={() => setSelected(key)}
              >
                <span className="nav-icon">{action.label.slice(0, 2).toUpperCase()}</span>
                <strong>{action.title}</strong>
                <small>{action.text}</small>
              </button>
            ))}
          </div>

          <div className="selected-action" aria-live="polite">
            <div>
              <h3>{selectedAction.title}</h3>
              <p>{selectedAction.text}</p>
            </div>
            <button className="start-btn" onClick={selectedAction.onClick}>
              {selectedAction.button}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
