import { Button } from '@heroui/react'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <Button
      isIconOnly
      variant="secondary"
      size="sm"
      className="rounded-xl"
      onPress={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      aria-label="Switch theme"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  )
}
