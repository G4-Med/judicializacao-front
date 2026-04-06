import { Sidebar } from 'primereact/sidebar'
import { PanelMenu } from 'primereact/panelmenu'
import { Button } from 'primereact/button'
import { useNavigate } from 'react-router-dom'

interface Props {
  visible: boolean
  onHide: () => void
}

export function MenuSidebar({ visible, onHide }: Props) {
  const navigate = useNavigate()

  const go = (path: string) => {
    navigate(path)
    onHide()
  }

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => go('/home'),
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => go('/dashboard'),
    },
    {
      label: 'Processos',
      icon: 'pi pi-briefcase',
      command: () => go('/processos'),
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => go('/clientes'),
    },
    {
      label: 'Protocolos',
      icon: 'pi pi-file-edit',
      items: [
        { label: 'Jurídico', command: () => go('/juridico') },
        { label: 'Orçamento Médico', command: () => go('/orcamento-medico') },
        { label: 'Protocolar', command: () => go('/para-protocolar') },
        { label: 'Protocolados', command: () => go('/protocolados') },
        { label: 'Segredo de Justiça', command: () => go('/segredo-justica') },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      items: [
        { label: 'Resultados', command: () => go('/resultados') },
        { label: 'Perdas', command: () => go('/perdas') },
      ],
    },
    {
      label: 'Emails',
      icon: 'pi pi-envelope',
      command: () => go('/emails'),
    },
    {
      label: 'Relatórios',
      icon: 'pi pi-file-pdf',
      items: [
        { label: 'Relatório Resumido', command: () => go('/relatorios/resumido') },
        { label: 'Relatório Consolidado', command: () => go('/relatorios/consolidado') },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      items: [
        { label: 'Usuários', command: () => go('/usuarios') },
        { label: 'Configurações', command: () => go('/configuracoes') },
        { label: 'Configurações Emails', command: () => go('/configuracoes-emails') },
        { label: 'Logs', command: () => go('/logs') },
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

          <PanelMenu model={items} multiple />
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
