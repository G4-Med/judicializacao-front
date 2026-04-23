import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { setTheme } from '../../utils/theme'
import { getEmailsPendentesCount } from '../../services/api/orders'
import logo from '../../assets/logo-horizontal.png'
import './Header.css'

interface Props {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: Props) {
  const [dark, setDark] = useState(false)
  const [emailsPendentes, setEmailsPendentes] = useState(0)
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const navigate = useNavigate()
  const notificacoesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    if (savedTheme === 'dark') { setDark(true); setTheme('dark') } else { setTheme('light') }
  }, [])

  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      try {
        const { data } = await getEmailsPendentesCount()
        if (ativo) setEmailsPendentes(data?.quantidade ?? 0)
      } catch { if (ativo) setEmailsPendentes(0) }
    }
    void carregar()
    const id = window.setInterval(() => { void carregar() }, 60000)
    return () => { ativo = false; window.clearInterval(id) }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!notificacoesRef.current) return
      if (!notificacoesRef.current.contains(e.target as Node)) setNotificacoesAbertas(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleTheme = () => {
    const nd = !dark; setDark(nd); setTheme(nd ? 'dark' : 'light')
  }

  return (
    <header className="mc-header">
      <div className="mc-brand">
        <Button
          icon="pi pi-bars"
          text rounded
          className="mc-iconbtn mc-iconbtn--menu"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        />
        <span className="mc-brand__mark">
          <img src={logo} alt="MedCheck" style={{ height: 62 }} />
        </span>

        
        </div>

      <div className="mc-header__tools">
        <Button
          icon={dark ? 'pi pi-sun' : 'pi pi-moon'}
          text rounded onClick={toggleTheme} className="mc-iconbtn"
          tooltip={dark ? 'Tema claro' : 'Tema escuro'}
          tooltipOptions={{ position: 'bottom' }}
        />

        <div className="mc-notif" ref={notificacoesRef}>
          <Button
            icon="pi pi-bell"
            text rounded className="mc-iconbtn"
            onClick={() => setNotificacoesAbertas(v => !v)}
            aria-label="Notificações"
          />
          {emailsPendentes > 0 && (
            <span className="mc-iconbtn__dot">{emailsPendentes > 99 ? '99+' : emailsPendentes}</span>
          )}

          {notificacoesAbertas && (
            <div className="mc-notif__panel">
              <div className="mc-notif__head">Notificações</div>
              <div className="mc-notif__body">
                {emailsPendentes > 0 ? (
                  <button
                    type="button"
                    className="mc-notif__item"
                    onClick={() => { setNotificacoesAbertas(false); navigate('/emails') }}
                  >
                    <strong>Emails pendentes</strong>
                    <span>{emailsPendentes} pendência{emailsPendentes > 1 ? 's' : ''} aguardando envio</span>
                  </button>
                ) : (
                  <div className="mc-notif__empty">Nenhuma notificação no momento.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <Button icon="pi pi-question-circle" text rounded className="mc-iconbtn" tooltip="Ajuda" tooltipOptions={{ position: 'bottom' }}/>
        <Button
          icon="pi pi-sign-out"
          text rounded className="mc-iconbtn"
          onClick={logout}
          tooltip="Sair"
          tooltipOptions={{ position: 'bottom' }}
        />
        <Avatar icon="pi pi-user" shape="circle" className="mc-avatar"/>
      </div>
    </header>
  )
}
