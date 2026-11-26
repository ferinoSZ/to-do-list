import { useCallback, useEffect, useRef, useState } from 'react'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import Toast from './components/Toast.jsx'
import TaskDialog from './components/TaskDialog.jsx'
import { PlusIcon, TrashIcon } from './components/Icons.jsx'
import { createTask, deleteTask, getTasks, patchTask, updateTask } from './services/tasksApi.js'
import Notebook from './components/Notebook.jsx'
import { clearMarker, interrupted, keepLocal, publishEntry, revisionAfter, syncEntry } from './services/notebook.js'
import AuthScreen from './components/AuthScreen.jsx'
import { request } from './services/api.js'

const TOAST_DURATION = 3600

export default function App() {
  const [session, setSession] = useState('checking')
  const endSession = useCallback(() => {
    window.history.replaceState(null, '', '#login')
    setSession('guest')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)
    let active = true
    request('/sessao', { signal: controller.signal })
      .then(data => { if (active) setSession(data.autenticado ? data.usuario_id : 'guest') })
      .catch(() => { if (active) setSession('guest') })
      .finally(() => window.clearTimeout(timeout))
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [])

  if (session === 'checking') return <main className="auth-shell" role="status">Carregando…</main>
  if (session === 'guest') return <AuthScreen onLogin={setSession} />
  return <TaskDashboard key={session} account={session} onEndSession={endSession} />
}

function TaskDashboard({ account, onEndSession }) {
  const [tasks, setTasks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [toast, setToast] = useState(null)
  const [draftStatus, setDraftStatus] = useState('')
  const [bookVersion, setBookVersion] = useState(0)
  const [view, setView] = useState(() => {
    const tab = window.location.hash.slice(1)
    if (interrupted(account)) return 'rascunhos'
    return ['rascunhos', 'arquivo'].includes(tab) ? tab : 'tarefas'
  })
  const latestDraft = useRef(null)
  const syncTimer = useRef(null)
  const initialEntry = useRef(interrupted(account))

  useEffect(() => {
    function navigate() {
      const tab = window.location.hash.slice(1)
      setView(['rascunhos', 'arquivo'].includes(tab) ? tab : 'tarefas')
    }
    function flushDraft() {
      const entry = latestDraft.current
      if (entry) syncEntry(account, entry, true).catch(() => {
        // A cópia síncrona no navegador será reenviada na próxima visita.
      })
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flushDraft()
    }
    window.addEventListener('hashchange', navigate)
    window.addEventListener('pagehide', flushDraft)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('hashchange', navigate)
      window.removeEventListener('pagehide', flushDraft)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearTimeout(syncTimer.current)
    }
  }, [account])

  function go(next) {
    setView(next)
    window.location.hash = next
  }

  function recordDraft(form) {
    const entry = {
      id: dialog.draftId,
      revision: revisionAfter(latestDraft.current?.revision ?? dialog.revision),
      dados: { mode: dialog.mode, source: dialog.task || null, form },
    }
    latestDraft.current = entry
    window.clearTimeout(syncTimer.current)
    try {
      keepLocal(account, entry)
      setDraftStatus('Rascunho guardado neste navegador')
    } catch {
      setDialogError('O navegador não conseguiu gravar a cópia local. Guarde o rascunho antes de sair.')
    }
    syncTimer.current = window.setTimeout(() => {
      syncEntry(account, entry).then(() => {
        if (latestDraft.current === entry) {
          setDraftStatus('Rascunho sincronizado com sua conta')
          setDialogError('')
        }
      }).catch(() => {
        if (latestDraft.current === entry) setDialogError('Sincronização pendente. Tente guardar novamente.')
      })
    }, 700)
  }

  function resumeEntry(entry) {
    setDraftStatus('Rascunho da agenda')
    latestDraft.current = null
    setDialogError('')
    setDialog({
      mode: entry.dados.mode, task: entry.dados.source, restored: entry.dados.form,
      draftId: entry.id, revision: entry.revision, fromBook: true,
    })
  }

  useEffect(() => { document.title = 'Minhas tarefas' }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), TOAST_DURATION)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const loadTasks = useCallback(async (signal) => {
    setIsLoading(true)
    try {
      const data = await getTasks(signal)
      if (signal?.aborted) return
      setTasks(data)
      setLoaded(true)
      setLoadError('')
    } catch (error) {
      if (signal?.aborted) return
      if (error.status === 401) return onEndSession()
      setLoadError(error.message)
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [onEndSession])

  useEffect(() => {
    const controller = new AbortController()
    loadTasks(controller.signal)
    return () => controller.abort()
  }, [loadTasks])

  async function handleLogout() {
    setIsSigningOut(true)
    try {
      await request('/logout', { method: 'POST' })
      onEndSession()
    } catch (error) {
      setToast({ type: 'error', title: 'Não foi possível sair', message: error.message })
      setIsSigningOut(false)
    }
  }

  async function mutate(operation, successTitle) {
    setIsSaving(true)
    setDialogError('')
    try {
      await operation()
      await loadTasks()
      setDialog(null)
      setToast({ type: 'success', title: successTitle })
    } catch (error) {
      if (error.status === 401) return onEndSession()
      if (dialog) setDialogError(error.message)
      else setToast({ type: 'error', title: 'Não foi possível atualizar', message: error.message })
      if (error.status === 404) await loadTasks()
    } finally {
      setIsSaving(false)
    }
  }

  function handleAction(mode, task) {
    if (mode === 'toggle') {
      const done = task.status === 'Concluida'
      return mutate(() => patchTask(task.id, { status: done ? 'Pendente' : 'Concluida' }),
        done ? 'Tarefa reaberta' : 'Tarefa concluída')
    }
    setDialogError('')
    latestDraft.current = null
    setDraftStatus('')
    setDialog({ mode, task, draftId: mode === 'delete' ? null : crypto.randomUUID() })
  }

  function saveForm(values) {
    if (latestDraft.current || dialog.fromBook) {
      window.clearTimeout(syncTimer.current)
      const entry = {
        id: dialog.draftId,
        revision: revisionAfter(latestDraft.current?.revision ?? dialog.revision),
        dados: { mode: dialog.mode, source: dialog.task || null, form: values },
      }
      return mutate(async () => {
        await publishEntry(account, entry, Boolean(dialog.fromBook))
        latestDraft.current = null
        setBookVersion(v => v + 1)
      }, dialog.mode === 'edit' ? 'Alterações salvas' : dialog.mode === 'duplicate' ? 'Cópia criada' : 'Tarefa criada')
    }
    if (dialog.mode === 'edit') {
      return mutate(() => updateTask(dialog.task, values), 'Alterações salvas')
    }
    return mutate(() => createTask(values), dialog.mode === 'duplicate' ? 'Cópia criada' : 'Tarefa criada')
  }

  async function closeDialog() {
    const entry = latestDraft.current
    if (entry) {
      window.clearTimeout(syncTimer.current)
      try {
        keepLocal(account, entry)
      } catch {
        try { await syncEntry(account, entry) }
        catch { setDialogError('Não foi possível guardar o rascunho. Tente novamente antes de fechar.'); return }
      }
      initialEntry.current = entry.id
      clearMarker(account, entry.id)
      setBookVersion(v => v + 1)
      go('rascunhos')
    }
    latestDraft.current = null
    setDialog(null)
  }
  const disabled = isSaving || isSigningOut || isLoading
  const count = tasks.length

  return (
    <div className="app-shell">
      <main className="app-container screen-enter">
        <header className="page-header">
          <div>
            <p className="eyebrow">Organização pessoal</p>
            <h1>Minhas tarefas</h1>
            <p className="page-subtitle">Organize seu dia e ganhe tempo para o que importa.</p>
          </div>
          <div className="account-actions">
            <div className="task-counter" aria-label={`${count} tarefas cadastradas`}>
              <strong>{count}</strong><span>{count === 1 ? 'tarefa' : 'tarefas'}</span>
            </div>
            <button className="button button--ghost button--small" onClick={handleLogout}
              type="button" disabled={isSigningOut || isSaving}>{isSigningOut ? 'Saindo…' : 'Sair'}</button>
          </div>
        </header>

        <nav className="book-nav" aria-label="Navegação principal">
          {[['tarefas', 'Tarefas'], ['rascunhos', 'Rascunhos'], ['arquivo', 'Arquivo morto']].map(([tab, label]) => (
            <a key={tab} href={'#' + tab} aria-current={view === tab ? 'page' : undefined}
              onClick={() => setView(tab)}>{label}</a>
          ))}
        </nav>
        {view !== 'tarefas' && <Notebook key={view} view={view} account={account} version={bookVersion}
          initialEntry={initialEntry.current} onResume={resumeEntry} onTaskChange={loadTasks}
          onEndSession={onEndSession} onNavigate={go} />}
        {view === 'tarefas' && loadError && (
          <section className="inline-alert" role="alert">
            <div><strong>Não foi possível carregar suas tarefas.</strong><span>{loadError}</span></div>
            <button className="button button--ghost button--small" type="button" onClick={() => loadTasks()} disabled={disabled}>
              {isLoading ? 'Tentando novamente…' : 'Tentar novamente'}
            </button>
          </section>
        )}
        {view === 'tarefas' && loaded && <TaskList tasks={tasks} onAction={handleAction} disabled={disabled} />}
        {view === 'tarefas' && !loaded && isLoading && (
          <div className="loading-list" role="status" aria-label="Carregando tarefas">
            <div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" />
          </div>
        )}
      </main>
      <button className="fab new-task" type="button" onClick={() => handleAction('create')}
        disabled={isSaving || isSigningOut} aria-label="Criar nova tarefa" aria-haspopup="dialog">
        <PlusIcon size={20} /><span>Nova tarefa</span>
      </button>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {dialog && (dialog.mode === 'delete' ? (
        <TaskDialog label="Excluir tarefa" onClose={closeDialog} busy={isSaving} compact>
          <div className="delete-symbol"><TrashIcon size={22} /></div>
          <h2>Excluir tarefa?</h2>
          <p className="delete-description">A tarefa <strong>“{dialog.task.title}”</strong> será excluída permanentemente.</p>
          {dialogError && <p className="dialog-error" role="alert">{dialogError}</p>}
          <div className="dialog-actions">
            <button className="button button--ghost" type="button" onClick={closeDialog} disabled={isSaving} data-initial-focus>Cancelar</button>
            <button className="button button--danger" type="button" disabled={isSaving}
              onClick={() => mutate(() => deleteTask(dialog.task.id), 'Tarefa excluída')}>
              <TrashIcon size={17} />{isSaving ? 'Excluindo…' : 'Excluir tarefa'}
            </button>
          </div>
        </TaskDialog>
      ) : (
        <TaskDialog label={{ edit: 'Editar tarefa', duplicate: 'Duplicar tarefa', create: 'Nova tarefa' }[dialog.mode]}
          onClose={closeDialog} busy={isSaving}>
          <TaskForm mode={dialog.mode} sourceTask={dialog.task} restored={dialog.restored} onDraft={recordDraft} draftStatus={draftStatus} onSubmit={saveForm}
            onClose={closeDialog} isSaving={isSaving} error={dialogError} />
        </TaskDialog>
      ))}
    </div>
  )
}
