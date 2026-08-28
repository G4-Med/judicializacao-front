import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '../../styles/medcheck-tokens.css'   // ← ADICIONAR (antes do global.css)
import '../../styles/global.css'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Menu } from './Menu'                // ← trocar MenuSidebar por Menu
import { MenuControlProvider, useMenuControl } from './MenuControlContext'

// Arrastar-para-rolar horizontal nas tabelas (@R 28/08 03:0x: "barra de rolagem
// lateral e para arrastar para o lado") — delegação global, 1 listener p/ o app.
function usarArrastarTabelas() {
  useEffect(() => {
    let alvo: HTMLElement | null = null
    let startX = 0
    let startScroll = 0
    let arrastou = false
    const down = (e: MouseEvent) => {
      const w = (e.target as HTMLElement).closest?.('.p-datatable-wrapper') as HTMLElement | null
      if (!w || e.button !== 0) return
      if ((e.target as HTMLElement).closest('button, a, input, textarea, select, .p-checkbox, .p-dropdown')) return
      alvo = w; startX = e.pageX; startScroll = w.scrollLeft; arrastou = false
    }
    const move = (e: MouseEvent) => {
      if (!alvo) return
      const dx = e.pageX - startX
      if (Math.abs(dx) > 4) {
        arrastou = true
        alvo.classList.add('mc-arrastando')
        alvo.scrollLeft = startScroll - dx
      }
    }
    const up = (e: MouseEvent) => {
      if (alvo && arrastou) { e.preventDefault(); e.stopPropagation() }
      alvo?.classList.remove('mc-arrastando')
      alvo = null
    }
    document.addEventListener('mousedown', down)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up, true)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up, true)
    }
  }, [])
}

function MainLayoutInner() {
  const menu = useMenuControl()
  usarArrastarTabelas()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header onMenuClick={menu.toggle} />

      <Menu
        visible={menu.visible}
        onHide={menu.close}
      />

      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}

export function MainLayout() {
  return (
    <MenuControlProvider>
      <MainLayoutInner />
    </MenuControlProvider>
  )
}