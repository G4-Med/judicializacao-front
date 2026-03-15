import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { useEffect, useState } from 'react'
import { setTheme } from '../../utils/theme'
import logo from '../../assets/logog4med.png'

interface Props {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: Props) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'

    if (savedTheme === 'dark') {
      setDark(true)
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [])

  const toggleTheme = () => {
    const newDark = !dark

    setDark(newDark)

    if (newDark) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <div
      className="flex align-items-center justify-content-between px-4"
      style={{
        height: '64px',
        background: '#000',
        borderBottom: '1px solid #2a2a2a'
      }}
    >
      <div className="flex align-items-center gap-3">

        <Button
          icon="pi pi-bars"
          text
          rounded
          onClick={onMenuClick}
          style={{ color: 'white' }}
        />

        <img src={logo} alt="G4MED" style={{ height: '36px' }} />

      </div>

      <div className="flex align-items-center gap-3">

        {/* DARK MODE */}
        <Button
          icon={dark ? 'pi pi-sun' : 'pi pi-moon'}
          text
          rounded
          onClick={toggleTheme}
          style={{ color: 'white' }}
        />

        <Button icon="pi pi-bell" text rounded style={{ color: 'white' }} />

        <Button icon="pi pi-question-circle" text rounded style={{ color: 'white' }} />

        <Button icon="pi pi-sign-out" text rounded style={{ color: 'white' }} />

        <Avatar icon="pi pi-user" shape="circle" />

      </div>
    </div>
  )
}