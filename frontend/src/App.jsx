import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import Toast from './components/Toast.jsx'
import { CloseIcon, PlusIcon } from './components/Icons.jsx'
import { createTask, getTasks } from './services/tasksApi.js'

const TOAST_DURATION = 3600

export default function App() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((nextToast) => {
    setToast(nextToast)
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), TOAST_DURATION)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const data = await getTasks()
      setTasks(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar as tarefas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const taskCount = useMemo(() => tasks.length, [tasks])

  async function handleCreate(taskInput) {
    setIsSaving(true)

    try {
      await createTask(taskInput)
      await loadTasks()

      setIsFormOpen(false)
      showToast({
        type: 'success',
        title: 'Tarefa criada',
        message: 'A tarefa foi salva e a lista foi atualizada.',
      })
      return true
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Não foi possível criar',
        message: error instanceof Error ? error.message : 'Verifique se a API está disponível.',
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-container">
        <header className="page-header">
          <div>
            <p className="eyebrow">Organização pessoal</p>
            <h1>Minhas tarefas</h1>
            <p className="page-subtitle">Crie tarefas e acompanhe tudo que já foi cadastrado.</p>
          </div>
          <div className="task-counter" aria-label={`${taskCount} tarefas cadastradas`}>
            <strong>{taskCount}</strong>
            <span>{taskCount === 1 ? 'tarefa' : 'tarefas'}</span>
          </div>
        </header>

        {loadError && (
          <section className="inline-alert" role="alert">
            <div>
              <strong>Não foi possível carregar suas tarefas.</strong>
              <span>{loadError}</span>
            </div>
            <button className="button button--ghost button--small" type="button" onClick={loadTasks}>
              Tentar novamente
            </button>
          </section>
        )}

        {isFormOpen && (
          <TaskForm
            onSubmit={handleCreate}
            onClose={() => setIsFormOpen(false)}
            isSaving={isSaving}
          />
        )}

        <div className="content-heading">
          <div>
            <p className="eyebrow">Visão geral</p>
            <h2>{isLoading ? 'Carregando tarefas...' : taskCount ? 'Tarefas cadastradas' : 'Nenhuma tarefa por enquanto'}</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-list" aria-label="Carregando">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </main>

      <button
        className="fab"
        type="button"
        onClick={() => setIsFormOpen((open) => !open)}
        aria-label={isFormOpen ? 'Fechar criação de tarefa' : 'Criar nova tarefa'}
        aria-expanded={isFormOpen}
      >
        {isFormOpen ? <CloseIcon size={24} /> : <PlusIcon size={26} />}
        <span className="fab__tooltip">{isFormOpen ? 'Fechar formulário' : 'Criar nova tarefa'}</span>
      </button>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
