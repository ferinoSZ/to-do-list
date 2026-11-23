const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
const TASKS_PATH = import.meta.env.VITE_TASKS_PATH || '/tarefas'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  const rawBody = await response.text()
  let body = null

  if (rawBody) {
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = rawBody
    }
  }

  if (!response.ok) {
    const message = body?.detail || body?.message || `Erro HTTP ${response.status}`
    throw new Error(message)
  }

  return body
}

function splitDateTime(value) {
  if (!value) return { dueDate: null, dueTime: null }

  
  if (typeof value === 'string') {
    const mysqlMatch = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
    if (mysqlMatch) {
      return { dueDate: mysqlMatch[1], dueTime: mysqlMatch[2] }
    }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return { dueDate: null, dueTime: null }
  }

  const pad = (number) => String(number).padStart(2, '0')
  const useUtc = typeof value === 'string' && value.includes('GMT')
  const year = useUtc ? parsed.getUTCFullYear() : parsed.getFullYear()
  const month = useUtc ? parsed.getUTCMonth() + 1 : parsed.getMonth() + 1
  const day = useUtc ? parsed.getUTCDate() : parsed.getDate()
  const hours = useUtc ? parsed.getUTCHours() : parsed.getHours()
  const minutes = useUtc ? parsed.getUTCMinutes() : parsed.getMinutes()

  return {
    dueDate: `${year}-${pad(month)}-${pad(day)}`,
    dueTime: `${pad(hours)}:${pad(minutes)}`,
  }
}

export function normalizeTask(rawTask) {
  if (Array.isArray(rawTask)) {
    const [id, titulo, descricao, status, dataHora, prioridade, categoria] = rawTask
    const { dueDate, dueTime } = splitDateTime(dataHora)

    return {
      id,
      title: titulo || '',
      description: descricao || '',
      status: status || 'Pendente',
      dueDate,
      dueTime,
      priority: prioridade || '',
      category: categoria || '',
    }
  }

  const dataHora = rawTask?.data_hora ?? rawTask?.dataHora ?? null
  const { dueDate, dueTime } = splitDateTime(dataHora)

  return {
    id: rawTask?.id,
    title: rawTask?.titulo ?? rawTask?.title ?? '',
    description: rawTask?.descricao ?? rawTask?.description ?? '',
    status: rawTask?.status ?? 'Pendente',
    dueDate,
    dueTime,
    priority: rawTask?.prioridade ?? rawTask?.priority ?? '',
    category: rawTask?.categoria ?? rawTask?.category ?? '',
  }
}

export async function getTasks() {
  const data = await request(TASKS_PATH)

  if (data?.message && !Array.isArray(data?.tarefas)) {
    throw new Error(data.message)
  }

  const list = Array.isArray(data) ? data : (data?.tarefas || [])
  return list.map(normalizeTask)
}

export async function createTask(task) {
  const dataHora = `${task.dueDate} ${task.dueTime}:00`

  const data = await request(TASKS_PATH, {
    method: 'POST',
    body: JSON.stringify({
      titulo: task.title,
      descricao: task.description,
      status: task.status,
      data_hora: dataHora,
      prioridade: task.priority,
      categoria: task.category,
    }),
  })

  if (data?.message && data.message !== 'Tarefa criada com sucesso!') {
    throw new Error(data.message)
  }

  return data
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  tasksPath: TASKS_PATH,
}
