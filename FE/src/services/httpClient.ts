const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5195';

const getActorHeaders = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return {};
    const user = JSON.parse(raw);
    const rawFullName = user?.fullName || user?.hoTen || user?.HoTen || '';
    const fullName = String(rawFullName)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
    const role = user?.role || user?.quyen || user?.Quyen || '';
    const userId = user?.id || user?.maNguoiDung || user?.MaNguoiDung || '';
    return {
      ...(fullName ? { 'X-User-Name': String(fullName) } : {}),
      ...(role ? { 'X-User-Role': String(role) } : {}),
      ...(userId ? { 'X-User-Id': String(userId) } : {})
    };
  } catch {
    return {};
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
};

const withAuthHeader = (token?: string) => {
  const bearer = token || getStoredToken();
  return bearer ? { Authorization: `Bearer ${bearer}` } : {};
};

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

const handleUnauthorized = (status: number) => {
  if (status !== 401) return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}
  window.dispatchEvent(new Event('auth-changed'));
  window.dispatchEvent(new Event('session-expired'));
};

export const http = {
  async get<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...withAuthHeader(token)
      }
    });
    if (!res.ok) {
      handleUnauthorized(res.status);
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
        ...getActorHeaders(),
        ...withAuthHeader(token)
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      handleUnauthorized(res.status);
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
        ...getActorHeaders(),
        ...withAuthHeader(token)
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      handleUnauthorized(res.status);
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
    return res.json();
  },

  async delete(path: string, token?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        ...getActorHeaders(),
        ...withAuthHeader(token)
      }
    });
    if (!res.ok && res.status !== 204) {
      handleUnauthorized(res.status);
      const { message, data } = await readErrorResponse(res);
      throw new HttpError(message, res.status, data);
    }
  }
};

export { API_BASE_URL };
