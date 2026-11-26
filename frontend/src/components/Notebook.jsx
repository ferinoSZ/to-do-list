import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fullAndDone, JournalLeaf, TurningLeaf } from './JournalLeaf.jsx'
import { tearPaper } from './paperMotion.js'
import { CheckIcon, CloseIcon } from './Icons.jsx'
import { archivePage, clearMarker, markEntry, readBook } from '../services/notebook.js'
import '../notebook.css'

const folio = number => String(number).padStart(2, '0')
const titleOf = entry => entry.dados.form.title.trim() || 'Rascunho sem título'
const dateOf = value => value?.split('-').reverse().join('/')
const pagesOf = entries => [...new Set(entries.map(entry => entry.page))].sort((a, b) => a - b)

function CoverFace() {
  return <>
    <span className="journal-frame" aria-hidden="true" />
    <span className="journal-foil">Rascunhos</span>
    <span className="journal-ornament" aria-hidden="true">✧</span>
    <span className="journal-band" aria-hidden="true" />
  </>
}

function Archive({ entries, onNavigate }) {
  const pages = pagesOf(entries).reverse()
  return <section className="archive-drawer" aria-label="Folhas arquivadas">
    <h2>Arquivo morto</h2>
    {!pages.length ? <div className="archive-empty">
      <p>As folhas concluídas da agenda ficam guardadas aqui.</p>
      <button className="button button--ghost" onClick={() => onNavigate('rascunhos')}>Voltar à agenda</button>
    </div> : pages.map(page => {
      const rows = entries.filter(entry => entry.page === page)
      return <details key={page} className="archive-folder">
        <summary><span>Folha {folio(page)}</span><small>Arquivada em {new Date(rows[0].archived + 'Z').toLocaleDateString('pt-BR')}</small></summary>
        <ol>{rows.map(entry => {
          const form = entry.dados.form
          return <li key={entry.id}><strong>{titleOf(entry)}</strong>
            {form.description && <p>{form.description}</p>}
            <small>{[dateOf(form.dueDate), form.dueTime, form.category, form.priority && 'Prioridade ' + form.priority, 'Concluída'].filter(Boolean).join(' · ')}</small>
          </li>
        })}</ol>
      </details>
    })}
  </section>
}

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const EMPTY = []

export default function Notebook({ view, account, version, initialEntry, onResume, onTaskChange, onEndSession, onNavigate }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [coverPhase, setCoverPhase] = useState('closed')
  const [selected, setSelected] = useState(null)
  const [turn, setTurn] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tearing, setTearing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const cover = useRef(null), close = useRef(null), rig = useRef(null)
  const tearLayer = useRef(null), pocket = useRef(null), drag = useRef(null)
  const generation = useRef(0), wanted = useRef(initialEntry), live = useRef(true)
  const scrollByPage = useRef(new Map())

  const reload = useCallback(async () => {
    const token = ++generation.current
    try {
      const next = await readBook(account)
      if (!live.current || token !== generation.current) return
      setItems(next)
      setLoaded(true)
      setError('')
      const target = next.find(item => !item.archived && item.id === wanted.current)
      if (target) setSelected(target.page)
      wanted.current = null
    } catch (err) {
      if (!live.current || token !== generation.current) return
      if (err.status === 401) onEndSession()
      else setError(err.message)
    }
  }, [account, onEndSession])

  useEffect(() => {
    live.current = true
    wanted.current = initialEntry
    reload()
    return () => { live.current = false; generation.current++ }
  }, [reload, version, initialEntry])

  // Blank leaves exist only in the visual book. Browsing never creates database rows.
  const { sheets, byPage } = useMemo(() => {
    const byPage = new Map()
    let last = 0
    for (const entry of items) {
      last = Math.max(last, entry.page)
      if (entry.archived) continue
      if (!byPage.has(entry.page)) byPage.set(entry.page, [])
      byPage.get(entry.page).push(entry)
    }
    const sheets = [...byPage.keys()].sort((a,b) => a-b)
    const total = Math.max(6, 2 * Math.ceil((sheets.length + 2) / 2))
    while (sheets.length < total) sheets.push(++last)
    return { sheets, byPage }
  }, [items])
  const nearestIndex = sheets.findIndex(number => number >= (selected ?? 1))
  const selectedIndex = nearestIndex < 0 ? sheets.length - 1 : nearestIndex
  const first = selectedIndex - selectedIndex % 2
  const pair = sheets.slice(first, first + 2)
  const displayed = turn ? turn.under : pair
  const opened = coverPhase === 'open'
  const locked = busy || Boolean(turn) || !opened || !loaded

  useEffect(() => {
    if (coverPhase !== 'opening' && coverPhase !== 'closing') return
    const opening = coverPhase === 'opening'
    const timer = window.setTimeout(() => {
      setCoverPhase(opening ? 'open' : 'closed')
      requestAnimationFrame(() => (opening ? close.current : cover.current)?.focus({ preventScroll: true }))
    }, prefersStill() ? 0 : 985)
    return () => window.clearTimeout(timer)
  }, [coverPhase])

  const finishTurn = useCallback(committed => {
    if (committed) setSelected(turn.target)
    drag.current = null
    setTurn(null)
    if (turn.focus) requestAnimationFrame(() => {
      const fallback = rig.current?.parentElement.querySelector('[aria-current="page"]')
      const button = turn.focus.isConnected && !turn.focus.disabled ? turn.focus : fallback
      button?.focus({ preventScroll: true })
    })
  }, [turn])

  function rememberScroll() {
    for (const stack of rig.current.querySelectorAll('.leaf-stack')) {
      scrollByPage.current.set(Number(stack.dataset.leaf), stack.querySelector('.leaf-content').scrollTop)
    }
  }

  function goPage(target, gesture = null) {
    const index = sheets.indexOf(target)
    if (index < 0 || locked) return
    const next = index - index % 2
    rememberScroll()
    setMessage('')
    if (next === first || prefersStill()) {
      setSelected(target)
      return
    }
    const dir = next > first ? 1 : -1
    const focused = document.activeElement
    setTurn({ dir, target, drag: gesture,
      focus: !gesture && focused?.closest('.writing-desk') ? focused : null,
      front: dir === 1 ? pair[1] : pair[0],
      back: dir === 1 ? sheets[next] : sheets[next + 1],
      under: dir === 1 ? [pair[0], sheets[next + 1]] : [sheets[next], pair[1]],
    })
  }

  function startDrag(e) {
    if (locked || prefersStill() || !e.isPrimary || e.button !== 0 ||
        e.target.closest('button,a,input,select') || !rig.current) return
    const bounds = rig.current.getBoundingClientRect()
    const dir = e.clientX > bounds.left + bounds.width / 2 ? 1 : -1
    const target = sheets[first + dir * 2]
    if (target == null) return
    drag.current = { id:e.pointerId, x:e.clientX, y:e.clientY, width:bounds.width / 2,
      dir, target, progress:0, goal:null, started:false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function moveDrag(e) {
    const g = drag.current
    if (!g || g.id !== e.pointerId || g.goal != null) return
    const dx = (g.x - e.clientX) * g.dir
    if (!g.started && dx > 8 && dx > Math.abs(e.clientY - g.y)) {
      g.started = true
      goPage(g.target, g)
    }
    g.progress = Math.max(0, Math.min(.985, dx / (g.width * 1.45)))
  }
  function endDrag(e, cancelled = false) {
    const g = drag.current
    if (!g || g.id !== e.pointerId || g.goal != null) return
    if (!g.started) { drag.current = null; return }
    g.goal = !cancelled && g.progress > .16 ? 1 : 0
  }

  async function toggle(entry) {
    if (locked) return
    setBusy(true); setError(''); setMessage('')
    try {
      await markEntry(account, entry.id, !entry.done)
      await reload()
      if (entry.taskId) await onTaskChange()
    } catch (err) {
      if (err.status === 401) onEndSession()
      else setError(err.message)
    } finally { if (live.current) setBusy(false) }
  }

  async function archive(page) {
    if (locked || !fullAndDone(byPage.get(page) || EMPTY)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await archivePage(account, page)
      if (live.current) setTearing(page)
    } catch (err) {
      if (err.status === 401) onEndSession()
      else setError(err.message)
      if (live.current) setBusy(false)
    }
  }
  useLayoutEffect(() => {
    if (tearing === null) return
    const stack = rig.current.querySelector('[data-leaf="' + tearing + '"]')
    const finish = async () => {
      // The server confirmed the archive before the tear began.
      const archived = new Date().toISOString().slice(0, 19)
      setItems(current => current.map(entry => entry.page === tearing ? { ...entry, archived } : entry))
      scrollByPage.current.delete(tearing)
      setMessage('Página ' + tearing + ' guardada no Arquivo morto.')
      setTearing(null)
      setBusy(false)
      requestAnimationFrame(() => close.current?.focus({ preventScroll: true }))
      await reload()
    }
    if (!stack || prefersStill()) { finish(); return }
    return tearPaper(tearLayer.current, stack.firstElementChild, pocket.current,
      stack.dataset.side === 'left' ? -1 : 1, finish)
  }, [tearing, reload])

  function leaf(number, side) {
    return <JournalLeaf key={number} number={number} side={side} entries={byPage.get(number) || EMPTY}
      scrollTop={scrollByPage.current.get(number) || 0}
      busy={locked} onResume={onResume} onToggle={toggle} onClear={archive} />
  }

  return <section className="book-view" aria-label={view === 'arquivo' ? 'Arquivo morto' : 'Agenda de rascunhos'}>
    {error && <div className="book-alert" role="alert">{error} <button onClick={reload}>Tentar novamente</button></div>}
    {view === 'arquivo' ? (loaded ? <Archive entries={items.filter(item => item.archived)} onNavigate={onNavigate} /> : !error && <p role="status">Carregando arquivo…</p>)
    : <div className="writing-desk" data-phase={coverPhase} onKeyDown={e => {
      if (locked || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goPage(sheets[first + (e.key === 'ArrowRight' ? 2 : -2)])
      }
    }}>
      <div className="journal-tools">
        <span ref={pocket} className="archive-pocket" data-receiving={tearing !== null} aria-hidden="true">Arquivo morto</span>
        <button className="close-journal" ref={close} disabled={!opened || busy || Boolean(turn)}
          onClick={() => { rememberScroll(); setCoverPhase('closing') }}><CloseIcon size={14} /> Fechar agenda</button>
      </div>
      <div className="book-shelf">
        <div className="journal-rig" ref={rig} data-phase={coverPhase}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
          onPointerCancel={e => endDrag(e, true)} onLostPointerCapture={e => endDrag(e, true)}>
          {['left','right'].map((side,i) => <div key={side} className="leaf-stack"
            data-side={side} data-leaf={displayed[i]} data-torn={tearing === displayed[i]} inert={!opened || Boolean(turn)}>
            {leaf(displayed[i], side)}
          </div>)}
          {turn && <TurningLeaf turn={turn} renderLeaf={leaf} onFinish={finishTurn} />}
          <div className="cover-hinge" inert={opened}>
            <button ref={cover} className="journal-cover" disabled={coverPhase !== 'closed'}
              aria-label="Abrir agenda de rascunhos" onClick={() => {
                clearMarker(account, initialEntry)
                setCoverPhase('opening')
              }}><CoverFace /></button>
            <div className="inside-lid" aria-hidden="true" inert>{leaf(pair[0], 'left')}</div>
          </div>
        </div>
        <nav className="edge-tabs" aria-label="Páginas da agenda" inert={!opened}>
          {sheets.map((number, i) => {
            const done = fullAndDone(byPage.get(number) || EMPTY)
            return <button type="button" key={number} disabled={locked} data-visible={pair.includes(number)}
              aria-current={selectedIndex === i ? 'page' : undefined} data-completed={done}
              aria-label={'Página ' + number + (done ? ', concluída' : '')} onClick={() => goPage(number)}>
              {number}{done && <CheckIcon size={12} />}
            </button>
          })}
        </nav>
      </div>
      <div className="desk-footer">
        {coverPhase === 'closed' ? <p className="cover-instruction">Toque na capa para abrir</p> :
          <nav className="folio-nav" aria-label="Virar folhas" inert={!opened}>
            <button disabled={locked || first === 0} onClick={() => goPage(sheets[first-2])}>← Anterior</button>
            <span aria-live="polite">Páginas {pair[0]}–{pair[1]}</span>
            <button disabled={locked || first + 2 >= sheets.length} onClick={() => goPage(sheets[first+2])}>Próxima →</button>
          </nav>}
      </div>
      <div className="tear-layer" ref={tearLayer} aria-hidden="true" inert />
      {message && <p role="status" className="book-receipt">{message} <button onClick={() => onNavigate('arquivo')}>Ver arquivo</button></p>}
    </div>}
  </section>
}
