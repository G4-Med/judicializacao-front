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
      label: 'Dashboard',
      icon: 'pi pi-home',
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
        {
          label: 'Para protocolar',
          command: () => go('/para-protocolar'),
        },
        {
          label: 'Protocolados',
          command: () => go('/protocolados'),
        },
        {
          label: 'Segredo de justiça',
          command: () => go('/segredo-justica'),
        },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      items: [
        {
          label: 'Resultados',
          command: () => go('/resultados'),
        },
        {
          label: 'Perdas',
          command: () => go('/perdas'),
        },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Relatórios',
          command: () => go('/relatorios'),
        },
        {
          label: 'Usuários',
          command: () => go('/usuarios'),
        },
        {
          label: 'Configurações',
          command: () => go('/configuracoes'),
        },
        {
          label: 'Logs',
          command: () => go('/logs'),
        },
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

        {/* TOPO */}
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

        {/* RODAPÉ */}
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