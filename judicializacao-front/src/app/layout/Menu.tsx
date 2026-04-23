import { PanelMenu } from 'primereact/panelmenu'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAccess } from '../../access/AccessContext'
import { buildMenuItems } from '../navigation/menuConfigClean'
import './Menu.css'

export function Menu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { canView } = useAccess()

  const items = buildMenuItems({
    navigate,
    currentPath: location.pathname,
    canView,
  })

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
