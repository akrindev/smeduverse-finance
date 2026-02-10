import { createFileRoute, Outlet, Link, useMatches } from '@tanstack/react-router'
import { Avatar, Button, Dropdown } from '@heroui/react'
import {
  LayoutDashboard,
  Receipt,
  GraduationCap,
  CreditCard,
  Bell,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

const navItems = [
  {
    to: '/dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  { to: '/dashboard/spp' as const, label: 'SPP', icon: Receipt },
  {
    to: '/dashboard/beasiswa' as const,
    label: 'Beasiswa',
    icon: GraduationCap,
  },
  {
    to: '/dashboard/payments' as const,
    label: 'Pembayaran',
    icon: CreditCard,
  },
]

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              Smeduverse
            </h1>
            <p className="text-[11px] text-gray-400 leading-tight">Finance</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu Utama
          </p>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? currentPath === '/dashboard' || currentPath === '/dashboard/'
                : currentPath.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Dropdown>
            <Dropdown.Trigger>
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <Avatar size="sm" color="accent">
                  <Avatar.Fallback>AD</Avatar.Fallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Admin
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    admin@smeduverse.id
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </Dropdown.Trigger>
            <Dropdown.Popover placement="top start">
              <Dropdown.Menu aria-label="User menu">
                <Dropdown.Item id="profile">
                  <User className="w-4 h-4 mr-2 inline" />
                  Profil
                </Dropdown.Item>
                <Dropdown.Item id="settings">
                  <Settings className="w-4 h-4 mr-2 inline" />
                  Pengaturan
                </Dropdown.Item>
                <Dropdown.Item id="logout" className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2 inline" />
                  Keluar
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">
              {navItems.find((item) =>
                item.exact
                  ? currentPath === '/dashboard' ||
                    currentPath === '/dashboard/'
                  : currentPath.startsWith(item.to),
              )?.label ?? 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              isIconOnly
              size="sm"
              className="relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Avatar size="sm" color="accent">
                <Avatar.Fallback>AD</Avatar.Fallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex items-center justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const isActive = item.exact
              ? currentPath === '/dashboard' || currentPath === '/dashboard/'
              : currentPath.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[60px] transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
