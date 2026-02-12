import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
} from '@heroui/react'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { ApiResponseError } from '@/lib/api-client'
import { ThemeSwitcher } from '@/components/shared/theme-switcher'

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: AuthPage,
})

function AuthPage() {
  const { redirect: redirectPath } = Route.useSearch()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (isAuthenticated) {
      if (redirectPath && redirectPath.startsWith('/dashboard')) {
        window.location.href = redirectPath
        return
      }

      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate, redirectPath])

  const handleLogin = async () => {
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      await login({ email, password })
      if (redirectPath && redirectPath.startsWith('/dashboard')) {
        window.location.href = redirectPath
      } else {
        navigate({ to: '/dashboard' })
      }
    } catch (err) {
      if (err instanceof ApiResponseError) {
        if (err.errors) {
          setFieldErrors(err.errors)
        } else {
          setError(err.message)
        }
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4 shadow-lg shadow-accent/25">
            <GraduationCap className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            Smeduverse Finance
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Sistem Manajemen Keuangan Pendidikan
          </p>
        </div>

        <Card className="shadow-xl border border-border/50 rounded-[24px] bg-surface/90 backdrop-blur-xl">
          <Card.Content className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-1">
              Masuk
            </h2>
            <p className="text-sm text-default-500 mb-6">
              Masuk dengan akun bendahara Anda
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-danger/10 text-danger text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <TextField fullWidth isInvalid={!!fieldErrors.email}>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 z-10" />
                  <Input
                    type="email"
                    placeholder="bendahara@sekolah.id"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-danger mt-1">{fieldErrors.email[0]}</p>
                )}
              </TextField>

              <TextField fullWidth isInvalid={!!fieldErrors.password}>
                <Label>Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 z-10" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    isIconOnly
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-lg"
                    onPress={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-danger mt-1">{fieldErrors.password[0]}</p>
                )}
              </TextField>

              <Button
                type="button"
                variant="primary"
                className="w-full bg-accent text-accent-foreground font-medium mt-2 rounded-2xl"
                isDisabled={isSubmitting}
                onPress={() => void handleLogin()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <p className="text-center text-xs text-default-500 mt-6">
          &copy; 2026 Smeduverse Finance. All rights reserved.
        </p>
      </div>
    </div>
  )
}
