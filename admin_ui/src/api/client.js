const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('admin_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_profile')
    window.location.href = '/panel/login'
    return
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.user_message || 'Request failed')
  }

  return data
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data.profile.appraisal_role !== 'admin') {
    throw new Error('This account does not have admin access.')
  }
  localStorage.setItem('admin_token', data.token)
  localStorage.setItem('admin_profile', JSON.stringify(data.profile))
  return data
}

function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_profile')
}

function getProfile() {
  const raw = localStorage.getItem('admin_profile')
  return raw ? JSON.parse(raw) : null
}

// ---------------------------------------------------------------------------
// Faculty / users
// ---------------------------------------------------------------------------
const users = {
  list: (params = {}) => request('/admin/users?' + new URLSearchParams(params)),
  create: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (email, data) => request(`/admin/users/${encodeURIComponent(email)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (email) => request(`/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Stats / submission tracking
// ---------------------------------------------------------------------------
const stats = {
  get: (academic_year) => {
    const qs = academic_year ? `?academic_year=${academic_year}` : ''
    return request(`/admin/stats${qs}`)
  },
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
const feedback = {
  list: (params = {}) => request('/feedback?' + new URLSearchParams(params)),
  get: (id) => request(`/feedback/${id}`),
}

// ---------------------------------------------------------------------------
// Config (settings)
// ---------------------------------------------------------------------------
const config = {
  get: () => request('/admin/config'),
  update: (data) => request('/admin/config', { method: 'PUT', body: JSON.stringify(data) }),
}

export const api = { login, logout, getProfile, users, stats, feedback, config }
