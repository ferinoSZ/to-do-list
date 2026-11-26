import { API_BASE_URL, request } from './api.js'

const TASKS_PATH = import.meta.env.VITE_TASKS_PATH || '/tarefas'

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

export async function getTasks(signal) {
  const data = await request(TASKS_PATH, { signal })

  if (data?.message && !Array.isArray(data?.tarefas)) {
    throw new Error(data.message)
  }

  const list = Array.isArray(data) ? data : (data?.tarefas || [])
  return list.map(normalizeTask)
}

function taskFields(task) {
  return {
    titulo: task.title,
    descricao: task.description,
    status: task.status,
    data_hora: task.dueDate && task.dueTime ? `${task.dueDate} ${task.dueTime}:00` : null,
    prioridade: task.priority,
    categoria: task.category,
  }
}

export function patchTask(id, fields) {
  return request(`${TASKS_PATH}/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
}

export function updateTask(original, edited) {
  const previous = taskFields(original)
  const changes = Object.entries(taskFields(edited)).filter(([key, value]) => previous[key] !== value)
  if (changes.length) return patchTask(original.id, Object.fromEntries(changes))
}

export function deleteTask(id) {
  return request(`${TASKS_PATH}/${id}`, { method: 'DELETE' })
}

export async function createTask(task) {
  const data = await request(TASKS_PATH, {
    method: 'POST',
    body: JSON.stringify(taskFields(task)),
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
