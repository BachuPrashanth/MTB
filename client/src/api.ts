import type { RecordData } from './types';

function urlFor(endpoint: string, parentId?: number, search?: string) {
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', String(parentId));
  if (search) params.set('search', search);
  const query = params.toString();
  return `/api/${endpoint}${query ? `?${query}` : ''}`;
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
    return request<RecordData>(`/api/${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove(endpoint: string, id: number) {
    return request<void>(`/api/${endpoint}/${id}`, { method: 'DELETE' });
  }
};
