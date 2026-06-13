#!/usr/bin/env node
/*
  Reset voting data script
  Usage:
    node scripts/resetVotingData.js [path/to/serviceAccount.json] [--resetCandidates]
  Or set GOOGLE_APPLICATION_CREDENTIALS env var for ADC.
*/
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
let serviceAccountPath = args[0] && !args[0].startsWith('--') ? args[0] : null;
const resetCandidates = args.includes('--resetCandidates');

if (!serviceAccountPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

if (serviceAccountPath && !fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found:', serviceAccountPath);
  process.exit(1);
}

try {
  if (serviceAccountPath) {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK:', err.message || err);
  process.exit(1);
}

const db = admin.firestore();

async function resetVotesAndSession() {
  console.log('Clearing votes and resetting session...');
  await db.collection('voting').doc('votes').set({ votes: [] });
  await db.collection('voting').doc('session').set({ status: 'idle' });
  console.log('Votes cleared and session reset.');
}

// Minimal copy of initializeCandidates from src/utils/votingData.js
function buildDefaultCandidates() {
  const GRADES = ['9', '10', '11', '12'];
  const GROUPS = ['Science', 'Commerce'];
  const ALL_SCOPE = 'all';

  const ROLE_SCOPES = {
    CLASS: 'class',
    GROUP: 'group',
    TUITION: 'tuition'
  };

  const getRolesForGrade = (grade) => {
    const gradeNumber = parseInt(grade, 10);

    if (gradeNumber === 9 || gradeNumber === 10) {
      return [
        { id: 'boyCoordinator', label: 'Boy Student Coordinator', shortLabel: 'Boy Coordinator', scope: ROLE_SCOPES.CLASS, seats: 1 },
        { id: 'girlCoordinator', label: 'Girl Student Coordinator', shortLabel: 'Girl Coordinator', scope: ROLE_SCOPES.CLASS, seats: 1 },
        { id: 'boyVolunteer', label: 'Boy Volunteer', shortLabel: 'Boy Volunteer', scope: ROLE_SCOPES.CLASS, seats: 1 },
        { id: 'girlVolunteer', label: 'Girl Volunteer', shortLabel: 'Girl Volunteer', scope: ROLE_SCOPES.CLASS, seats: 1 }
      ];
    }

    if (gradeNumber === 11) {
      return [
        { id: 'studentCoordinator', label: 'Student Coordinator', shortLabel: 'Coordinator', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'volunteer', label: 'Volunteer', shortLabel: 'Volunteer', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'eventCoordinator', label: 'Event Coordinator', shortLabel: 'Event Coordinator', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'assistantTuitionLeader', label: 'Assistant Tuition Leader', shortLabel: 'Assistant Tuition Leader', scope: ROLE_SCOPES.TUITION, seats: 1 },
        { id: 'assistantOverallIncharge', label: 'Assistant Overall Incharge', shortLabel: 'Assistant Overall', scope: ROLE_SCOPES.TUITION, seats: 1 }
      ];
    }

    if (gradeNumber === 12) {
      return [
        { id: 'studentCoordinator', label: 'Student Coordinator', shortLabel: 'Coordinator', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'volunteer', label: 'Volunteer', shortLabel: 'Volunteer', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'eventCoordinator', label: 'Event Coordinator', shortLabel: 'Event Coordinator', scope: ROLE_SCOPES.GROUP, seats: 1 },
        { id: 'overallIncharge', label: 'Overall Incharge', shortLabel: 'Overall Incharge', scope: ROLE_SCOPES.TUITION, seats: 1 }
      ];
    }

    return [];
  };

  const makeCandidate = (grade, role, index, group = null) => ({
    id: [grade, group || ALL_SCOPE, role.id, index].join('-'),
    name: '',
    photoUrl: '',
    symbol: '',
    details: '',
    role: role.id,
    roleLabel: role.label,
    grade,
    group,
    scope: role.scope
  });

  const makeCandidateSlots = (grade, role, group = null) =>
    Array(Math.max((role.seats || 1) + 2, 3))
      .fill(null)
      .map((_, index) => makeCandidate(grade, role, index, group));

  const candidates = {};
  GRADES.forEach((grade) => {
    candidates[grade] = {};
    const roles = getRolesForGrade(grade);
    roles.forEach((role) => {
      if (role.scope === ROLE_SCOPES.TUITION) {
        candidates[grade][ALL_SCOPE] = candidates[grade][ALL_SCOPE] || {};
        candidates[grade][ALL_SCOPE][role.id] = makeCandidateSlots(grade, role);
        return;
      }

      if (role.scope === ROLE_SCOPES.GROUP) {
        GROUPS.forEach((group) => {
          candidates[grade][group] = candidates[grade][group] || {};
          candidates[grade][group][role.id] = makeCandidateSlots(grade, role, group);
        });
        return;
      }

      candidates[grade][role.id] = makeCandidateSlots(grade, role);
    });
  });

  return candidates;
}

async function resetCandidatesToDefaults() {
  console.log('Resetting candidates to default blank slots...');
  const candidates = buildDefaultCandidates();
  await db.collection('voting').doc('candidates').set({ candidates });
  console.log('Candidates reset.');
}

async function main() {
  try {
    await resetVotesAndSession();
    if (resetCandidates) {
      await resetCandidatesToDefaults();
    }
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting voting data:', err);
    process.exit(1);
  }
}

main();
