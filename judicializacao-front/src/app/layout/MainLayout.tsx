import 'primereact/resources/themes/lara-dark-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Header } from './Header'
import { MenuSidebar } from './MenuSidebar'

export function MainLayout() {
  const [menuVisible, setMenuVisible] = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header onMenuClick={() => setMenuVisible(true)} />

      <MenuSidebar
        visible={menuVisible}
        onHide={() => setMenuVisible(false)}
      />

      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}