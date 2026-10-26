import { request } from './client';

export async function startRound(body) {
  const { job } = await request('/api/studio/rounds', { method: 'POST', body });
  return job;
}

export async function fetchRoundJob(id, { signal } = {}) {
  const { job } = await request(`/api/studio/rounds/${encodeURIComponent(id)}`, { signal });
  return job;
}

export async function proposeDirection(body) {
  const { proposal } = await request('/api/studio/direct', { method: 'POST', body });
  return proposal;
}

export async function suggestVariants(body) {
  const { variants } = await request('/api/studio/suggest', { method: 'POST', body });
  return variants;
}
