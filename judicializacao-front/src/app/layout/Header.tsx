import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { setTheme } from '../../utils/theme'
import { getEmailsPendentesCount, getNotificacoesCentral } from '../../services/api/orders'
import { readAuthProfile } from '../../access/authProfile'
import logo from '../../assets/logo-horizontal.png'
import { AjudaModal } from '../../components/AjudaModal/AjudaModal'
import './Header.css'

interface NotificacaoCentral {
  aguardandoJuridico: { quantidade: number; nota: string };
  slaEstourado: { quantidade: number; itens: { order_id: number; paciente: string; fase: string; atraso_dias: number }[]; nota: string };
}

const GRUPOS_COM_CENTRAL = new Set(['ADMIN', 'GERENTE', 'JURIDICO', 'SUPERVISOR']);

interface Props {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: Props) {
  const [dark, setDark] = useState(false)
  const [emailsPendentes, setEmailsPendentes] = useState(0)
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [central, setCentral] = useState<NotificacaoCentral | null>(null)
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
    const grupo = readAuthProfile()?.group
    if (!grupo || !GRUPOS_COM_CENTRAL.has(grupo)) return
    let ativo = true
    const carregar = async () => {
      try {
        const { data } = await getNotificacoesCentral()
        if (ativo) setCentral(data)
      } catch { if (ativo) setCentral(null) }
    }
    void carregar()
    const id = window.setInterval(() => { void carregar() }, 120000)
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
          {(() => {
            const total = emailsPendentes + (central?.aguardandoJuridico.quantidade ?? 0) + (central?.slaEstourado.quantidade ?? 0)
            return total > 0 && (
              <span className="mc-iconbtn__dot">{total > 99 ? '99+' : total}</span>
            )
          })()}

          {notificacoesAbertas && (
            <div className="mc-notif__panel">
              <div className="mc-notif__head">Notificações</div>
              <div className="mc-notif__body">
                {emailsPendentes === 0 && !central?.aguardandoJuridico.quantidade && !central?.slaEstourado.quantidade && (
                  <div className="mc-notif__empty">Nenhuma notificação no momento.</div>
                )}

                {emailsPendentes > 0 && (
                  <button
                    type="button"
                    className="mc-notif__item"
                    onClick={() => { setNotificacoesAbertas(false); navigate('/emails') }}
                  >
                    <strong>Emails pendentes</strong>
                    <span>{emailsPendentes} pendência{emailsPendentes > 1 ? 's' : ''} aguardando envio</span>
                  </button>
                )}

                {!!central?.aguardandoJuridico.quantidade && (
                  <button
                    type="button"
                    className="mc-notif__item"
                    onClick={() => { setNotificacoesAbertas(false); navigate('/juridico') }}
                  >
                    <strong>Aguardando Jurídico</strong>
                    <span>{central.aguardandoJuridico.quantidade} pedido{central.aguardandoJuridico.quantidade > 1 ? 's' : ''} sem triagem ainda</span>
                  </button>
                )}

                {!!central?.slaEstourado.quantidade && (
                  <button
                    type="button"
                    className="mc-notif__item mc-notif__item--grave"
                    onClick={() => { setNotificacoesAbertas(false); navigate('/sla') }}
                  >
                    <strong>⚠ SLA estourado</strong>
                    <span>
                      {central.slaEstourado.quantidade} pedido{central.slaEstourado.quantidade > 1 ? 's' : ''} fora do prazo
                      {central.slaEstourado.itens[0] && ` — o mais atrasado: ${central.slaEstourado.itens[0].paciente} (${central.slaEstourado.itens[0].atraso_dias}d)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          icon="pi pi-question-circle" text rounded className="mc-iconbtn"
          onClick={() => setAjudaAberta(true)}
          tooltip="Ajuda" tooltipOptions={{ position: 'bottom' }}
        />
        <AjudaModal visible={ajudaAberta} onHide={() => setAjudaAberta(false)} />
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
