import { CalendarIcon, CheckIcon, ClockIcon, CopyIcon, EditIcon, TrashIcon } from './Icons.jsx'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function TaskItem({ task, onAction, disabled }) {
  const done = task.status === 'Concluida'
  const statusLabel = done ? 'Concluída' : task.status === 'Em Andamento' ? 'Em andamento' : 'Pendente'
  const date = task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : null
  const title = task.title || 'Tarefa sem título'

  return (
    <article className="task-card" data-complete={done}>
      <div className="task-card__main">
        <button className="complete-button" type="button" title={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
          aria-label={`${done ? 'Reabrir' : 'Concluir'} tarefa: ${title}`}
          onClick={() => onAction('toggle', task)} disabled={disabled}>
          <span className="complete-ring"><CheckIcon size={16} /></span>
        </button>
        <div className="task-card__body">
          <div className="task-card__title-row">
            <h3>{title}</h3>
            <span className="status-pill task-status">{statusLabel}</span>
          </div>
          {task.description && <p className="task-card__description">{task.description}</p>}
          <div className="task-meta">
            {date && Number.isFinite(date.getTime()) && <span><CalendarIcon size={15} />{dateFormatter.format(date)}</span>}
            {task.dueTime && <span><ClockIcon size={15} />{task.dueTime}</span>}
            {task.priority && <span className="task-tag">Prioridade {task.priority === 'Media' ? 'média' : task.priority.toLowerCase()}</span>}
            {task.category && <span className="task-tag">{task.category}</span>}
          </div>
        </div>
      </div>
      <div className="card-actions" role="group" aria-label={`Ações de ${title}`}>
        {[
          ['edit', 'Editar', EditIcon],
          ['duplicate', 'Duplicar', CopyIcon],
          ['delete', 'Excluir', TrashIcon],
        ].map(([action, label, Icon]) => (
          <button key={action} className="card-action" data-action={action}
            aria-label={`${label} tarefa: ${title}`} onClick={() => onAction(action, task)}
            type="button" disabled={disabled}>
            <Icon /><span>{label}</span>
          </button>
        ))}
      </div>
    </article>
  )
}
