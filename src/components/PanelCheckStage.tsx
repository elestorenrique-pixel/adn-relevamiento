'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Check, X, ChevronDown, ChevronRight, AlertTriangle,
  Ruler, FileCheck, FastForward
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PANEL_STEPS } from '@/lib/types'
import type { NormativeStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function PanelCheckStage() {
  const {
    user, panelSteps, isSafetyComplete, demoMode,
    panelRegisterMeasurement, panelValidateStep, panelGetProgress, panelAutoValidateAll,
    setStage, addNotification,
  } = useStore()

  const [values, setValues] = useState<Record<string, string>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [auditorNotesMap, setAuditorNotesMap] = useState<Record<string, string>>({})
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({})
  const [openItems, setOpenItems] = useState<string[]>([])

  const isTecnico = user?.role === 'tecnico'
  const isAuditor = user?.role === 'auditor'
  const { completed, total } = panelGetProgress()
  const progressPct = total > 0 ? (completed / total) * 100 : 0

  if (!isSafetyComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Seguridad No Completada</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Debe completar y validar las 5 Reglas de Oro y el EPP antes de realizar mediciones en el tablero.
        </p>
      </div>
    )
  }

  const handleRegister = (stepId: string) => {
    const value = values[stepId] || ''
    const notes = notesMap[stepId] || ''
    if (!value.trim()) {
      addNotification('Ingrese un valor de medición', 'warning')
      return
    }
    panelRegisterMeasurement(stepId, value, notes)
    addNotification(`Medición registrada: ${PANEL_STEPS.find(s => s.id === stepId)?.label}`, 'success')
  }

  const handleValidate = (stepId: string) => {
    const notes = auditorNotesMap[stepId] || ''
    panelValidateStep(stepId, true, notes)
    addNotification(`Paso validado: ${PANEL_STEPS.find(s => s.id === stepId)?.label}`, 'success')
  }

  const handleReject = (stepId: string) => {
    const reason = rejectReasonMap[stepId] || ''
    if (!reason.trim()) {
      addNotification('Ingrese el motivo del rechazo', 'warning')
      return
    }
    panelValidateStep(stepId, false, reason, reason)
    addNotification(`Paso rechazado: ${PANEL_STEPS.find(s => s.id === stepId)?.label}`, 'error')
  }

  const getStatusBadge = (status: NormativeStatus) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Conforme</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">No Conforme</Badge>
      default:
        return <Badge variant="outline" className="text-slate-500 text-[10px]">Pendiente</Badge>
    }
  }

  const getNormativeFeedback = (stepId: string, value: string | null) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return null

    switch (stepId) {
      case 'voltage':
        if (num >= 198 && num <= 242) {
          return { ok: true, msg: `IRAM 2071: Tensión dentro de rango (198-242V)` }
        }
        return { ok: false, msg: `IRAM 2071: Tensión FUERA de rango (198-242V)` }
      case 'grounding':
        if (num <= 10) {
          return { ok: true, msg: `IRAM 2281-3: Resistencia de tierra OK (≤10Ω)` }
        }
        return { ok: false, msg: `IRAM 2281-3: Resistencia de tierra EXCEDIDA (>10Ω)` }
      case 'torque':
        if (num >= 1.2 && num <= 2.5) {
          return { ok: true, msg: `EDESA NT: Torque dentro de rango (1.2-2.5 Nm)` }
        }
        return { ok: false, msg: `EDESA NT: Torque fuera de rango (1.2-2.5 Nm)` }
      default:
        return null
    }
  }

  const allCompleted = panelSteps.every(s => s.tecnicoCompleted && (s.auditorValidated || demoMode))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Chequeo de Tablero</h2>
            <p className="text-sm text-slate-400">7 pasos de inspección y medición</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Progreso</p>
          <p className="text-lg font-bold text-amber-400">{completed}/{total}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progressPct} className="h-2 bg-slate-800 [&>div]:bg-amber-500" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{completed} completados</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Accordion Steps */}
      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-2">
        {PANEL_STEPS.map((stepDef, idx) => {
          const step = panelSteps.find(s => s.step === stepDef.id)
          if (!step) return null

          const feedback = getNormativeFeedback(stepDef.id, step.tecnicoValue)

          return (
            <motion.div
              key={stepDef.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <AccordionItem value={stepDef.id} className="border-slate-700/50 rounded-lg overflow-hidden">
                <AccordionTrigger className="hover:bg-slate-800/50 px-4 py-3 transition-colors [&>svg]:hidden">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      step.auditorValidated ? 'bg-emerald-500/20 text-emerald-400' :
                      step.tecnicoCompleted ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {step.auditorValidated ? <Check className="w-4 h-4" /> :
                       step.tecnicoCompleted ? <Ruler className="w-4 h-4" /> :
                       <span className="text-xs font-bold">{stepDef.order}</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{stepDef.label}</span>
                        {getStatusBadge(step.normativeStatus)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{stepDef.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {step.tecnicoValue && (
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {step.tecnicoValue}{stepDef.unit ? ` ${stepDef.unit}` : ''}
                        </span>
                      )}
                      {openItems.includes(stepDef.id)
                        ? <ChevronDown className="w-4 h-4 text-slate-500" />
                        : <ChevronRight className="w-4 h-4 text-slate-500" />
                      }
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    <Separator className="bg-slate-800" />

                    {/* Técnico measurement input */}
                    {isTecnico && !step.tecnicoCompleted && stepDef.unit && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          Medición {stepDef.unit ? `(${stepDef.unit})` : ''}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="any"
                            value={values[stepDef.id] || ''}
                            onChange={(e) => setValues(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                            placeholder={`Ingrese valor en ${stepDef.unit}`}
                            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-amber-500"
                          />
                          <Button
                            onClick={() => handleRegister(stepDef.id)}
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 shrink-0"
                          >
                            <FileCheck className="w-4 h-4 mr-1" /> Registrar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Non-numeric completion for técnico */}
                    {isTecnico && !step.tecnicoCompleted && !stepDef.unit && (
                      <Button
                        onClick={() => {
                          panelRegisterMeasurement(stepDef.id, 'OK', notesMap[stepDef.id] || '')
                          addNotification(`Paso completado: ${stepDef.label}`, 'success')
                        }}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
                        <Check className="w-3 h-3 mr-1" /> Completar
                      </Button>
                    )}

                    {/* Measurement display */}
                    {step.tecnicoValue && (
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Valor registrado:</span>
                          <span className="text-sm font-mono font-bold text-amber-400">
                            {step.tecnicoValue} {stepDef.unit}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Normative feedback */}
                    {feedback && (
                      <div className={`p-2 rounded-lg flex items-center gap-2 ${
                        feedback.ok ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                        {feedback.ok
                          ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        }
                        <span className={`text-xs ${feedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                          {feedback.msg}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Notas</label>
                      <Textarea
                        value={notesMap[stepDef.id] || ''}
                        onChange={(e) => setNotesMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                        placeholder="Observaciones..."
                        className="bg-slate-800 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:border-amber-500 min-h-[50px]"
                      />
                    </div>

                    {/* Auditor actions */}
                    {(isAuditor || (demoMode && step.tecnicoCompleted && !step.auditorValidated)) && step.tecnicoCompleted && !step.auditorValidated && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="text-xs text-slate-400 block">Notas del Auditor</label>
                        <Textarea
                          value={auditorNotesMap[stepDef.id] || ''}
                          onChange={(e) => setAuditorNotesMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                          placeholder="Observaciones del auditor..."
                          className="bg-slate-800 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:border-emerald-500 min-h-[50px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleValidate(stepDef.id)}
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <Check className="w-3 h-3 mr-1" /> Validar
                          </Button>
                          <div className="flex gap-1 flex-1">
                            <Input
                              value={rejectReasonMap[stepDef.id] || ''}
                              onChange={(e) => setRejectReasonMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                              placeholder="Motivo del rechazo..."
                              className="bg-slate-800 border-slate-700 text-slate-100 text-xs placeholder:text-slate-600 focus:border-red-500"
                            />
                            <Button
                              onClick={() => handleReject(stepDef.id)}
                              size="sm"
                              variant="destructive"
                              className="shrink-0"
                            >
                              <X className="w-3 h-3 mr-1" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auditor rejection display */}
                    {step.auditorErrors && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-xs text-red-400 font-medium">Rechazado:</p>
                        <p className="text-xs text-red-400/70">{step.auditorErrors}</p>
                      </div>
                    )}

                    {/* Completed info */}
                    {step.auditorValidated && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Paso validado por el Auditor</span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          )
        })}
      </Accordion>

      {/* Advance button / Demo auto-validate */}
      {allCompleted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={() => { setStage('motor'); addNotification('Avanzando a Chequeo de Motor', 'info') }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base"
          >
            Avanzar a Chequeo de Motor <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      ) : demoMode && panelSteps.some(s => s.tecnicoCompleted && !s.auditorValidated) ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={() => { panelAutoValidateAll(); addNotification('Todos los pasos validados automáticamente', 'success') }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-6 text-base"
          >
            <FastForward className="w-5 h-5 mr-2" /> Validar Todos (Demo)
          </Button>
        </motion.div>
      ) : null}
    </div>
  )
}
