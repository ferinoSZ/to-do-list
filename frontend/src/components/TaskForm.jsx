import { useState } from 'react'
import { CloseIcon, PlusIcon } from './Icons.jsx'

const initialForm = {
  title: '',
  description: '',
  dueDate: '',
  dueTime: '',
  priority: 'Baixa',
  category: 'Outros',
}

export default function TaskForm({ onSubmit, onClose, isSaving }) {
  const [form, setForm] = useState(initialForm)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const hasRequiredFields =
      form.title.trim() &&
      form.description.trim() &&
      form.dueDate &&
      form.dueTime &&
      form.priority &&
      form.category

    if (!hasRequiredFields || isSaving) return

    const created = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      status: 'Pendente',
      priority: form.priority,
      category: form.category,
    })

    if (created) setForm(initialForm)
  }

  const canSubmit = Boolean(
    form.title.trim() &&
    form.description.trim() &&
    form.dueDate &&
    form.dueTime &&
    form.priority &&
    form.category
  )

  return (
    <section className="form-card" aria-label="Nova tarefa">
      <div className="form-card__header">
        <div>
          <p className="eyebrow">Nova tarefa</p>
          <h2>O que precisa ser feito?</h2>
        </div>
        <button className="icon-button" onClick={onClose} type="button" aria-label="Fechar formulário">
          <CloseIcon />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="field field--full">
          <span>Título <b>*</b></span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex.: Entregar trabalho de arquitetura"
            autoFocus
            required
            maxLength={255}
          />
        </label>

        <label className="field field--full">
          <span>Descrição <b>*</b></span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descreva a tarefa."
            rows={3}
            required
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Data <b>*</b></span>
            <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />
          </label>

          <label className="field">
            <span>Horário <b>*</b></span>
            <input name="dueTime" type="time" value={form.dueTime} onChange={handleChange} required />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Prioridade <b>*</b></span>
            <select name="priority" value={form.priority} onChange={handleChange} required>
              <option value="Alta">Alta</option>
              <option value="Media">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </label>

          <label className="field">
            <span>Categoria <b>*</b></span>
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="Trabalho">Trabalho</option>
              <option value="Casa">Casa</option>
              <option value="Estudo">Estudo</option>
              <option value="Urgente">Urgente</option>
              <option value="Lazer">Lazer</option>
              <option value="Outros">Outros</option>
            </select>
          </label>
        </div>

        <div className="form-card__footer">
          <span className="helper-text">O status inicial será Pendente.</span>
          <button className="button button--primary" type="submit" disabled={isSaving || !canSubmit}>
            <PlusIcon size={18} />
            {isSaving ? 'Salvando...' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </section>
  )
}
