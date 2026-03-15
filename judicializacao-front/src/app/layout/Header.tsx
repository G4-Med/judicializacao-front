import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import logo from '../../assets/logog4med.png'

interface Props {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: Props) {
  return (
    <div
      className="flex align-items-center justify-content-between px-4"
      style={{
        height: '64px',
        background: '#000',
        borderBottom: '1px solid #2a2a2a',
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

        <Button icon="pi pi-moon" text rounded style={{ color: 'white' }} />

        <Button icon="pi pi-bell" text rounded style={{ color: 'white' }} />

        <Button icon="pi pi-question-circle" text rounded style={{ color: 'white' }} />

        <Button icon="pi pi-sign-out" text rounded style={{ color: 'white' }} />

        <Avatar icon="pi pi-user" shape="circle" />
      </div>
    </div>
  )
}