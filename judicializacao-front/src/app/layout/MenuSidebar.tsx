import { Sidebar } from 'primereact/sidebar'
import { PanelMenu } from 'primereact/panelmenu'
import { Button } from 'primereact/button'
import { useLocation, useNavigate } from 'react-router-dom'
import './Menu.css'

interface Props {
  visible: boolean
  onHide: () => void
}

export function MenuSidebar({ visible, onHide }: Props) {
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

  const go = (path: string) => {
    navigate(path)
    onHide()
  }

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => go('/home'),
      className: isActive('/home') || isActive('/') ? 'menu-active-item' : '',
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => go('/dashboard'),
      className: isActive('/dashboard') ? 'menu-active-item' : '',
    },
    {
      label: 'Processos',
      icon: 'pi pi-briefcase',
      command: () => go('/processos'),
      className: isActive('/processos') ? 'menu-active-item' : '',
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => go('/clientes'),
      className: isActive('/clientes') ? 'menu-active-item' : '',
    },
    {
      label: 'Protocolos',
      icon: 'pi pi-file-edit',
      className: isSectionActive(protocoloRoutes) ? 'menu-active-item' : '',
      items: [
        { label: 'Jurídico', command: () => go('/juridico'), className: isActive('/juridico') ? 'menu-active-item' : '' },
        { label: 'Selecionar Médico', command: () => go('/selecionar-medico'), className: isActive('/selecionar-medico') ? 'menu-active-item' : '' },
        { label: 'Orçamento Médico', command: () => go('/orcamento-medico'), className: isActive('/orcamento-medico') ? 'menu-active-item' : '' },
        { label: 'Protocolar', command: () => go('/para-protocolar'), className: isActive('/para-protocolar') ? 'menu-active-item' : '' },
        { label: 'Protocolados', command: () => go('/protocolados'), className: isActive('/protocolados') ? 'menu-active-item' : '' },
        { label: 'Segredo de Justiça', command: () => go('/segredo-justica'), className: isActive('/segredo-justica') ? 'menu-active-item' : '' },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      className: isSectionActive(resultadoRoutes) ? 'menu-active-item' : '',
      items: [
        { label: 'Resultados', command: () => go('/resultados'), className: isActive('/resultados') ? 'menu-active-item' : '' },
        { label: 'Perdas', command: () => go('/perdas'), className: isActive('/perdas') ? 'menu-active-item' : '' },
      ],
    },
    {
      label: 'Emails',
      icon: 'pi pi-envelope',
      command: () => go('/emails'),
      className: isActive('/emails') ? 'menu-active-item' : '',
    },
    {
      label: 'Relatórios',
      icon: 'pi pi-file-pdf',
      className: isSectionActive(relatorioRoutes) ? 'menu-active-item' : '',
      items: [
        { label: 'Relatório Resumido', command: () => go('/relatorios/resumido'), className: isActive('/relatorios/resumido') ? 'menu-active-item' : '' },
        { label: 'Relatório Consolidado', command: () => go('/relatorios/consolidado'), className: isActive('/relatorios/consolidado') ? 'menu-active-item' : '' },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      className: isSectionActive(adminRoutes) ? 'menu-active-item' : '',
      items: [
        { label: 'Usuários', command: () => go('/usuarios'), className: isActive('/usuarios') ? 'menu-active-item' : '' },
        { label: 'Configurações', command: () => go('/configuracoes'), className: isActive('/configuracoes') ? 'menu-active-item' : '' },
        { label: 'Configurações Emails', command: () => go('/configuracoes-emails'), className: isActive('/configuracoes-emails') ? 'menu-active-item' : '' },
        { label: 'Logs', command: () => go('/logs'), className: isActive('/logs') ? 'menu-active-item' : '' },
      ],
    },
  ]

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      style={{ width: '300px' }}
      showCloseIcon={false}
    >
      <div className="flex flex-column justify-content-between h-full">
        <div>
          <Button
            icon="pi pi-arrow-circle-left"
            label="Voltar"
            text
            className="mb-3"
            onClick={onHide}
          />

          <PanelMenu model={items} className="g4med-panel-menu" multiple />
        </div>

        <div className="mt-4">
          <Button
            icon="pi pi-sign-out"
            label="Sair"
            severity="danger"
            text
            onClick={() => {
              console.log('logout')
              onHide()
            }}
          />
        </div>
      </div>
    </Sidebar>
  )
}
