import { useEffect, useRef, useState } from 'react'
import { suggestCategory } from '../services/tasksApi.js'

const categories = ['Casa', 'Compras', 'Compromissos', 'Estudo', 'Finanças', 'Lazer', 'Pessoal', 'Saúde', 'Trabalho', 'Urgente', 'Outros']

export default function CategoryField({ description, category, onSelect }) {
  const [picking, setPicking] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const toggle = useRef(null)
  const query = category ? '' : description.trim()

  useEffect(() => {
    if (query.length < 3) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const value = await suggestCategory(query, controller.signal)
        if (!controller.signal.aborted) setPrediction({ query, value })
      } catch {
        if (!controller.signal.aborted) setPrediction({ query, failed: true })
      }
    }, 450)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function select(value) {
    onSelect(value)
    setPicking(false)
    toggle.current?.focus()
  }

  let message = category || 'Escreva uma descrição para receber uma sugestão.'
  if (query.length >= 3) {
    if (prediction?.query !== query) message = 'Analisando descrição…'
    else if (prediction.failed) message = 'Sugestão indisponível. Você pode salvar ou escolher uma categoria.'
    else if (prediction.value === 'Outros') message = 'Sem sugestão específica. Ao salvar, a categoria será Outros.'
    else message = prediction.value
  }

  return (
    <section className="category-field" aria-label="Categoria da tarefa">
      <div className="category-field__line">
        <div role="status">
          <span className="category-field__label">{category ? 'Categoria selecionada' : 'Categoria sugerida pela IA'}</span>
          <strong>{message}</strong>
        </div>
        <button ref={toggle} className="category-link" type="button" aria-expanded={picking}
          onClick={() => setPicking(!picking)}>{picking ? 'Cancelar' : 'Alterar'}</button>
      </div>
      {picking && (
        <label className="field">
          Escolher categoria
          <select name="category" autoFocus value={category} onChange={event => select(event.target.value)}>
            <option value="" disabled>Selecione uma categoria</option>
            {category && !categories.includes(category) && <option>{category}</option>}
            {categories.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
      )}
      {category && !picking && (
        <button className="category-link" type="button" onClick={() => select('')}>Voltar à sugestão da IA</button>
      )}
    </section>
  )
}
