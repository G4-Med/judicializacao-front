import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { setTheme } from '../../utils/theme'
import { getEmailsPendentesCount } from '../../services/api/orders'
import logo from '../../assets/logog4med.png'

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
    if (savedTheme === 'dark') {
      setDark(true)
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [])

  useEffect(() => {
    let ativo = true

    const carregarPendencias = async () => {
      try {
        const { data } = await getEmailsPendentesCount()
        if (ativo) {
          setEmailsPendentes(data?.quantidade ?? 0)
        }
      } catch {
        if (ativo) {
          setEmailsPendentes(0)
        }
      }
    }

    void carregarPendencias()
    const intervalId = window.setInterval(() => {
      void carregarPendencias()
    }, 60000)

    return () => {
      ativo = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (!notificacoesRef.current) return
      if (!notificacoesRef.current.contains(event.target as Node)) {
        setNotificacoesAbertas(false)
      }
    }

    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const toggleTheme = () => {
    const newDark = !dark
    setDark(newDark)
    if (newDark) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <div
      className="flex align-items-center justify-content-between px-4"
      style={{
        height: '64px',
        background: '#000',
        borderBottom: '1px solid #2a2a2a'
      }}
    >
      <div className="flex align-items-center gap-3">
        <Button
          icon="pi pi-bars"
          text
          rounded
          onClick={onMenuClick}
          style={{ color: 'white' }}
        />
        <img src={logo} alt="G4MED" style={{ height: '36px' }} />
      </div>

      <div className="flex align-items-center gap-3">
        <Button
          icon={dark ? 'pi pi-sun' : 'pi pi-moon'}
          text
          rounded
          onClick={toggleTheme}
          style={{ color: 'white' }}
        />
        <div style={{ position: 'relative' }} ref={notificacoesRef}>
          <Button
            icon="pi pi-bell"
            text
            rounded
            style={{ color: 'white' }}
            onClick={() => setNotificacoesAbertas((atual) => !atual)}
          />
          {emailsPendentes > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '999px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #000',
              }}
            >
              {emailsPendentes > 99 ? '99+' : emailsPendentes}
            </span>
          )}

          {notificacoesAbertas && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '320px',
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '14px',
                boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #1f2937',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                Notificações
              </div>

              <div style={{ padding: '8px' }}>
                {emailsPendentes > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNotificacoesAbertas(false)
                      navigate('/emails')
                    }}
                    style={{
                      width: '100%',
                      border: '1px solid #1f2937',
                      borderRadius: '12px',
                      background: '#0f172a',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
                      Emails pendentes
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {emailsPendentes} pendência{emailsPendentes > 1 ? 's' : ''} aguardando envio
                    </span>
                  </button>
                ) : (
                  <div
                    style={{
                      border: '1px solid #1f2937',
                      borderRadius: '12px',
                      background: '#0f172a',
                      padding: '12px 14px',
                      color: '#cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  >
                    Nenhuma notificação no momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Button icon="pi pi-question-circle" text rounded style={{ color: 'white' }} />
        <Button
          icon="pi pi-sign-out"
          text
          rounded
          style={{ color: 'white' }}
          onClick={logout}
          tooltip="Sair"
          tooltipOptions={{ position: 'bottom' }}
        />
        <Avatar icon="pi pi-user" shape="circle" />
      </div>
    </div>
  )
}
