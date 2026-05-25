const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5195';

export class HttpError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

const readErrorResponse = async (res: Response) => {
  const raw = await res.text();
  if (!raw) {
    return { message: `HTTP ${res.status}`, data: null };
  }
  try {
    const data = JSON.parse(raw);
    const message =
      data?.message ||
      data?.Message ||
      data?.error ||
      data?.Error ||
      raw;
    return { message: String(message), data };
  } catch {
    return { message: raw, data: null };
  }
};

export const http = {
  async get<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
    return res.json();
  },

  async post<T>(path: string, body: any, token?: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
    return res.json();
  },

  async put<T>(path: string, body: any, token?: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
    return res.json();
  },

  async delete(path: string, token?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok && res.status !== 204) {
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
  }
};

export { API_BASE_URL };
