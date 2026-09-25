import TaskItem from './TaskItem.jsx'

export default function TaskList({ tasks }) {
  if (!tasks.length) {
    return (
      <section className="empty-state" aria-label="Nenhuma tarefa cadastrada">
        <div className="empty-state__icon" aria-hidden="true">✓</div>
        <h2>Nenhuma tarefa cadastrada.</h2>
        <p>Crie uma tarefa pelo botão +. Depois que o backend salvar, a lista será carregada novamente.</p>
      </section>
    )
  }

  return (
    <section className="task-list" aria-label="Lista de tarefas">
      {tasks.map((task, index) => (
        <TaskItem key={task.id != null ? String(task.id) : `task-${index}`} task={task} />
      ))}
    </section>
  )
}
