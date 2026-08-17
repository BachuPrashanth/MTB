import type { RecordData } from './types';

// Vite reads this value from vite.config.ts.
//
// Local development:
// BASE_URL = /
// API_BASE_URL = /api
//
// Production build:
// BASE_URL = /mtb/
// API_BASE_URL = /mtb/api

const API_BASE_URL = `${import.meta.env.BASE_URL}api`;

function urlFor(endpoint: string, parentId?: number, search?: string) {
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', String(parentId));
  if (search) params.set('search', search);
  const query = params.toString();
  return `${API_BASE_URL}/${endpoint}${query ? `?${query}` : ''}`;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? 'Request failed.');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  list(endpoint: string, parentId?: number, search?: string) {
    return request<RecordData[]>(urlFor(endpoint, parentId, search));
  },
  create(endpoint: string, data: RecordData, parentId?: number) {
    return request<RecordData>(urlFor(endpoint, parentId), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update(endpoint: string, id: number, data: RecordData) {
    return request<RecordData>(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove(endpoint: string, id: number) {
    return request<void>(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
  }
};
