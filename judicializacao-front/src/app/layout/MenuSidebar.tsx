import { Sidebar } from 'primereact/sidebar'
import { PanelMenu } from 'primereact/panelmenu'
import { useNavigate } from 'react-router-dom'

interface Props {
  visible: boolean
  onHide: () => void
}

export function MenuSidebar({ visible, onHide }: Props) {
  const navigate = useNavigate()

  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/dashboard'),
    },
    {
      label: 'Processos',
      icon: 'pi pi-briefcase',
      command: () => navigate('/processos'),
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      command: () => navigate('/clientes'),
    },
    {
      label: 'Protocolos',
      icon: 'pi pi-file-edit',
      items: [
        {
          label: 'Para protocolar',
          command: () => navigate('/para-protocolar'),
        },
        {
          label: 'Protocolados',
          command: () => navigate('/protocolados'),
        },
        {
          label: 'Segredo de justiça',
          command: () => navigate('/segredo-justica'),
        },
      ],
    },
    {
      label: 'Resultados',
      icon: 'pi pi-chart-line',
      items: [
        {
          label: 'Resultados',
          command: () => navigate('/resultados'),
        },
        {
          label: 'Perdas',
          command: () => navigate('/perdas'),
        },
      ],
    },
    {
      label: 'Admin',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Relatórios',
          command: () => navigate('/relatorios'),
        },
        {
          label: 'Usuários',
          command: () => navigate('/usuarios'),
        },
        {
          label: 'Configurações',
          command: () => navigate('/configuracoes'),
        },
        {
          label: 'Logs',
          command: () => navigate('/logs'),
        },
      ],
    },
  ]

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      style={{ width: '280px' }}
      showCloseIcon={false}
    >
      <PanelMenu model={items} multiple />
    </Sidebar>
  )
}