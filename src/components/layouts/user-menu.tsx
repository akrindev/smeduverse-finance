import { Avatar, Button, Dropdown } from '@heroui/react'
import { LogOut, Settings, User } from 'lucide-react'

interface UserMenuProps {
  displayName: string
  displayEmail: string
  initials: string
  placement: 'right' | 'bottom end'
  onLogout: () => void
  className?: string
}

export function UserMenu({
  displayName,
  displayEmail,
  initials,
  placement,
  onLogout,
  className,
}: UserMenuProps) {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button isIconOnly variant="ghost" className={className} aria-label="Akun">
          <Avatar size="sm" color="accent">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover placement={placement}>
        <Dropdown.Menu aria-label="User menu">
          <Dropdown.Item id="user-info" textValue={displayName}>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-default-500">{displayEmail}</span>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="profile">
            <User className="w-4 h-4 mr-2 inline" />
            Profil
          </Dropdown.Item>
          <Dropdown.Item id="settings">
            <Settings className="w-4 h-4 mr-2 inline" />
            Pengaturan
          </Dropdown.Item>
          <Dropdown.Item id="logout" className="text-danger" onAction={onLogout}>
            <LogOut className="w-4 h-4 mr-2 inline" />
            Keluar
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
