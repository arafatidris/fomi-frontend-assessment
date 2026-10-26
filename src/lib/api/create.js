import { request } from './client';

export function fetchGenerations({ type, cursor, limit = 6, signal }) {
  const params = new URLSearchParams({ type, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return request(`/api/generations?${params}`, { signal });
}

export async function createGeneration(input, { signal } = {}) {
  const { job } = await request('/api/generations', { method: 'POST', body: input, signal });
  return job;
}

export async function fetchJob(id, { signal } = {}) {
  const { job } = await request(`/api/generations/${encodeURIComponent(id)}`, { signal });
  return job;
}
