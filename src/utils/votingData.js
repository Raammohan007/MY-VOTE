export const GRADES = ['9', '10', '11', '12'];
export const VOTER_GRADES = ['Primary', '6', '7', '8', '9', '10', '11', '12'];
export const GROUPS = ['Science', 'Commerce'];
export const ALL_SCOPE = 'all';

export const ROLE_SCOPES = {
  CLASS: 'class',
  GROUP: 'group',
  TUITION: 'tuition'
};

export const getRolesForGrade = (grade) => {
  const gradeNumber = parseInt(grade, 10);

  if (gradeNumber === 9 || gradeNumber === 10) {
    return [
      {
        id: 'studentCoordinators',
        label: 'Student Coordinators (Top 3)',
        shortLabel: 'Coordinators',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'studentVolunteers',
        label: 'Student Volunteers (Top 3)',
        shortLabel: 'Volunteers',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      }
    ];
  }

  if (gradeNumber === 11) {
    return [
      {
        id: 'studentCoordinator',
        label: 'Student Coordinators (Top 3)',
        shortLabel: 'Coordinators',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'volunteer',
        label: 'Volunteers (Top 3)',
        shortLabel: 'Volunteers',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'eventCoordinator',
        label: 'Event Coordinators (Top 3)',
        shortLabel: 'Event Coordinators',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'assistantTuitionLeader',
        label: 'Assistant Tuition Leader',
        shortLabel: 'Assistant Tuition Leader',
        scope: ROLE_SCOPES.TUITION,
        seats: 1
      },
      {
        id: 'assistantOverallIncharge',
        label: 'Assistant Overall Incharge',
        shortLabel: 'Assistant Overall',
        scope: ROLE_SCOPES.TUITION,
        seats: 1
      }
    ];
  }

  if (gradeNumber === 12) {
    return [
      {
        id: 'studentCoordinator',
        label: 'Student Coordinators (Top 3)',
        shortLabel: 'Coordinators',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'volunteer',
        label: 'Volunteers (Top 3)',
        shortLabel: 'Volunteers',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'eventCoordinator',
        label: 'Event Coordinators (Top 3)',
        shortLabel: 'Event Coordinators',
        scope: ROLE_SCOPES.CLASS,
        seats: 3
      },
      {
        id: 'overallIncharge',
        label: 'Overall Incharge',
        shortLabel: 'Overall Incharge',
        scope: ROLE_SCOPES.TUITION,
        seats: 1
      }
    ];
  }

  return [];
};

export const hasGroups = (grade) => false;

export const getGradeLabel = (grade) => (grade === 'Primary' ? 'Primary Class' : `Grade ${grade}`);

export const isTuitionWideRole = (role) => role?.scope === ROLE_SCOPES.TUITION;

export const getRoleScopeLabel = (role, group = '') => {
  if (role.scope === ROLE_SCOPES.TUITION) return 'All tuition students and teachers';
  if (role.scope === ROLE_SCOPES.GROUP) return `${group || 'Selected group'} students and teachers`;
  return 'This class students and teachers';
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

const LEGACY_COMMON_ROLE_IDS = {
  studentCoordinators: ['boyCoordinator', 'girlCoordinator'],
  studentVolunteers: ['boyVolunteer', 'girlVolunteer']
};

const mergeLegacyClassCandidates = (savedCandidates, grade, role) => {
  const existing = savedCandidates?.[grade]?.[role.id] || [];
  const legacyCandidates = (LEGACY_COMMON_ROLE_IDS[role.id] || [])
    .flatMap((legacyRoleId) => savedCandidates?.[grade]?.[legacyRoleId] || [])
    .filter((candidate) => candidate?.name?.trim());

  const migratedGroupCandidates = GROUPS.flatMap((group) =>
    (savedCandidates?.[grade]?.[group]?.[role.id] || []).filter((candidate) => candidate?.name?.trim())
  );

  return [...existing, ...legacyCandidates, ...migratedGroupCandidates];
};

export const initializeCandidates = () => {
  const candidates = {};

  GRADES.forEach((grade) => {
    candidates[grade] = {};

    getRolesForGrade(grade).forEach((role) => {
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
};

export const getCandidatesForRole = (candidates, grade, role, group = '') => {
  if (!role) return [];

  if (role.scope === ROLE_SCOPES.TUITION) {
    return candidates[grade]?.[ALL_SCOPE]?.[role.id] || [];
  }

  if (role.scope === ROLE_SCOPES.GROUP) {
    if (!group) return [];
    return candidates[grade]?.[group]?.[role.id] || [];
  }

  return candidates[grade]?.[role.id] || [];
};

export const normalizeCandidates = (savedCandidates) => {
  const defaults = initializeCandidates();
  const merged = JSON.parse(JSON.stringify(defaults));

  GRADES.forEach((grade) => {
    const roles = getRolesForGrade(grade);

    roles.forEach((role) => {
      if (role.scope === ROLE_SCOPES.TUITION) {
        const existing =
          savedCandidates?.[grade]?.[ALL_SCOPE]?.[role.id] ||
          savedCandidates?.[grade]?.Science?.[role.id] ||
          savedCandidates?.[grade]?.Commerce?.[role.id] ||
          [];
        merged[grade][ALL_SCOPE][role.id] = merged[grade][ALL_SCOPE][role.id].map((candidate, index) => ({
          ...candidate,
          ...(existing[index] || {})
        }));
        return;
      }

      if (role.scope === ROLE_SCOPES.GROUP) {
        GROUPS.forEach((group) => {
          const existing = savedCandidates?.[grade]?.[group]?.[role.id] || [];
          merged[grade][group][role.id] = merged[grade][group][role.id].map((candidate, index) => ({
            ...candidate,
            ...(existing[index] || {})
          }));
        });
        return;
      }

      const existing = mergeLegacyClassCandidates(savedCandidates, grade, role);
      merged[grade][role.id] = merged[grade][role.id].map((candidate, index) => ({
        ...candidate,
        ...(existing[index] || {})
      }));
    });
  });

  return merged;
};
