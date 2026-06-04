'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Check, Lock, AlertTriangle, ChevronRight,
  HardHat, Eye, Hand, Zap, FastForward
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { SAFETY_STEPS, EPP_ITEMS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function SafetyStage() {
  const {
    user, safetySteps, eppChecks, isSafetyComplete, demoMode,
    safetyCompleteStep, safetyValidateStep, toggleEpp, checkSafetyCompletion,
    safetyAutoValidateAll, eppAutoCheckAll, toggleDemoMode,
    setStage, addNotification,
  } = useStore()

  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const isTecnico = user?.role === 'tecnico'
  const isAuditor = user?.role === 'auditor'

  const completedCount = safetySteps.filter(s => s.tecnicoCompleted).length
  const validatedCount = safetySteps.filter(s => s.auditorValidated).length
  const progressPct = (completedCount / safetySteps.length) * 100
  const eppCount = Object.values(eppChecks).filter(Boolean).length

  const handleCompleteStep = (stepId: string) => {
    const notes = notesMap[stepId] || ''
    safetyCompleteStep(stepId, notes)
    addNotification(`Paso "${SAFETY_STEPS.find(s => s.id === stepId)?.label}" completado`, 'success')
  }

  const handleValidateStep = (stepId: string) => {
    const notes = notesMap[stepId] || ''
    safetyValidateStep(stepId, notes)
    addNotification(`Paso "${SAFETY_STEPS.find(s => s.id === stepId)?.label}" validado`, 'success')
  }

  const handleAdvance = () => {
    setStage('panel')
    addNotification('Avanzando a Chequeo de Tablero', 'info')
  }

  const handleAutoComplete = () => {
    safetyAutoValidateAll()
    eppAutoCheckAll()
    addNotification('Todos los pasos de seguridad completados automáticamente (Modo Demo)', 'success')
  }

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'identify': return <Eye className="w-4 h-4" />
      case 'verify_zero': return <HardHat className="w-4 h-4" />
      case 'grounding': return <Hand className="w-4 h-4" />
      case 'block': return <Lock className="w-4 h-4" />
      case 'signal': return <AlertTriangle className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">5 Reglas de Oro</h2>
            <p className="text-sm text-slate-400">Seguridad eléctrica - AEA 90364</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Progreso</p>
          <p className="text-lg font-bold text-amber-400">{completedCount}/{safetySteps.length}</p>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <Card className="bg-slate-900 border-amber-500/20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <Label className="text-sm text-slate-200 cursor-pointer">Modo Demo</Label>
                <p className="text-xs text-slate-400">Auto-validar pasos sin auditor presente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {demoMode && (
                <Button
                  onClick={handleAutoComplete}
                  size="sm"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs"
                >
                  <FastForward className="w-3 h-3 mr-1" /> Completar Todo
                </Button>
              )}
              <Switch
                checked={demoMode}
                onCheckedChange={toggleDemoMode}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progressPct} className="h-2 bg-slate-800 [&>div]:bg-amber-500" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{completedCount} completados</span>
          <span>{validatedCount} validados</span>
        </div>
      </div>

      {/* Blocking warning */}
      {!isSafetyComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <Lock className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Acceso Bloqueado</p>
            <p className="text-xs text-red-400/70">
              {demoMode
                ? 'Complete TODAS las reglas de oro y el EPP para avanzar.'
                : 'Debe completar y validar TODAS las reglas de oro y el EPP antes de avanzar a mediciones.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Safety Steps */}
      <div className="space-y-3">
        {SAFETY_STEPS.map((stepDef, idx) => {
          const step = safetySteps.find(s => s.step === stepDef.id)
          if (!step) return null

          const isExpanded = expandedStep === stepDef.id
          const isCompleted = step.tecnicoCompleted
          const isValidated = step.auditorValidated

          return (
            <motion.div
              key={stepDef.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`bg-slate-900 border-slate-700/50 transition-all ${
                isValidated ? 'border-emerald-500/30' :
                isCompleted ? 'border-amber-500/30' :
                'hover:border-slate-600'
              }`}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedStep(isExpanded ? null : stepDef.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isValidated ? 'bg-emerald-500/20 text-emerald-400' :
                        isCompleted ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {isValidated ? <Check className="w-4 h-4" /> :
                         isCompleted ? <Check className="w-4 h-4" /> :
                         getStepIcon(stepDef.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Paso {stepDef.order}</span>
                          <CardTitle className="text-sm text-slate-200">{stepDef.label}</CardTitle>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{stepDef.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isValidated && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Validado</Badge>}
                      {isCompleted && !isValidated && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Completado</Badge>}
                      {!isCompleted && <Badge variant="outline" className="text-slate-500 text-[10px]">Pendiente</Badge>}
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 space-y-3">
                        <Separator className="bg-slate-800" />

                        {/* Notes */}
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Notas</label>
                          <Textarea
                            value={notesMap[stepDef.id] || ''}
                            onChange={(e) => setNotesMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                            placeholder="Observaciones..."
                            disabled={isCompleted && isValidated}
                            className="bg-slate-800 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:border-amber-500 min-h-[60px]"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {(isTecnico || demoMode) && !isCompleted && (
                            <Button
                              onClick={() => handleCompleteStep(stepDef.id)}
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                            >
                              <Check className="w-3 h-3 mr-1" /> Completar
                            </Button>
                          )}
                          {(isAuditor || (demoMode && isCompleted && !isValidated)) && !isValidated && isCompleted && (
                            <Button
                              onClick={() => handleValidateStep(stepDef.id)}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3 mr-1" /> Validar
                            </Button>
                          )}
                          {isCompleted && !isValidated && !demoMode && isTecnico && (
                            <span className="text-xs text-slate-500 self-center">
                              Esperando validación del Auditor
                            </span>
                          )}
                          {!isCompleted && isAuditor && !demoMode && (
                            <span className="text-xs text-slate-500 italic self-center">
                              Esperando completitud del Técnico
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* EPP Checklist */}
      <Card className="bg-slate-900 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <HardHat className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-slate-200">EPP - Equipo de Protección Personal</CardTitle>
                <p className="text-xs text-slate-400">{eppCount}/{EPP_ITEMS.length} verificados</p>
              </div>
            </div>
            {demoMode && (
              <Button
                onClick={eppAutoCheckAll}
                size="sm"
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs"
              >
                <FastForward className="w-3 h-3 mr-1" /> Marcar Todo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {EPP_ITEMS.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div
                  onClick={() => toggleEpp(item)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    eppChecks[item]
                      ? 'bg-amber-500 border-amber-500 text-slate-900'
                      : 'border-slate-600'
                  }`}
                >
                  {eppChecks[item] && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-sm ${eppChecks[item] ? 'text-slate-200' : 'text-slate-400'}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advance button */}
      {isSafetyComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleAdvance}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base"
          >
            Avanzar a Chequeo de Tablero <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
