import { CalendarIcon, ClockIcon } from './Icons.jsx'

function formatDate(dateValue) {
  if (!dateValue) return null
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateValue
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export default function TaskItem({ task }) {
  const formattedDate = formatDate(task.dueDate)

  return (
    <article className="task-card">
      <div className="task-card__main">
        <div className="task-card__accent" aria-hidden="true" />
        <div className="task-card__body">
          <div className="task-card__title-row">
            <h3>{task.title || 'Tarefa sem título'}</h3>
            <span className="status-pill">{task.status || 'Pendente'}</span>
            {task.priority && <span className="status-pill">Prioridade: {task.priority}</span>}
            {task.category && <span className="status-pill">{task.category}</span>}
          </div>

          {task.description && <p className="task-card__description">{task.description}</p>}

          {(formattedDate || task.dueTime) && (
            <div className="task-meta" aria-label="Agendamento">
              {formattedDate && (
                <span>
                  <CalendarIcon />
                  {formattedDate}
                </span>
              )}
              {task.dueTime && (
                <span>
                  <ClockIcon />
                  {task.dueTime}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
