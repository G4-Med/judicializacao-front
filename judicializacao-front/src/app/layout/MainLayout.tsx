import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '../../styles/medcheck-tokens.css'   // ← ADICIONAR (antes do global.css)
import '../../styles/global.css'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Header } from './Header'
import { Menu } from './Menu'                // ← trocar MenuSidebar por Menu

export function MainLayout() {
  const [menuVisible, setMenuVisible] = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header onMenuClick={() => setMenuVisible((v) => !v)} />

      <Menu
        visible={menuVisible}
        onHide={() => setMenuVisible(false)}
      />

      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}