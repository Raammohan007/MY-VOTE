import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import {
  getCandidatesForRole,
  getGradeLabel,
  getRoleScopeLabel,
  getRolesForGrade,
  GRADES,
  hasGroups,
  GROUPS,
  ROLE_SCOPES
} from '../utils/votingData';
import '../styles/components.css';

function AdminDashboard({ candidates, votes, onBack, onResetElection, showBackButton = true }) {
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedGroup, setSelectedGroup] = useState('Science');
  const [selectedRole, setSelectedRole] = useState('');

  const showGroups = hasGroups(selectedGrade);
  const roles = getRolesForGrade(selectedGrade);

  useEffect(() => {
    if (!selectedRole && roles.length > 0) {
      setSelectedRole(roles[0].id);
    }
  }, [roles, selectedRole]);

  const currentRole = roles.find((role) => role.id === selectedRole) || roles[0];
  const roleGroup = currentRole?.scope === ROLE_SCOPES.GROUP ? selectedGroup : '';

  const candidatesList = currentRole
    ? getCandidatesForRole(candidates, selectedGrade, currentRole, roleGroup).filter((candidate) => candidate.name.trim())
    : [];

  const roleVotes = useMemo(() => {
    if (!currentRole) return [];

    return votes.filter((vote) => {
      const sameGrade = vote.grade === selectedGrade;
      const sameRole = vote.role === currentRole.id;
      const sameGroup = currentRole.scope !== ROLE_SCOPES.GROUP || vote.group === selectedGroup;
      const tuitionRole = currentRole.scope !== ROLE_SCOPES.TUITION || !vote.group;

      return sameGrade && sameRole && sameGroup && tuitionRole;
    });
  }, [votes, selectedGrade, selectedGroup, currentRole]);

  const tallyData = roleVotes.reduce((tally, vote) => {
    tally[vote.candidateId] = (tally[vote.candidateId] || 0) + 1;
    return tally;
  }, {});

  const chartLabels = candidatesList.map((candidate) => candidate.name);
  const chartVotes = candidatesList.map((candidate) => tallyData[candidate.id] || 0);
  const totalVotes = chartVotes.reduce((total, count) => total + count, 0);

  const chartColors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Votes',
      data: chartVotes,
      backgroundColor: chartColors,
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const barData = {
    labels: chartLabels,
    datasets: [{
      label: 'Candidate votes',
      data: chartVotes,
      backgroundColor: chartColors,
      borderRadius: 8,
      maxBarThickness: 46
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const highestVotes = Math.max(...chartVotes, 1);
  const rankings = candidatesList
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      votes: tallyData[candidate.id] || 0,
      symbol: candidate.symbol,
      details: candidate.details
    }))
    .sort((a, b) => b.votes - a.votes)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  const classSourceRankings = Object.entries(
    roleVotes.reduce((sourceMap, vote) => {
      const voterGradeLabel = getGradeLabel(vote.voterGrade || vote.grade);
      const key = vote.voterType === 'teacher'
        ? 'Teachers'
        : `${voterGradeLabel}${vote.voterGroup ? ` - ${vote.voterGroup}` : ''}`;
      sourceMap[key] = (sourceMap[key] || 0) + 1;
      return sourceMap;
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sourceBarData = {
    labels: classSourceRankings.map((item) => item.name),
    datasets: [{
      label: 'Votes from source',
      data: classSourceRankings.map((item) => item.count),
      backgroundColor: ['#0f766e', '#2563eb', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
      borderRadius: 8,
      maxBarThickness: 40
    }]
  };

  const topThree = rankings.slice(0, 3);

  const allRoleSummaries = useMemo(() => {
    return GRADES.flatMap((grade) => {
      const rolesForGrade = getRolesForGrade(grade);
      return rolesForGrade.flatMap((role) => {
        const groups = role.scope === ROLE_SCOPES.GROUP ? GROUPS : [''];

        return groups.map((group) => {
          const candidatesForExport = getCandidatesForRole(candidates, grade, role, group).filter((candidate) => candidate.name.trim());

          if (candidatesForExport.length === 0) {
            return null;
          }

          const voteCounts = candidatesForExport.reduce((counts, candidate) => {
            counts[candidate.id] = 0;
            return counts;
          }, {});

          votes.forEach((vote) => {
            if (vote.grade !== grade || vote.role !== role.id) return;
            if (role.scope === ROLE_SCOPES.GROUP && vote.group !== group) return;
            if (role.scope === ROLE_SCOPES.TUITION && vote.group) return;
            if (voteCounts[vote.candidateId] !== undefined) {
              voteCounts[vote.candidateId] += 1;
            }
          });

          const rankedCandidates = candidatesForExport
            .map((candidate) => ({
              candidate,
              votes: voteCounts[candidate.id] || 0
            }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3);

          return {
            grade,
            role,
            group,
            rankedCandidates
          };
        });
      }).filter(Boolean);
    });
  }, [votes, candidates]);

  const downloadResultsPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFontSize(18);
    doc.text('Election Results Summary', 40, y);
    y += 20;
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
    y += 24;

    allRoleSummaries.forEach((section, sectionIndex) => {
      const sectionTitle = `Grade ${section.grade} · ${section.role.label}${section.group ? ` · ${section.group}` : ''}`;
      doc.setFontSize(13);
      doc.text(sectionTitle, 40, y);
      y += 16;

      if (section.rankedCandidates.length === 0) {
        doc.setFontSize(11);
        doc.text('No candidates or votes recorded yet.', 48, y);
        y += 14;
      } else {
        section.rankedCandidates.forEach((item, index) => {
          doc.setFontSize(11);
          const candidateLine = `${index + 1}. ${item.candidate.symbol ? `${item.candidate.symbol} ` : ''}${item.candidate.name} — ${item.votes} vote${item.votes !== 1 ? 's' : ''}`;
          doc.text(candidateLine, 48, y, { maxWidth: pageWidth - 96 });
          y += 14;
          if (item.candidate.details) {
            doc.setFontSize(9);
            doc.text(`Details: ${item.candidate.details}`, 56, y, { maxWidth: pageWidth - 104 });
            y += 12;
          }
        });
      }

      y += 10;
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 40;
      }
    });

    if (allRoleSummaries.length === 0) {
      doc.setFontSize(11);
      doc.text('No voting data available to export.', 40, y);
    }

    doc.save('voting-results.pdf');
  };

  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedGroup(hasGroups(grade) ? 'Science' : '');
    const nextRole = getRolesForGrade(grade)[0]?.id || '';
    setSelectedRole(nextRole);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h2>Voting Results Dashboard</h2>
        <div className="dashboard-header-actions">
          <button className="dashboard-btn" onClick={downloadResultsPdf}>
            Download Results PDF
          </button>
          <button className="dashboard-btn" onClick={onResetElection}>
            Reset Election
          </button>
          {showBackButton && <button className="back-btn" onClick={onBack}>Back to Admin</button>}
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="control-group">
          <label>Grade</label>
          <select value={selectedGrade} onChange={(e) => handleGradeChange(e.target.value)}>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>

        {showGroups && (
          <div className="control-group">
            <label>Group for coordinator results</label>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
              {GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        )}

        <div className="control-group">
          <label>Position</label>
          <select value={currentRole?.id || ''} onChange={(e) => setSelectedRole(e.target.value)}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-container">
        <div className="winner-strip">
          {topThree.length > 0 ? topThree.map((item) => (
            <div key={item.id} className={`winner-card rank-${item.rank}`}>
              <span className="winner-rank">#{item.rank}</span>
              <div>
                <h3>{item.symbol && `${item.symbol} `}{item.name}</h3>
                <p>{item.votes} vote{item.votes !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )) : (
            <div className="winner-card empty">
              <span className="winner-rank">--</span>
              <div>
                <h3>No leaders yet</h3>
                <p>Votes will appear here after polling starts</p>
              </div>
            </div>
          )}
        </div>

        <div className="results-section chart-section">
          <div className="section-title">
            <div>
              <h3>{currentRole?.label}</h3>
              <p>{currentRole ? getRoleScopeLabel(currentRole, roleGroup) : ''}</p>
            </div>
            <span className="vote-count">Total Votes: {totalVotes}</span>
          </div>

          {totalVotes > 0 ? (
            <div className="chart-wrapper">
              <Pie data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="no-votes-message">
              <p>No votes yet for this position</p>
            </div>
          )}
        </div>

        <div className="results-section chart-section">
          <div className="section-title">
            <h3>Vote Bar Graph</h3>
          </div>

          {totalVotes > 0 ? (
            <div className="chart-wrapper">
              <Bar data={barData} options={barOptions} />
            </div>
          ) : (
            <div className="no-votes-message">
              <p>Bar graph will appear after votes are submitted</p>
            </div>
          )}
        </div>

        <div className="results-section rankings-section">
          <div className="section-title">
            <h3>First Place to Last Place</h3>
          </div>

          {rankings.length > 0 ? (
            <div className="rankings-list">
              {rankings.map((item) => (
                <div key={item.id} className="ranking-item">
                  <div className="rank-badge">#{item.rank}</div>
                  <div className="rank-info">
                    <span className="rank-name">
                      {item.symbol && `${item.symbol} `}
                      {item.name}
                    </span>
                    {item.details && <span className="rank-detail">{item.details}</span>}
                    <span className="rank-votes">{item.votes} vote{item.votes !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="rank-bar">
                    <div
                      className="rank-bar-fill"
                      style={{ width: `${(item.votes / highestVotes) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No candidates available</p>
            </div>
          )}
        </div>

        <div className="results-section class-source-section">
          <div className="section-title">
            <h3>Highest Vote Source</h3>
          </div>

          {classSourceRankings.length > 0 ? (
            <div className="source-dashboard">
              <div className="chart-wrapper small-chart">
                <Bar data={sourceBarData} options={barOptions} />
              </div>
              <div className="rankings-list">
                {classSourceRankings.map((item, index) => (
                  <div key={item.name} className="ranking-item compact">
                    <div className="rank-badge">#{index + 1}</div>
                    <div className="rank-info">
                      <span className="rank-name">{item.name}</span>
                      <span className="rank-votes">{item.count} vote{item.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>No vote source data yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Total Votes Cast</h4>
          <p className="stat-number">{votes.length}</p>
        </div>
        <div className="stat-card">
          <h4>Grades Voting</h4>
          <p className="stat-number">{new Set(votes.map((vote) => vote.voterGrade || vote.grade)).size}</p>
        </div>
        <div className="stat-card">
          <h4>Candidates in View</h4>
          <p className="stat-number">{candidatesList.length}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
