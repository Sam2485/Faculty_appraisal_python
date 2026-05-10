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

  const data = await res.json().catch(() => null)

  if (res.status === 401) {
    if (localStorage.getItem('admin_token')) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_profile')
      window.location.href = '/panel/login'
      return
    }
    throw new Error(data?.user_message || data?.detail || 'Invalid credentials')
  }

  if (!res.ok) {
    const msg = data?.user_message || data?.detail || `Server error (${res.status})`
    throw new Error(msg)
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
  if (!data?.profile) throw new Error('Unexpected response from server.')
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

// ---------------------------------------------------------------------------
// Appraisal cycle config
// ---------------------------------------------------------------------------
const cycle = {
  list:   ()                   => request('/admin/appraisal-config'),
  create: (data)               => request('/admin/appraisal-config', { method: 'POST', body: JSON.stringify(data) }),
  update: (academic_year, data)=> request(`/admin/appraisal-config/${encodeURIComponent(academic_year)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (academic_year)      => request(`/admin/appraisal-config/${encodeURIComponent(academic_year)}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Pending faculty (dedicated endpoint — faster than filtering /admin/users)
// ---------------------------------------------------------------------------
const pending = {
  list: (params = {}) => request('/admin/pending-faculty?' + new URLSearchParams(params)),
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------
const announcements = {
  list:   (params = {}) => request('/admin/announcements?' + new URLSearchParams(params)),
  create: (data)        => request('/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data)    => request(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id)          => request(`/admin/announcements/${id}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Analytics export (file downloads — returns a Blob, not JSON)
// ---------------------------------------------------------------------------
async function downloadFile(path) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.user_message || `Download failed (${res.status})`)
  }
  return res.blob()
}

const exportData = {
  submissions: (params = {}) => downloadFile('/admin/export/submissions?' + new URLSearchParams(params)),
  faculty:     (params = {}) => downloadFile('/admin/export/faculty?' + new URLSearchParams(params)),
}

export const api = { login, logout, getProfile, users, stats, feedback, config, cycle, pending, announcements, export: exportData }
