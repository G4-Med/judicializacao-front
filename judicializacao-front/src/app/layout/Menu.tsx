import { PanelMenu } from 'primereact/panelmenu'
import { useNavigate, useLocation } from 'react-router-dom'

export function Menu() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/dashboard'),
      className: location.pathname === '/dashboard' || location.pathname === '/' ? 'menu-active-item' : '',
    },
    {
      label: 'Processos',
      icon: 'pi pi-briefcase',
      command: () => navigate('/processos'),
      className: location.pathname === '/processos' ? 'menu-active-item' : '',
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => navigate('/clientes'),
      className: location.pathname === '/clientes' ? 'menu-active-item' : '',
    },
    {
      label: 'Protocolos',
      icon: 'pi pi-file-edit',
      items: [
        {
          label: 'Para protocolar',
          icon: 'pi pi-angle-right',
          command: () => navigate('/para-protocolar'),
          className: location.pathname === '/para-protocolar' ? 'menu-active-item' : '',
        },
        {
          label: 'Protocolados',
          icon: 'pi pi-angle-right',
          command: () => navigate('/protocolados'),
          className: location.pathname === '/protocolados' ? 'menu-active-item' : '',
        },
        {
          label: 'Segredo de justiça',
          icon: 'pi pi-angle-right',
          command: () => navigate('/segredo-justica'),
          className: location.pathname === '/segredo-justica' ? 'menu-active-item' : '',
        },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      items: [
        {
          label: 'Resultados',
          icon: 'pi pi-angle-right',
          command: () => navigate('/resultados'),
          className: location.pathname === '/resultados' ? 'menu-active-item' : '',
        },
        {
          label: 'Perdas',
          icon: 'pi pi-angle-right',
          command: () => navigate('/perdas'),
          className: location.pathname === '/perdas' ? 'menu-active-item' : '',
        },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Relatórios',
          icon: 'pi pi-angle-right',
          command: () => navigate('/relatorios'),
          className: location.pathname === '/relatorios' ? 'menu-active-item' : '',
        },
        {
          label: 'Usuários',
          icon: 'pi pi-angle-right',
          command: () => navigate('/usuarios'),
          className: location.pathname === '/usuarios' ? 'menu-active-item' : '',
        },
        {
          label: 'Configurações',
          icon: 'pi pi-angle-right',
          command: () => navigate('/configuracoes'),
          className: location.pathname === '/configuracoes' ? 'menu-active-item' : '',
        },
        {
          label: 'Logs',
          icon: 'pi pi-angle-right',
          command: () => navigate('/logs'),
          className: location.pathname === '/logs' ? 'menu-active-item' : '',
        },
      ],
    },
  ]

  return (
    <aside
      style={{
        width: '280px',
        minHeight: 'calc(100vh - 64px)',
        background: '#000',
        borderRight: '1px solid #2a2a2a',
        padding: '16px 12px',
      }}
    >
      <PanelMenu model={items} className="g4med-panel-menu" multiple />
    </aside>
  )
}