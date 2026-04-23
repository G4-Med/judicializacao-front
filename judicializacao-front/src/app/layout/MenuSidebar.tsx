import { Sidebar } from 'primereact/sidebar'
import { PanelMenu } from 'primereact/panelmenu'
import { Button } from 'primereact/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { useAccess } from '../../access/AccessContext'
import { buildMenuItems } from '../navigation/menuConfigClean'
import './Menu.css'

interface Props {
  visible: boolean
  onHide: () => void
}

export function MenuSidebar({ visible, onHide }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { canView } = useAccess()

  const items = buildMenuItems({
    navigate,
    currentPath: location.pathname,
    canView,
    onNavigate: onHide,
  })

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
              onHide()
              logout()
            }}
          />
        </div>
      </div>
    </Sidebar>
  )
}
