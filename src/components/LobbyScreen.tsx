'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Plus, LogIn, Clock, Copy, Check,
  Users, ArrowRight, Shield, LogOut, RotateCcw
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function LobbyScreen() {
  const { user, sessions, createSession, joinSession, logout, isLoading, addNotification } = useStore()
  const [joinCode, setJoinCode] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCreate = async () => {
    const code = await createSession()
    if (code) {
      addNotification(`Sesión creada. Código: ${code}`, 'success')
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">ADL <span className="text-amber-500">Técnico</span></h1>
              <p className="text-xs text-slate-500">Lobby de Sesiones</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${user?.role === 'tecnico' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-sm text-slate-300">{user?.name}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                user?.role === 'tecnico'
                  ? 'border-amber-500/50 text-amber-400'
                  : 'border-emerald-500/50 text-emerald-400'
              }`}>
                {user?.role === 'tecnico' ? 'Técnico' : 'Auditor'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create Session Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-slate-900 border-slate-700/50 hover:border-amber-500/30 transition-colors h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-amber-500" />
                </div>
                <CardTitle className="text-slate-100">Crear Sesión</CardTitle>
                <p className="text-sm text-slate-400">
                  Inicie una nueva sesión de simulación y comparta el código con su compañero.
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      Nueva Sesión <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Join Session Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-slate-900 border-slate-700/50 hover:border-emerald-500/30 transition-colors h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                  <LogIn className="w-6 h-6 text-emerald-500" />
                </div>
                <CardTitle className="text-slate-100">Unirse a Sesión</CardTitle>
                <p className="text-sm text-slate-400">
                  Ingrese el código de 6 dígitos proporcionado por el creador de la sesión.
                </p>
              </CardHeader>
              <CardContent>
                {showJoinInput ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Código de 6 dígitos"
                        maxLength={6}
                        className="bg-slate-800 border-slate-600 text-slate-100 text-center text-lg tracking-[0.5em] font-mono placeholder:text-slate-600 placeholder:tracking-normal focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleJoin}
                        disabled={joinCode.length !== 6 || isLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      >
                        Conectar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setShowJoinInput(false); setJoinCode('') }}
                        className="text-slate-400"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowJoinInput(true)}
                    variant="outline"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    Ingresar Código <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Session History */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-slate-900 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <CardTitle className="text-slate-100 text-lg">Sesiones Recientes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sessions.slice(0, 10).map((session, idx) => (
                    <div key={session.id}>
                      {idx > 0 && <Separator className="bg-slate-800 mb-3" />}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-amber-400">{session.code}</span>
                              <button
                                onClick={() => handleCopyCode(session.code)}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                {copiedCode === session.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{formatDate(session.createdAt)}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                                session.status === 'completed'
                                  ? 'border-emerald-500/50 text-emerald-400'
                                  : session.status === 'safety'
                                  ? 'border-amber-500/50 text-amber-400'
                                  : 'border-slate-500/50 text-slate-400'
                              }`}>
                                {session.status === 'completed' ? 'Completada' :
                                 session.status === 'safety' ? 'Seguridad' :
                                 session.status === 'panel' ? 'Tablero' :
                                 session.status === 'motor' ? 'Motor' : 'Análisis'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.tecnicoName && (
                            <div className="flex items-center gap-1 text-xs text-amber-400">
                              <Shield className="w-3 h-3" />
                              {session.tecnicoName}
                            </div>
                          )}
                          {session.auditorName && (
                            <div className="flex items-center gap-1 text-xs text-emerald-400">
                              <Shield className="w-3 h-3" />
                              {session.auditorName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Waiting indicator */}
        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <RotateCcw className="w-4 h-4 text-slate-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm text-slate-500">Cree o únase a una sesión para comenzar</span>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-4">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-600">
            ADL Técnico · Simulación de Relevamiento y Auditoría Eléctrica · Normativas AEA 90364 / IRAM / EDESA
          </p>
        </div>
      </footer>
    </div>
  )
}
