/**
 * Fomi Studio state: normalized (shots → rounds → takes by id) so an update
 * to one take leaves every other object untouched and memoized cards skip
 * re-rendering. Pure reducer, so every interaction is predictable and easy
 * to test.
 */

export const PERSIST_KEY = 'fomi.studio';
export const PERSIST_VERSION = 3;

export function buildInitialState(project) {
  const shots = {};
  const rounds = {};
  const takes = {};

  for (const shot of project.shots) {
    const { rounds: shotRounds, ...rest } = shot;
    shots[shot.id] = { ...rest, roundIds: shotRounds.map((round) => round.id) };
    for (const round of shotRounds) {
      const { takes: roundTakes, ...roundRest } = round;
      rounds[round.id] = { ...roundRest, shotId: shot.id, takeIds: roundTakes.map((take) => take.id) };
      for (const take of roundTakes) takes[take.id] = { ...take, roundId: round.id, shotId: shot.id };
    }
  }

  const { shots: _ignored, ...meta } = project;
  return {
    project: meta,
    shotOrder: project.shots.map((shot) => shot.id),
    shots,
    rounds,
    takes,
    activeShotId: project.shots[0].id,
    filter: 'all',
    hideRejects: false,
    focusedTakeId: null,
    compare: [],
    panels: { rail: true, direction: true },
    jobs: {},
    proposal: null,
    viewer: null,
  };
}

/** The parts of state worth keeping between visits. */
export const persistable = ({ shots, rounds, takes, activeShotId, panels, hideRejects }) => ({
  shots,
  rounds,
  takes,
  activeShotId,
  panels,
  hideRejects,
});

const updateShot = (state, shotId, patch) => ({
  ...state,
  shots: { ...state.shots, [shotId]: { ...state.shots[shotId], ...patch } },
});

export function studioReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.saved };

    case 'reset':
      return { ...action.initial };

    case 'selectShot':
      if (state.activeShotId === action.shotId) return state;
      return { ...state, activeShotId: action.shotId, focusedTakeId: null, compare: [], proposal: null };

    case 'rate': {
      const take = state.takes[action.takeId];
      if (!take) return state;
      const rating = take.rating === action.rating ? null : action.rating;
      return { ...state, takes: { ...state.takes, [take.id]: { ...take, rating } } };
    }

    case 'setFinal': {
      const shot = state.shots[action.shotId];
      const finalTakeId = shot.finalTakeId === action.takeId ? null : action.takeId;
      const next = updateShot(state, action.shotId, { finalTakeId });
      // A final is always a pick.
      const take = state.takes[action.takeId];
      if (finalTakeId && take && take.rating !== 'pick') {
        next.takes = { ...state.takes, [take.id]: { ...take, rating: 'pick' } };
      }
      return next;
    }

    case 'setField': {
      const shot = state.shots[action.shotId];
      if (shot.direction[action.field] === action.value) return state;
      return updateShot(state, action.shotId, { direction: { ...shot.direction, [action.field]: action.value } });
    }

    case 'toggleLock': {
      const shot = state.shots[action.shotId];
      return updateShot(state, action.shotId, { locks: { ...shot.locks, [action.field]: !shot.locks[action.field] } });
    }

    case 'branch': {
      const take = state.takes[action.takeId];
      if (!take) return state;
      return updateShot(state, take.shotId, { direction: { ...take.direction }, basedOnTakeId: take.id });
    }

    case 'setFilter':
      return { ...state, filter: action.filter };

    case 'toggleHideRejects':
      return { ...state, hideRejects: !state.hideRejects };

    case 'togglePanel':
      return { ...state, panels: { ...state.panels, [action.panel]: action.open ?? !state.panels[action.panel] } };

    case 'setPanels':
      return { ...state, panels: { ...state.panels, ...action.panels } };

    case 'focusTake':
      return state.focusedTakeId === action.takeId ? state : { ...state, focusedTakeId: action.takeId };

    case 'toggleCompare': {
      const exists = state.compare.includes(action.takeId);
      const compare = exists ? state.compare.filter((id) => id !== action.takeId) : [...state.compare, action.takeId].slice(-2);
      return { ...state, compare };
    }

    case 'clearCompare':
      return state.compare.length ? { ...state, compare: [] } : state;

    case 'jobStarted':
      return { ...state, jobs: { ...state.jobs, [action.shotId]: action.job }, filter: 'all' };

    case 'jobProgress': {
      const job = state.jobs[action.shotId];
      if (!job || job.progress >= action.progress) return state;
      return { ...state, jobs: { ...state.jobs, [action.shotId]: { ...job, progress: action.progress } } };
    }

    case 'jobFailed': {
      const { [action.shotId]: _failed, ...jobs } = state.jobs;
      return { ...state, jobs };
    }

    case 'roundAdded': {
      const { round, shotId } = action;
      const { [shotId]: _done, ...jobs } = state.jobs;
      const takes = { ...state.takes };
      for (const take of round.takes) takes[take.id] = { ...take, roundId: round.id, shotId, fresh: true };
      const { takes: roundTakes, ...roundRest } = round;
      const shot = state.shots[shotId];
      return {
        ...state,
        jobs,
        takes,
        rounds: { ...state.rounds, [round.id]: { ...roundRest, shotId, takeIds: roundTakes.map((take) => take.id) } },
        shots: { ...state.shots, [shotId]: { ...shot, roundIds: [...shot.roundIds, round.id], direction: round.base } },
        focusedTakeId: roundTakes[0]?.id ?? state.focusedTakeId,
      };
    }

    case 'settleFresh': {
      const takes = { ...state.takes };
      for (const id of action.takeIds) if (takes[id]) takes[id] = { ...takes[id], fresh: false };
      return { ...state, takes };
    }

    case 'proposalLoading':
      return { ...state, proposal: { shotId: action.shotId, instruction: action.instruction, status: 'loading', changes: [], skipped: [] } };

    case 'proposalReady':
      return state.proposal?.instruction === action.proposal.instruction
        ? { ...state, proposal: { ...action.proposal, shotId: state.proposal.shotId, status: 'ready' } }
        : state;

    case 'proposalCleared':
      return state.proposal ? { ...state, proposal: null } : state;

    case 'openViewer':
      return { ...state, viewer: { takeId: action.takeId, compareId: action.compareId ?? null }, focusedTakeId: action.takeId };

    case 'viewerShow':
      return state.viewer ? { ...state, viewer: { ...state.viewer, takeId: action.takeId }, focusedTakeId: action.takeId } : state;

    case 'viewerCompare':
      return state.viewer ? { ...state, viewer: { ...state.viewer, compareId: action.compareId } } : state;

    case 'closeViewer':
      return state.viewer ? { ...state, viewer: null } : state;

    default:
      return state;
  }
}

/* ----------------------------------------------------------- selectors -- */

export function shotSummary(state, shotId) {
  const shot = state.shots[shotId];
  let picks = 0;
  let unrated = 0;
  let total = 0;
  for (const roundId of shot.roundIds) {
    for (const takeId of state.rounds[roundId].takeIds) {
      const rating = state.takes[takeId].rating;
      total += 1;
      if (rating === 'pick') picks += 1;
      if (!rating) unrated += 1;
    }
  }
  const status = shot.finalTakeId ? 'final' : total ? 'progress' : 'todo';
  return { status, picks, unrated, total };
}

/** Takes of a shot in display order (newest round first), honouring filters. */
export function visibleTakeIds(state, shotId) {
  const shot = state.shots[shotId];
  const ids = [];
  for (const roundId of [...shot.roundIds].reverse()) {
    for (const takeId of state.rounds[roundId].takeIds) {
      const take = state.takes[takeId];
      if (state.hideRejects && take.rating === 'reject') continue;
      if (state.filter === 'picks' && take.rating !== 'pick') continue;
      if (state.filter === 'unrated' && take.rating) continue;
      ids.push(takeId);
    }
  }
  return ids;
}
