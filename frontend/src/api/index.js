const BASE = '/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
});

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export const api = {
  auth: {
    signup: (data) => req('POST', '/auth/signup', data),
    login: (data) => req('POST', '/auth/login', data),
    me: () => req('GET', '/auth/me')
  },
  projects: {
    list: () => req('GET', '/projects'),
    get: (id) => req('GET', `/projects/${id}`),
    create: (data) => req('POST', '/projects', data),
    update: (id, data) => req('PUT', `/projects/${id}`, data),
    delete: (id) => req('DELETE', `/projects/${id}`),
    addMember: (id, data) => req('POST', `/projects/${id}/members`, data),
    removeMember: (id, userId) => req('DELETE', `/projects/${id}/members/${userId}`)
  },
  tasks: {
    byProject: (projectId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return req('GET', `/tasks/project/${projectId}${q ? '?' + q : ''}`);
    },
    create: (data) => req('POST', '/tasks', data),
    update: (id, data) => req('PUT', `/tasks/${id}`, data),
    delete: (id) => req('DELETE', `/tasks/${id}`)
  },
  dashboard: {
    get: () => req('GET', '/dashboard')
  }
};
