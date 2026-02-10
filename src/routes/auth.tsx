import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  Separator,
  Tabs,
  TextField,
} from '@heroui/react'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ to: '/dashboard' })
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Smeduverse Finance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistem Manajemen Keuangan Pendidikan
          </p>
        </div>

        <Card className="shadow-xl shadow-gray-200/50 border border-gray-100">
          <Card.Content className="p-0">
            <Tabs className="w-full">
              <Tabs.ListContainer className="px-6 pt-4">
                <Tabs.List className="w-full">
                  <Tabs.Tab id="login" className="flex-1">Masuk</Tabs.Tab>
                  <Tabs.Tab id="register" className="flex-1">Daftar</Tabs.Tab>
                  <Tabs.Indicator />
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="login" className="p-6">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <TextField fullWidth>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type="email"
                        placeholder="admin@smeduverse.id"
                        className="pl-10"
                      />
                    </div>
                  </TextField>

                  <TextField fullWidth>
                    <Label>Kata Sandi</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </TextField>

                  <div className="flex items-center justify-between">
                    <Checkbox>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <span className="text-sm">Ingat saya</span>
                      </Checkbox.Content>
                    </Checkbox>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium mt-2"
                  >
                    Masuk
                  </Button>

                  <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                      atau
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    Masuk dengan Google
                  </Button>
                </form>
              </Tabs.Panel>

              <Tabs.Panel id="register" className="p-6">
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <TextField fullWidth>
                    <Label>Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type="text"
                        placeholder="Nama lengkap"
                        className="pl-10"
                      />
                    </div>
                  </TextField>

                  <TextField fullWidth>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type="email"
                        placeholder="email@smeduverse.id"
                        className="pl-10"
                      />
                    </div>
                  </TextField>

                  <TextField fullWidth>
                    <Label>Kata Sandi</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 8 karakter"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </TextField>

                  <TextField fullWidth>
                    <Label>Konfirmasi Kata Sandi</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Ulangi kata sandi"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </TextField>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium mt-2"
                  >
                    Daftar Akun
                  </Button>
                </form>
              </Tabs.Panel>
            </Tabs>
          </Card.Content>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; 2026 Smeduverse Finance. All rights reserved.
        </p>
      </div>
    </div>
  )
}
