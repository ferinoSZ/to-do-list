import { useLayoutEffect, useRef } from 'react'
import { CheckIcon } from './Icons.jsx'
import { PAGE_SIZE } from '../services/notebook.js'
import { turnPaper } from './paperMotion.js'

export const fullAndDone = entries => entries.length === PAGE_SIZE && entries.every(entry => entry.done)

export function JournalLeaf({ number, entries, side, busy, scrollTop, onToggle, onResume, onClear }) {
  const content = useRef(null)
  useLayoutEffect(() => { content.current.scrollTop = scrollTop }, [number, scrollTop])
  return <section className="journal-page" data-side={side} aria-label={'Página ' + number}>
    <header className="folio-heading"><h2>Página {number}</h2>
      {entries.length > 0 && <span>{entries.length}/{PAGE_SIZE}</span>}
    </header>
    <div ref={content} className="leaf-content">
      {entries.length > 0 && <ol className="journal-lines">{entries.map(entry => {
        const form = entry.dados.form
        const title = form.title.trim() || 'Rascunho sem título'
        return <li key={entry.id} data-done={entry.done}>
          <button className="paper-check" aria-label={(entry.done ? 'Reabrir' : 'Concluir') + ' entrada: ' + title}
            aria-pressed={entry.done} disabled={busy} onClick={() => onToggle(entry)}>
            <span>{entry.done && <CheckIcon size={15} />}</span>
          </button>
          <div className="entry-copy"><strong>{title}</strong>
            {form.description && <p>{form.description}</p>}
            {form.dueDate && <small className="entry-date">{[form.dueDate.split('-').reverse().join('/'), form.dueTime].filter(Boolean).join(' · ')}</small>}
            {entry.state === 'vinculado' ? <small>{entry.done ? 'Tarefa concluída' : 'Tarefa salva'}</small> :
              <button className="resume-note" disabled={busy} onClick={() => onResume(entry)}>Continuar edição <span aria-hidden="true">↗</span></button>}
          </div>
        </li>
      })}</ol>}
    </div>
    <footer className="sheet-footer">
      <span className="folio-number" aria-hidden="true">{number}</span>
      {entries.length > 0 && <button type="button" disabled={busy || !fullAndDone(entries)}
        aria-label={'Limpar página ' + number} onClick={() => onClear(number)}>Limpar folha</button>}
    </footer>
  </section>
}

export function TurningLeaf({ turn, renderLeaf, onFinish }) {
  const layer = useRef(null), samples = useRef(null)
  useLayoutEffect(() => {
    const [front, back] = samples.current.children
    return turnPaper(layer.current, front, back, turn.dir, turn.drag, onFinish)
  }, [turn, onFinish])
  return <div className="leaf-motion" aria-hidden="true" inert>
    <div ref={samples} className="leaf-samples">
      {renderLeaf(turn.front, turn.dir === 1 ? 'right' : 'left')}
      {renderLeaf(turn.back, turn.dir === 1 ? 'left' : 'right')}
    </div>
    <div ref={layer} className="turn-layer" />
  </div>
}
