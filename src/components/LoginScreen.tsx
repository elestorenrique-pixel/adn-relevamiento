'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import type { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function LoginScreen() {
  const { login, register, isLoading, addNotification } = useStore()

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<UserRole>('tecnico')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      addNotification('Complete todos los campos', 'warning')
      return
    }
    const success = await login(loginEmail, loginPassword)
    if (!success) {
      addNotification('Error al iniciar sesión', 'error')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) {
      addNotification('Complete todos los campos', 'warning')
      return
    }
    const success = await register(regName, regEmail, regPassword, regRole)
    if (success) {
      addNotification('Registro exitoso', 'success')
    } else {
      addNotification('Error al registrarse', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Industrial circuit background pattern */}
      <div className="absolute inset-0">
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(245 158 11) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        {/* Circuit lines - horizontal */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit-h" x="0" y="0" width="200" height="80" patternUnits="userSpaceOnUse">
              <line x1="0" y1="40" x2="80" y2="40" stroke="#f59e0b" strokeWidth="1" />
              <line x1="120" y1="40" x2="200" y2="40" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="80" cy="40" r="3" fill="none" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="120" cy="40" r="3" fill="none" stroke="#f59e0b" strokeWidth="1" />
              <line x1="80" y1="40" x2="80" y2="20" stroke="#f59e0b" strokeWidth="0.5" />
              <line x1="120" y1="40" x2="120" y2="60" stroke="#f59e0b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-h)" />
        </svg>
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/[0.02] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900/80 border border-amber-500/30 mb-4 shadow-lg shadow-amber-500/5 p-2"
          >
            <Image
              src="/adl-logo.png"
              alt="ADL Técnico Logo"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            ADL <span className="text-amber-500">Técnico</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Simulación de Relevamiento y Auditoría Eléctrica
          </p>
          <p className="text-amber-500/70 mt-1 text-xs font-medium">
            Taller y Laboratorio de 3° año — Instalaciones Eléctricas
          </p>
          <p className="text-slate-500 mt-1 text-xs">
            Prof. Héctor Cruz
          </p>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 rounded-t-lg">
              <TabsTrigger value="login" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Ingresar
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-100 text-lg">Iniciar Sesión</CardTitle>
                <CardDescription className="text-slate-400">
                  Acceda a su cuenta de simulación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tecnico@adl.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-300 text-sm">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        Ingresar <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Demo rápido:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLoginEmail('tecnico@demo.com')
                        setLoginPassword('demo')
                      }}
                      className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      Técnico
                    </button>
                    <button
                      onClick={() => {
                        setLoginEmail('auditor@demo.com')
                        setLoginPassword('demo')
                      }}
                      className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      Auditor
                    </button>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-100 text-lg">Crear Cuenta</CardTitle>
                <CardDescription className="text-slate-400">
                  Regístrese para acceder a la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-slate-300 text-sm">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-slate-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="tecnico@adl.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-slate-300 text-sm">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-role" className="text-slate-300 text-sm">Rol</Label>
                    <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100 focus:border-amber-500">
                        <Shield className="w-4 h-4 mr-2 text-slate-500" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="tecnico" className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Técnico - Realiza mediciones y procedimientos
                          </div>
                        </SelectItem>
                        <SelectItem value="auditor" className="text-slate-100 focus:bg-emerald-500/20 focus:text-emerald-400">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Auditor - Valida y supervisa procedimientos
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        Crear Cuenta <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          ADL Técnico · Simulación de Relevamiento y Auditoría Eléctrica · Prof. Héctor Cruz · Normativas AEA 90364 / IRAM / EDESA
        </p>
      </motion.div>
    </div>
  )
}
