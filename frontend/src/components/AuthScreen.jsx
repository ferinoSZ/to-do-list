import { useEffect, useRef, useState } from 'react'
import { CheckIcon, EyeIcon } from './Icons.jsx'
import { request } from '../services/api.js'

function currentScreen() {
  return window.location.hash === '#login' ? 'login' : 'cadastro'
}

export default function AuthScreen({ onLogin }) {
  const [screen, setScreen] = useState(currentScreen)
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  const heading = useRef(null)
  const register = screen === 'cadastro'

  useEffect(() => {
    function navigate() {
      const next = currentScreen()
      if (next === 'cadastro') setNotice('')
      setScreen(next)
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  useEffect(() => {
    document.title = (register ? 'Criar conta' : 'Entrar') + ' · Minhas tarefas'
    heading.current?.focus({ preventScroll: true })
  }, [register])

  function afterSignup() {
    setNotice('Conta criada! Entre com seu e-mail e senha.')
    window.location.hash = 'login'
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <div className="auth-cover">
          <div className="auth-brand"><span><CheckIcon size={23} /></span>Minhas tarefas</div>
          <div className="notebook" aria-hidden="true">
            <i className="notebook-ribbon" />
            <div className="notebook-list">
              <i className="notebook-row checked"><CheckIcon size={22} /></i>
              <i className="notebook-row checked"><CheckIcon size={22} /></i>
              <i className="notebook-row" />
            </div>
          </div>
        </div>
        <section key={screen} className="auth-panel screen-enter" aria-labelledby="auth-title">
          <h1 id="auth-title" ref={heading} tabIndex="-1">{register ? 'Crie sua conta' : 'Entre na sua conta'}</h1>
          <p className="auth-intro">{register ? 'Cadastre-se para organizar suas tarefas.' : 'Acesse suas tarefas com seu e-mail e senha.'}</p>
          {!register && notice && <p className="auth-notice" role="status"><CheckIcon />{notice}</p>}
          <AuthForm register={register} email={email} setEmail={setEmail} onSuccess={register ? afterSignup : onLogin} />
        </section>
      </div>
    </main>
  )
}

function AuthForm({ register, email, setEmail, onSuccess }) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    const form = event.currentTarget
    const data = { email: email.trim(), senha: password }
    if (register) {
      data.nome = form.elements.nome.value.trim()
      if (passwordLength < 15 || passwordLength > 128) {
        form.elements.senha.setCustomValidity('Use uma senha de 15 a 128 caracteres.')
        form.elements.senha.reportValidity()
        return
      }
    }
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    setError('')
    try {
      const result = await request(register ? '/criar' : '/login', {
        method: 'POST',
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      if (!controller.signal.aborted) onSuccess(result.usuario_id)
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message)
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  const passwordLength = Array.from(password).length
  return (
    <>
      <form className="auth-form" onSubmit={submit} aria-busy={busy}>
        {register && (
          <label className="field">Nome
            <input name="nome" autoComplete="name" placeholder="Seu nome" maxLength={100} pattern=".*\S.*" title="Informe seu nome." required />
          </label>
        )}
        <label className="field">E-mail
          <input name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
            placeholder="voce@exemplo.com" maxLength={100} value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <div className="field">
          <label htmlFor="auth-password">Senha</label>
          <div className="password-control">
            <input id="auth-password" name="senha" type={visible ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              placeholder={register ? 'Crie uma senha' : 'Digite sua senha'}
              value={password} onChange={e => {
                e.target.setCustomValidity('')
                setPassword(e.target.value)
              }}
              aria-describedby={register ? 'password-hint' : undefined} required />
            <button className="password-toggle" type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              title={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>
              <EyeIcon hidden={visible} />
            </button>
          </div>
          {register && <small id="password-hint" className={passwordLength >= 15 && passwordLength <= 128 ? 'password-ready' : ''}>
            {passwordLength >= 15 && passwordLength <= 128 && <CheckIcon size={15} />}
            Use de 15 a 128 caracteres. Pode ser uma frase.
          </small>}
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button--primary auth-submit" disabled={busy}>
          {busy ? (register ? 'Criando conta…' : 'Entrando…') : (register ? 'Criar conta' : 'Entrar')}
          {!busy && <span aria-hidden="true">→</span>}
        </button>
      </form>
      <p className="auth-switch">
        {register ? 'Já tem uma conta? ' : 'Ainda não tem uma conta? '}
        <a href={register ? '#login' : '#cadastro'}>{register ? 'Entrar' : 'Criar conta'}</a>
      </p>
    </>
  )
}
