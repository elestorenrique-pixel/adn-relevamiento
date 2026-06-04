'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Plus, LogIn, Copy, Check,
  Users, ArrowRight, Shield, LogOut, RotateCcw,
  Zap, CircuitBoard, Sparkles, AlertCircle
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { SystemType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function LobbyScreen() {
  const { user, sessions, createSession, joinSession, logout, isLoading, addNotification, setSystemType } = useStore()
  const [joinCode, setJoinCode] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedSystemType, setSelectedSystemType] = useState<SystemType>('monofasico')

  const handleCreate = async () => {
    setSystemType(selectedSystemType)
    const code = await createSession(selectedSystemType)
    if (code) {
      addNotification(`Sesión ${selectedSystemType === 'trifasico' ? 'trifásica' : 'monofásica'} creada. Código: ${code}`, 'success')
    }
  }

  const handleJoin = async () => {
    if (joinCode.length !== 6) {
      addNotification('El código debe tener 6 dígitos', 'warning')
      return
    }
    const success = await joinSession(joinCode)
    if (success) {
      addNotification('Conectado a la sesión', 'success')
    } else {
      addNotification('No se pudo conectar a la sesión', 'error')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header - Professional */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ADN <span className="text-amber-400">Técnico</span></h1>
              <p className="text-xs text-slate-400">Relevamiento Eléctrico Profesional</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className={`w-2.5 h-2.5 rounded-full ${user?.role === 'tecnico' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-sm font-medium text-slate-300">{user?.name}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                user?.role === 'tecnico'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {user?.role === 'tecnico' ? '🔧 Técnico' : '✓ Auditor'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-amber-400 mb-1">Bienvenido, {user?.name?.split(' ')[0]}</h2>
              <p className="text-sm text-slate-300">Selecciona el tipo de sistema eléctrico y crea una nueva sesión o únete a una existente.</p>
            </div>
          </div>
        </motion.div>

        {/* Main Actions Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Create Session - Large Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50 hover:border-amber-500/30 transition-all duration-300 h-full shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle className="text-xl text-white">Nueva Sesión</CardTitle>
                <p className="text-sm text-slate-400 mt-2">Crear una sesión de relevamiento eléctrico</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* System Type Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">TIPO DE SISTEMA</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'monofasico', label: '220V Monofásico', icon: <Zap className="w-4 h-4" /> },
                      { type: 'trifasico', label: '380V Trifásico', icon: <CircuitBoard className="w-4 h-4" /> }
                    ].map((option) => (
                      <button
                        key={option.type}
                        onClick={() => setSelectedSystemType(option.type as SystemType)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedSystemType === option.type
                            ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={selectedSystemType === option.type ? 'text-amber-400' : 'text-slate-400'}>
                            {option.icon}
                          </div>
                          <span className={`text-sm font-bold ${
                            selectedSystemType === option.type ? 'text-amber-400' : 'text-slate-300'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-700/30" />

                {/* Create Button */}
                <Button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base py-6 rounded-lg shadow-lg shadow-amber-500/20 transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando...
                    </div>
                  ) : (
                    <>
                      Comenzar Relevamiento
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Join Session - Medium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 h-full shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                  <LogIn className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Unirse</CardTitle>
                <p className="text-sm text-slate-400 mt-2">Conectarse a sesión existente</p>
              </CardHeader>
              <CardContent>
                {showJoinInput ? (
                  <div className="space-y-3">
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="bg-slate-800 border-slate-600 text-white text-center text-3xl tracking-[0.3em] font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 py-4"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleJoin}
                        disabled={joinCode.length !== 6 || isLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                      >
                        Conectar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowJoinInput(false); setJoinCode('') }}
                        className="px-4"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowJoinInput(true)}
                    variant="outline"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 py-6 text-base font-bold"
                  >
                    Ingresa Código
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50 h-full shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-sky-400" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span className="text-slate-300"><strong>Seguridad:</strong> 5 pasos de protección</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">⚡</span>
                    <span className="text-slate-300"><strong>Mediciones:</strong> Validación automática</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold mt-0.5">📋</span>
                    <span className="text-slate-300"><strong>Normativas:</strong> AEA, IRAM, EDESA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold mt-0.5">📊</span>
                    <span className="text-slate-300"><strong>Reportes:</strong> PDF automáticos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sessions History */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50 shadow-lg">
              <CardHeader className="bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" />
                    <CardTitle className="text-white">Sesiones Activas</CardTitle>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sessions.slice(0, 5).map((session, idx) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-400 font-mono">{session.code}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${
                              session.status === 'completed' ? 'border-emerald-500/50 text-emerald-400' :
                              session.status === 'safety' ? 'border-amber-500/50 text-amber-400' :
                              'border-slate-500/50 text-slate-400'
                            }`}>
                              {session.status === 'completed' ? '✓ Completada' :
                               session.status === 'safety' ? '🔒 Seguridad' :
                               session.status === 'panel' ? '🔌 Tablero' :
                               session.status === 'motor' ? '⚙️ Motor' : '📊 Análisis'}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${
                              session.systemType === 'trifasico'
                                ? 'border-sky-500/50 text-sky-400'
                                : 'border-amber-500/50 text-amber-400'
                            }`}>
                              {session.systemType === 'trifasico' ? '⚡ 380V' : '⚡ 220V'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(session.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(session.code)}
                        className="p-1.5 rounded hover:bg-slate-700/50 transition-colors"
                        title="Copiar código"
                      >
                        {copiedCode === session.code ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="inline-flex flex-col items-center gap-3 px-6 py-8 rounded-xl bg-slate-800/20 border border-slate-700/30">
              <RotateCcw className="w-8 h-8 text-slate-500 opacity-50" style={{ animation: 'spin 3s linear infinite' }} />
              <div>
                <p className="text-lg font-semibold text-slate-300 mb-1">Sin sesiones activas</p>
                <p className="text-sm text-slate-400">Crea una nueva sesión para comenzar a relevar</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer - Clean */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-3 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-600">
            ADN Técnico • Simulación y Auditoría Eléctrica • Normativas AEA 90364 • IRAM • EDESA
          </p>
        </div>
      </footer>
    </div>
  )
}