import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ALL_SCOPE,
  getCandidatesForRole,
  getRoleScopeLabel,
  getRolesForGrade,
  GRADES,
  hasGroups,
  GROUPS,
  ROLE_SCOPES
} from '../utils/votingData';
import '../styles/components.css';

function AdminPanel({ candidates, onUpdateCandidates, onGoToDashboard, onResetElection, onLogout, onBack, showBackButton = true }) {
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedGroup, setSelectedGroup] = useState('Science');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saveMessage, setSaveMessage] = useState('');

  const showGroups = hasGroups(selectedGrade);
  const roles = getRolesForGrade(selectedGrade);

  const getStorageKey = (role) => {
    if (role.scope === ROLE_SCOPES.TUITION) return ALL_SCOPE;
    if (role.scope === ROLE_SCOPES.GROUP) return selectedGroup;
    return role.id;
  };

  const getRoleCandidates = (role) => {
    const group = role.scope === ROLE_SCOPES.GROUP ? selectedGroup : '';
    return getCandidatesForRole(candidates, selectedGrade, role, group);
  };

  const updateRoleCandidates = (role, updater) => {
    const newCandidates = JSON.parse(JSON.stringify(candidates));
    const key = getStorageKey(role);

    if (role.scope === ROLE_SCOPES.CLASS) {
      newCandidates[selectedGrade][role.id] = updater(newCandidates[selectedGrade][role.id] || []);
    } else {
      newCandidates[selectedGrade][key] = newCandidates[selectedGrade][key] || {};
      newCandidates[selectedGrade][key][role.id] = updater(newCandidates[selectedGrade][key][role.id] || []);
    }

    onUpdateCandidates(newCandidates);
  };

  const handleEditStart = (candidate) => {
    setEditingId(candidate.id);
    setEditData({ ...candidate });
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const maxSize = 450;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        img.onerror = () => reject(new Error('Could not read selected image'));
        img.src = reader.result;
      };

      reader.onerror = () => reject(new Error('Could not read selected file'));
      reader.readAsDataURL(file);
    });

  const handlePhotoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Please choose an image file');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    try {
      const photoUrl = await readImageAsDataUrl(file);
      handleEditChange('photoUrl', photoUrl);
      setSaveMessage('Photo selected');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Error loading photo:', err);
      setSaveMessage('Failed to load photo');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleSave = (role) => {
    updateRoleCandidates(role, (roleCandidates) =>
      roleCandidates.map((candidate) => (candidate.id === editingId ? editData : candidate))
    );

    setEditingId(null);
    setSaveMessage('Candidate saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAddCandidate = (role) => {
    const group = role.scope === ROLE_SCOPES.GROUP ? selectedGroup : null;
    const key = role.scope === ROLE_SCOPES.TUITION ? ALL_SCOPE : group;
    const roleCandidates = getRoleCandidates(role);
    const nextIndex = roleCandidates.length;
    const newCandidate = {
      id: [selectedGrade, key || ALL_SCOPE, role.id, Date.now()].join('-'),
      name: '',
      photoUrl: '',
      symbol: '',
      details: '',
      role: role.id,
      roleLabel: role.label,
      grade: selectedGrade,
      group,
      scope: role.scope
    };

    updateRoleCandidates(role, (items) => [...items, newCandidate]);
    setEditingId(newCandidate.id);
    setEditData(newCandidate);
    setSaveMessage(`Candidate slot ${nextIndex + 1} added`);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleRemoveCandidate = (role, candidateId) => {
    updateRoleCandidates(role, (items) => items.filter((candidate) => candidate.id !== candidateId));
    if (editingId === candidateId) setEditingId(null);
  };

  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    setSelectedGroup(hasGroups(newGrade) ? 'Science' : '');
    setEditingId(null);
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h2>Admin Panel - Manage Election</h2>
        <div className="admin-actions">
          {showBackButton && (
            <button className="back-btn" onClick={onBack}>
              Back
            </button>
          )}
          <button className="dashboard-btn" onClick={onGoToDashboard}>
            View Results
          </button>
          <button
            className="danger-btn"
            onClick={async () => {
              const didReset = await onResetElection();
              if (didReset) {
                setSaveMessage('All voters reset; sample votes cleared');
                setTimeout(() => setSaveMessage(''), 2500);
              }
            }}
          >
            Reset All Voters
          </button>
          <button
            className="secondary-btn"
            onClick={async () => {
              try {
                await setDoc(doc(db, 'voting', 'session'), { status: 'idle' });
                setSaveMessage('Active voter cleared');
                setTimeout(() => setSaveMessage(''), 2000);
              } catch (err) {
                console.error('Error clearing active voter:', err);
                setSaveMessage('Failed to clear active voter');
                setTimeout(() => setSaveMessage(''), 2000);
              }
            }}
          >
            Clear Active Voter
          </button>

          <button
            className="secondary-btn"
            onClick={async () => {
              try {
                const sessionSnap = await getDoc(doc(db, 'voting', 'session'));
                const votesRef = doc(db, 'voting', 'votes');
                const votesSnap = await getDoc(votesRef);

                const activeUser = sessionSnap.exists() ? sessionSnap.data().activeUser : null;
                if (!activeUser || !activeUser.voterKey) {
                  setSaveMessage('No active voter found');
                  setTimeout(() => setSaveMessage(''), 2000);
                  return;
                }

                const existingVotes = votesSnap.exists() ? votesSnap.data().votes || [] : [];
                const filtered = existingVotes.filter((v) => v.voterKey !== activeUser.voterKey);
                await setDoc(votesRef, { votes: filtered });
                // Also clear session so admin can activate next voter
                await setDoc(doc(db, 'voting', 'session'), { status: 'idle' });
                setSaveMessage('Removed voter vote; voter can vote again');
                setTimeout(() => setSaveMessage(''), 2000);
              } catch (err) {
                console.error('Error allowing voter again:', err);
                setSaveMessage('Failed to allow voter again');
                setTimeout(() => setSaveMessage(''), 2000);
              }
            }}
          >
            Allow Voter Again
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {saveMessage && <div className="success-message">{saveMessage}</div>}

      <div className="admin-controls">
        <div className="control-group">
          <label>Select Grade</label>
          <select value={selectedGrade} onChange={(e) => handleGradeChange(e.target.value)}>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>

        {showGroups && (
          <div className="control-group">
            <label>Select Group for group roles</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setEditingId(null);
              }}
            >
              {GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="candidates-management">
        {roles.map((role) => {
          const roleCandidates = getRoleCandidates(role);
          const scopeGroup = role.scope === ROLE_SCOPES.GROUP ? selectedGroup : '';

          return (
            <div key={role.id} className="role-management-section">
              <div className="role-heading">
                <div>
                  <h3>{role.label}</h3>
                  <p>{getRoleScopeLabel(role, scopeGroup)}. Winners needed: {role.seats || 1}</p>
                </div>
                <button className="edit-btn" onClick={() => handleAddCandidate(role)}>
                  Add Candidate
                </button>
              </div>

              <div className="candidates-list">
                {roleCandidates.map((candidate, index) => (
                  <div key={candidate.id} className="candidate-edit-item">
                    {editingId === candidate.id ? (
                      <div className="edit-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Name</label>
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => handleEditChange('name', e.target.value)}
                              placeholder="Candidate name"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label>Symbol</label>
                            <input
                              type="text"
                              value={editData.symbol}
                              onChange={(e) => handleEditChange('symbol', e.target.value)}
                              placeholder="Star, Book, Pen..."
                              className="form-input"
                              maxLength="20"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Candidate Details</label>
                          <input
                            type="text"
                            value={editData.details || ''}
                            onChange={(e) => handleEditChange('details', e.target.value)}
                            placeholder="Example: 12th Science, standing for coordinator"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Candidate Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoFileChange}
                            className="form-input file-input"
                          />
                        </div>

                        {editData.photoUrl && (
                          <div className="photo-preview-row">
                            <div className="photo-preview">
                              <img src={editData.photoUrl} alt="Preview" />
                            </div>
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => handleEditChange('photoUrl', '')}
                            >
                              Remove Photo
                            </button>
                          </div>
                        )}

                        <div className="form-actions">
                          <button className="save-btn" onClick={() => handleSave(role)}>Save</button>
                          <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="candidate-display">
                        <div className="candidate-avatar">
                          {candidate.photoUrl ? (
                            <img src={candidate.photoUrl} alt={candidate.name || 'Candidate'} />
                          ) : (
                            <div className="avatar-placeholder">{candidate.symbol || 'ID'}</div>
                          )}
                        </div>
                        <div className="candidate-details">
                          <p className="candidate-name">{candidate.name || '(Not set)'}</p>
                          <p className="candidate-symbol">Symbol: {candidate.symbol || 'Not set'}</p>
                          <p className="candidate-position">{candidate.details || `Candidate slot ${index + 1}`}</p>
                        </div>
                        <div className="candidate-actions">
                          <button className="edit-btn" onClick={() => handleEditStart(candidate)}>
                            Edit
                          </button>
                          <button className="remove-btn" onClick={() => handleRemoveCandidate(role, candidate.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminPanel;
