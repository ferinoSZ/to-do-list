import { request, sendRequest } from './api.js'

export const PAGE_SIZE = 4
const prefix = account => `minhas-tarefas.caderno.v1.${account}.`
const draftKey = (account, id) => prefix(account) + 'draft.' + id
const marker = account => prefix(account) + 'editing'

function options(account, method, data) {
  return { method, headers: { 'X-Conta': String(account) }, ...(data && { body: JSON.stringify(data) }) }
}

export function interrupted(account) {
  try { return localStorage.getItem(marker(account)) } catch { return null }
}

export function clearMarker(account, id) {
  if (interrupted(account) === id) localStorage.removeItem(marker(account))
}

export function revisionAfter(previous = 0) {
  return Math.max(Date.now() * 1000, previous + 1)
}

export function keepLocal(account, entry) {
  localStorage.setItem(draftKey(account, entry.id), JSON.stringify(entry))
  localStorage.setItem(marker(account), entry.id)
}

function acknowledge(account, entry) {
  try {
    const key = draftKey(account, entry.id)
    const current = localStorage.getItem(key)
    if (current && JSON.parse(current).revision <= entry.revision) localStorage.removeItem(key)
  } catch { /* A confirmação no servidor também vale com armazenamento local bloqueado. */ }
}

export async function syncEntry(account, entry, keepalive = false) {
  await sendRequest('/caderno/' + entry.id, { ...options(account, 'PUT', entry), keepalive })
  acknowledge(account, entry)
}

export async function readBook(account) {
  const start = prefix(account) + 'draft.'
  let keys = []
  try { keys = Object.keys(localStorage).filter(key => key.startsWith(start)) } catch { /* Usar a cópia da conta. */ }
  for (const key of keys) {
    const value = localStorage.getItem(key)
    if (value) await syncEntry(account, JSON.parse(value))
  }
  return (await sendRequest('/caderno', options(account, 'GET'))).items
}

export async function publishEntry(account, entry, fromBook) {
  await request(`/caderno/${entry.id}/salvar`, options(account, 'POST', { ...entry, fromBook }))
  acknowledge(account, entry)
  clearMarker(account, entry.id)
}

export function markEntry(account, id, done) {
  return request('/caderno/' + id, options(account, 'PATCH', { done }))
}

export function archivePage(account, page) {
  return request(`/caderno/folhas/${page}/arquivar`, options(account, 'POST'))
}
