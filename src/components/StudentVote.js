import React, { useMemo, useState } from 'react';
import {
  getCandidatesForRole,
  getGradeLabel,
  getRoleScopeLabel,
  getRolesForGrade,
  GRADES,
  GROUPS,
  ROLE_SCOPES
} from '../utils/votingData';
import '../styles/components.css';

const COMMON_ROLE_GRADES = ['11', '12'];

const buildRoleItemsForGrade = (grade, group = '') =>
  getRolesForGrade(grade).flatMap((role) => {
    if (role.scope === ROLE_SCOPES.GROUP) {
      const groups = group ? [group] : GROUPS;
      return groups.map((itemGroup) => ({
        key: `${grade}-${itemGroup}-${role.id}`,
        grade,
        role,
        group: itemGroup
      }));
    }

    return [{
      key: `${grade}-${role.id}`,
      grade,
      role,
      group: ''
    }];
  });

const buildCommonRoleItems = () =>
  COMMON_ROLE_GRADES.flatMap((grade) =>
    getRolesForGrade(grade)
      .filter((role) => role.scope === ROLE_SCOPES.TUITION)
      .map((role) => ({
        key: `${grade}-${role.id}`,
        grade,
        role,
        group: ''
      }))
  );

function StudentVote({
  candidates,
  studentGrade,
  studentName,
  studentGroup,
  voterId,
  voterKey,
  onVote,
  onBack,
  canVoteForAll = false,
  showBackButton = true
}) {
  const [selectedVotes, setSelectedVotes] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const isTeacher = canVoteForAll;

  const roleItems = useMemo(() => {
    if (isTeacher) {
      return GRADES.flatMap((grade) => buildRoleItemsForGrade(grade));
    }

    const classRoles = GRADES.includes(studentGrade)
      ? buildRoleItemsForGrade(studentGrade, studentGroup)
        .filter((item) => item.role.scope !== ROLE_SCOPES.TUITION)
      : [];

    return [...classRoles, ...buildCommonRoleItems()];
  }, [isTeacher, studentGrade, studentGroup]);

  const enrichedItems = roleItems.map((item) => {
    const candidatesList = getCandidatesForRole(candidates, item.grade, item.role, item.group)
      .filter((candidate) => candidate.name.trim());
    const needed = Math.min(item.role.seats || 1, candidatesList.length);

    return {
      ...item,
      candidatesList,
      needed
    };
  });

  const currentItem = enrichedItems[currentIndex];
  const selectedForRole = currentItem ? selectedVotes[currentItem.key] || [] : [];
  const canMoveForward = !currentItem || currentItem.needed === 0 || selectedForRole.length >= currentItem.needed;
  const progress = enrichedItems.length ? Math.round(((currentIndex + 1) / enrichedItems.length) * 100) : 0;

  const handleCandidateSelect = (item, candidateId) => {
    const maxSelections = item.role.seats || 1;

    setSelectedVotes((prev) => {
      const current = prev[item.key] || [];
      const alreadySelected = current.includes(candidateId);

      if (alreadySelected) {
        return {
          ...prev,
          [item.key]: current.filter((id) => id !== candidateId)
        };
      }

      if (maxSelections === 1) {
        return {
          ...prev,
          [item.key]: [candidateId]
        };
      }

      if (current.length >= maxSelections) return prev;

      return {
        ...prev,
        [item.key]: [...current, candidateId]
      };
    });
  };

  const allSelected = enrichedItems.every((item) =>
    item.needed === 0 || (selectedVotes[item.key] || []).length >= item.needed
  );

  const handleSubmitVotes = () => {
    if (!allSelected) {
      alert('Please complete all positions before submitting.');
      return;
    }

    const submittedVotes = [];

    enrichedItems.forEach((item) => {
      const groupForVote = item.role.scope === ROLE_SCOPES.GROUP ? item.group : null;
      (selectedVotes[item.key] || []).forEach((candidateId) => {
        submittedVotes.push({
          candidateId,
          role: item.role.id,
          roleLabel: item.role.label,
          grade: item.grade,
          group: groupForVote,
          scope: item.role.scope,
          voterName: studentName,
          voterId,
          voterKey,
          voterGrade: studentGrade,
          voterGroup: studentGroup || null,
          voterType: isTeacher ? 'teacher' : 'student',
          timestamp: new Date().toISOString()
        });
      });
    });

    onVote(submittedVotes);
    setSubmitted(true);
    setTimeout(() => {
      onBack();
    }, 2200);
  };

  if (submitted) {
    return (
      <div className="voting-container submitted-message">
        <div className="success-box">
          <h2>Vote Cast Successfully</h2>
          <p>Thank you. Returning to officer desk...</p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="voting-container submitted-message">
        <div className="success-box">
          <h2>No ballot available</h2>
          <p>Please contact the polling officer.</p>
          {showBackButton && <button className="back-btn" onClick={onBack}>Back</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="voting-container ballot-flow">
      <header className="ballot-topbar">
        <div>
          <p className="eyebrow">{isTeacher ? 'Teacher Ballot' : 'Student Ballot'}</p>
          <h2>{studentName}</h2>
          <p className="ballot-meta">
            ID {voterId} | {isTeacher ? 'All classes' : getGradeLabel(studentGrade)}
            {studentGroup ? ` - ${studentGroup}` : ''}
          </p>
        </div>
        <div className="ballot-progress-card">
          <strong>{currentIndex + 1}/{enrichedItems.length}</strong>
          <span>{progress}% Complete</span>
        </div>
      </header>

      <div className="ballot-progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>

      <main className="ballot-workspace">
        <aside className="ballot-steps" aria-label="Ballot positions">
          {enrichedItems.map((item, index) => {
            const selectedCount = (selectedVotes[item.key] || []).length;
            const done = item.needed === 0 || selectedCount >= item.needed;

            return (
              <button
                key={item.key}
                className={`ballot-step ${index === currentIndex ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <span>{done ? 'OK' : index + 1}</span>
                <strong>{item.role.shortLabel || item.role.label}</strong>
                <small>
                  {getGradeLabel(item.grade)}
                  {item.group ? ` - ${item.group}` : ''}
                </small>
              </button>
            );
          })}
        </aside>

        <section className="ballot-card">
          <div className="ballot-card-header">
            <div>
              <p className="eyebrow">
                {getGradeLabel(currentItem.grade)}
                {currentItem.group ? ` - ${currentItem.group}` : ''}
              </p>
              <h3>{currentItem.role.label}</h3>
              <p>{getRoleScopeLabel(currentItem.role, currentItem.group)}</p>
            </div>
            <span className="vote-count">
              {currentItem.needed > 0 ? `Choose ${currentItem.needed}` : 'No candidates'}
            </span>
          </div>

          {currentItem.candidatesList.length === 0 ? (
            <div className="empty-ballot-state">
              <h4>No candidates added</h4>
              <p>You can continue to the next position.</p>
            </div>
          ) : (
            <div className="modern-candidate-grid">
              {currentItem.candidatesList.map((candidate) => {
                const selected = selectedForRole.includes(candidate.id);

                return (
                  <button
                    key={candidate.id}
                    className={`modern-candidate-card ${selected ? 'selected' : ''}`}
                    onClick={() => handleCandidateSelect(currentItem, candidate.id)}
                  >
                    <div className="modern-candidate-photo">
                      {candidate.photoUrl ? (
                        <img src={candidate.photoUrl} alt={candidate.name} />
                      ) : (
                        <span>{candidate.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="modern-candidate-info">
                      <strong>{candidate.name}</strong>
                      <span>{candidate.symbol || 'Symbol'}</span>
                      {candidate.details && <small>{candidate.details}</small>}
                    </div>
                    <div className="select-pill">{selected ? 'Selected' : 'Select'}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="ballot-actions">
            {showBackButton && (
              <button className="back-btn" onClick={onBack}>Cancel</button>
            )}
            <button
              className="secondary-btn"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            >
              Previous
            </button>
            {currentIndex < enrichedItems.length - 1 ? (
              <button
                className="start-btn"
                disabled={!canMoveForward}
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, enrichedItems.length - 1))}
              >
                Next
              </button>
            ) : (
              <button
                className="submit-btn"
                disabled={!allSelected}
                onClick={handleSubmitVotes}
              >
                Submit Vote
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentVote;
