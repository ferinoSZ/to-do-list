import { useEffect, useState } from 'react'
import { suggestCategory } from '../services/tasksApi.js'
import { CloseIcon, SaveIcon } from './Icons.jsx'

const initialForm = {
  title: '',
  description: '',
  dueDate: '',
  dueTime: '',
  status: 'Pendente',
  priority: 'Baixa',
  category: '',
}

const categories = ['Casa', 'Compras', 'Compromissos', 'Estudo', 'Finanças', 'Lazer', 'Pessoal', 'Saúde', 'Trabalho', 'Urgente', 'Outros']

export default function TaskForm({ mode, sourceTask, restored, onDraft, draftStatus, onSubmit, onClose, isSaving, error }) {
  const isEditing = mode === 'edit'
  const isDuplicate = mode === 'duplicate'
  const [form, setForm] = useState(() => restored ?? (sourceTask ? {
    ...initialForm,
    title: sourceTask.title,
    description: sourceTask.description || '',
    status: isEditing ? sourceTask.status : 'Pendente',
    dueDate: isEditing ? (sourceTask.dueDate || '') : '',
    dueTime: isEditing ? (sourceTask.dueTime || '') : '',
    priority: sourceTask.priority || initialForm.priority,
    category: sourceTask.category || initialForm.category,
  } : initialForm))
  const [hasDraft, setHasDraft] = useState(Boolean(restored))
  const formLabel = isEditing ? 'Editar tarefa' : isDuplicate ? 'Duplicar tarefa' : 'Nova tarefa'
  const submitLabel = isEditing ? 'Salvar alterações' : isDuplicate ? 'Criar cópia' : 'Criar tarefa'
  const requireDescription = !isEditing || Boolean(sourceTask?.description)
  const requireSchedule = !isEditing || Boolean(sourceTask?.dueDate || form.dueDate || form.dueTime)

  const [prediction, setPrediction] = useState(null)
  const autoDescription = form.category ? '' : form.description.trim()
  const currentPrediction = prediction?.description === autoDescription ? prediction : null

  useEffect(() => {
    if (autoDescription.length < 3) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const category = await suggestCategory(autoDescription, controller.signal)
        if (!controller.signal.aborted) setPrediction({ description: autoDescription, category })
      } catch {
        if (!controller.signal.aborted) setPrediction({ description: autoDescription, failed: true })
      }
    }, 450)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [autoDescription])

  function handleChange(event) {
    const { name, value } = event.target
    const next = { ...form, [name]: value }
    setForm(next)
    setHasDraft(true)
    onDraft(next)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!canSubmit || isSaving) return

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      status: form.status,
      priority: form.priority,
      category: form.category,
    })
  }

  const canSubmit = Boolean(
    form.title.trim() &&
    (!requireDescription || form.description.trim()) &&
    (!requireSchedule || (form.dueDate && form.dueTime)) &&
    form.priority
  )

  return (
    <section className="form-card" aria-label={formLabel}>
      <div className="form-card__header">
        <div>
          <h2>{formLabel}</h2>
          {isDuplicate && <p className="dialog-hint">Escolha a data e o horário da cópia.</p>}
        </div>
        <button className="icon-button" onClick={onClose} type="button" aria-label="Fechar formulário" disabled={isSaving}>
          <CloseIcon />
        </button>
      </div>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset className="task-fields" disabled={isSaving}>
          <label className="field field--full">
            <span>Título <b>*</b></span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex.: Entregar trabalho de arquitetura"
              data-initial-focus={!isDuplicate || undefined}
              required
              maxLength={255}
            />
          </label>

          <label className="field field--full">
            <span>Descrição {requireDescription && <b>*</b>}</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descreva a tarefa."
              rows={3}
              required={requireDescription}
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Data {requireSchedule && <b>*</b>}</span>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} data-initial-focus={isDuplicate || undefined} required={requireSchedule} />
            </label>

            <label className="field">
              <span>Horário {requireSchedule && <b>*</b>}</span>
              <input name="dueTime" type="time" value={form.dueTime} onChange={handleChange} required={requireSchedule} />
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

            <div className="category-field">
              <label className="field">
                <span>Categoria</span>
                <select name="category" value={form.category} onChange={handleChange}
                  aria-describedby={!form.category ? 'category-suggestion' : undefined}>
                  <option value="">Automática (IA)</option>
                  {form.category && !categories.includes(form.category) && <option>{form.category}</option>}
                  {categories.map(category => <option key={category}>{category}</option>)}
                </select>
              </label>
              <small id="category-suggestion" className="category-suggestion" role="status">
                {!form.category && (autoDescription.length < 3 ? 'Escreva a descrição para receber uma sugestão.'
                  : currentPrediction?.failed ? 'A prévia está indisponível. Você pode salvar ou escolher uma categoria.'
                  : currentPrediction ? <>Sugestão da IA · <strong>{currentPrediction.category}</strong></>
                  : 'Analisando descrição…')}
              </small>
            </div>
          </div>

          {isEditing && (
            <label className="field"><span>Status</span>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em andamento</option>
                <option value="Concluida">Concluída</option>
              </select>
            </label>
          )}
        </fieldset>
        {hasDraft && draftStatus && <small className="helper-text" role="status">{draftStatus}</small>}
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <div className="form-card__footer">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={isSaving}>{hasDraft ? 'Guardar e fechar' : 'Cancelar'}</button>
          <button className="button button--primary" type="submit" disabled={isSaving || !canSubmit}>
            <SaveIcon size={18} />
            {isSaving ? 'Salvando…' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
