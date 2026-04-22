import { PanelMenu } from 'primereact/panelmenu'
import { useLocation, useNavigate } from 'react-router-dom'
import './Menu.css'

export function Menu() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const isSectionActive = (paths: string[]) => paths.includes(currentPath)

  const protocoloRoutes = [
    '/juridico',
    '/selecionar-medico',
    '/orcamento-medico',
    '/para-protocolar',
    '/protocolados',
    '/segredo-justica',
  ]

  const resultadoRoutes = ['/resultados', '/perdas']
  const relatorioRoutes = ['/relatorios/resumido', '/relatorios/consolidado']
  const adminRoutes = ['/usuarios', '/configuracoes', '/configuracoes-emails', '/logs']

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => navigate('/home'),
      className: isActive('/home') || isActive('/') ? 'menu-active-item' : '',
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => navigate('/dashboard'),
      className: isActive('/dashboard') ? 'menu-active-item' : '',
    },
    {
      label: 'Processos',
      icon: 'pi pi-briefcase',
      command: () => navigate('/processos'),
      className: isActive('/processos') ? 'menu-active-item' : '',
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => navigate('/clientes'),
      className: isActive('/clientes') ? 'menu-active-item' : '',
    },
    {
      label: 'Protocolos',
      icon: 'pi pi-file-edit',
      className: isSectionActive(protocoloRoutes) ? 'menu-active-item' : '',
      items: [
        {
          label: 'Jurídico',
          icon: 'pi pi-angle-right',
          command: () => navigate('/juridico'),
          className: isActive('/juridico') ? 'menu-active-item' : '',
        },
        {
          label: 'Selecionar Médico',
          icon: 'pi pi-angle-right',
          command: () => navigate('/selecionar-medico'),
          className: isActive('/selecionar-medico') ? 'menu-active-item' : '',
        },
        {
          label: 'Orçamento Médico',
          icon: 'pi pi-angle-right',
          command: () => navigate('/orcamento-medico'),
          className: isActive('/orcamento-medico') ? 'menu-active-item' : '',
        },
        {
          label: 'Protocolar',
          icon: 'pi pi-angle-right',
          command: () => navigate('/para-protocolar'),
          className: isActive('/para-protocolar') ? 'menu-active-item' : '',
        },
        {
          label: 'Protocolados',
          icon: 'pi pi-angle-right',
          command: () => navigate('/protocolados'),
          className: isActive('/protocolados') ? 'menu-active-item' : '',
        },
        {
          label: 'Segredo de Justiça',
          icon: 'pi pi-angle-right',
          command: () => navigate('/segredo-justica'),
          className: isActive('/segredo-justica') ? 'menu-active-item' : '',
        },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      className: isSectionActive(resultadoRoutes) ? 'menu-active-item' : '',
      items: [
        {
          label: 'Resultados',
          icon: 'pi pi-angle-right',
          command: () => navigate('/resultados'),
          className: isActive('/resultados') ? 'menu-active-item' : '',
        },
        {
          label: 'Perdas',
          icon: 'pi pi-angle-right',
          command: () => navigate('/perdas'),
          className: isActive('/perdas') ? 'menu-active-item' : '',
        },
      ],
    },
    {
      label: 'Emails',
      icon: 'pi pi-envelope',
      command: () => navigate('/emails'),
      className: isActive('/emails') ? 'menu-active-item' : '',
    },
    {
      label: 'Relatórios',
      icon: 'pi pi-file-pdf',
      className: isSectionActive(relatorioRoutes) ? 'menu-active-item' : '',
      items: [
        {
          label: 'Relatório Resumido',
          icon: 'pi pi-angle-right',
          command: () => navigate('/relatorios/resumido'),
          className: isActive('/relatorios/resumido') ? 'menu-active-item' : '',
        },
        {
          label: 'Relatório Consolidado',
          icon: 'pi pi-angle-right',
          command: () => navigate('/relatorios/consolidado'),
          className: isActive('/relatorios/consolidado') ? 'menu-active-item' : '',
        },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      className: isSectionActive(adminRoutes) ? 'menu-active-item' : '',
      items: [
        {
          label: 'Usuários',
          icon: 'pi pi-angle-right',
          command: () => navigate('/usuarios'),
          className: isActive('/usuarios') ? 'menu-active-item' : '',
        },
        {
          label: 'Configurações',
          icon: 'pi pi-angle-right',
          command: () => navigate('/configuracoes'),
          className: isActive('/configuracoes') ? 'menu-active-item' : '',
        },
        {
          label: 'Configurações Emails',
          icon: 'pi pi-angle-right',
          command: () => navigate('/configuracoes-emails'),
          className: isActive('/configuracoes-emails') ? 'menu-active-item' : '',
        },
        {
          label: 'Logs',
          icon: 'pi pi-angle-right',
          command: () => navigate('/logs'),
          className: isActive('/logs') ? 'menu-active-item' : '',
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
