const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

const listeners = new Set()
let pendingRequests = 0

export function getPendingRequests() {
  return pendingRequests
}

export function subscribeToRequests(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function updatePendingRequests(change) {
  pendingRequests += change
  listeners.forEach(listener => listener())
}

export async function request(path, options = {}) {
  updatePendingRequests(1)
  try {
    return await sendRequest(path, options)
  } finally {
    updatePendingRequests(-1)
  }
}

export async function sendRequest(path, options) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok || data === null) {
    const message = data?.message || data?.erros?.join(' ') || 'Não foi possível concluir a solicitação.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}

export { API_BASE_URL }
