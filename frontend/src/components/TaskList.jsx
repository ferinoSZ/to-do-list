import { useState } from 'react'
import { SearchIcon } from './Icons.jsx'
import TaskItem from './TaskItem.jsx'

const filters = ['Todas', 'Em aberto', 'Concluídas']

function searchable(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function TaskList({ tasks, onAction, disabled }) {
  const [filter, setFilter] = useState('Todas')
  const [query, setQuery] = useState('')
  const term = searchable(query.trim())
  const visible = tasks.filter(task => {
    if (filter === 'Concluídas' && task.status !== 'Concluida') return false
    if (filter === 'Em aberto' && task.status === 'Concluida') return false
    return searchable([task.title, task.description, task.category].join(' ')).includes(term)
  })

  function reset() {
    setQuery('')
    setFilter('Todas')
  }

  return (
    <section aria-label="Lista de tarefas" className="task-list-panel">
      <div className="list-tools">
        <div role="group" aria-label="Filtrar tarefas" className="task-filters">
          {filters.map(label => (
            <button key={label} type="button" aria-pressed={label === filter}
              onClick={() => setFilter(label)}>{label}</button>
          ))}
        </div>
        <label className="task-search">
          <SearchIcon />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            aria-label="Buscar tarefas" placeholder="Buscar tarefas" />
        </label>
      </div>
      {visible.length ? (
        <div className="task-list">
          {visible.map(task => <TaskItem key={task.id} task={task} onAction={onAction} disabled={disabled} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{tasks.length ? 'Nenhuma tarefa encontrada' : 'Sua lista está vazia'}</h2>
          {tasks.length
            ? <button className="button button--ghost" type="button" onClick={reset}>Limpar filtros</button>
            : <p>Use o botão + para criar sua primeira tarefa.</p>}
        </div>
      )}
    </section>
  )
}
