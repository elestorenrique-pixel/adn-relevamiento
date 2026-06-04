'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cog, Check, X, ChevronRight, ChevronDown, AlertTriangle,
  Ruler, FileCheck, Info, FastForward
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { MOTOR_STEPS } from '@/lib/types'
import type { NormativeStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function MotorCheckStage() {
  const {
    user, motorSteps, nameplateData, isSafetyComplete, demoMode,
    motorRegisterMeasurement, motorValidateStep, motorSetNameplateData, motorGetProgress, motorAutoValidateAll,
    setStage, addNotification,
  } = useStore()

  const [values, setValues] = useState<Record<string, string>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [auditorNotesMap, setAuditorNotesMap] = useState<Record<string, string>>({})
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({})
  const [openItems, setOpenItems] = useState<string[]>([])
  const [showNameplate, setShowNameplate] = useState(false)
  const [coilValues, setCoilValues] = useState<Record<string, string>>({ r1: '', r2: '', r3: '' })

  const isTecnico = user?.role === 'tecnico'
  const isAuditor = user?.role === 'auditor'
  const { completed, total } = motorGetProgress()
  const progressPct = total > 0 ? (completed / total) * 100 : 0

  if (!isSafetyComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Seguridad No Completada</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Debe completar y validar las 5 Reglas de Oro antes de realizar mediciones.
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
    motorRegisterMeasurement(stepId, value, notes)
    addNotification(`Medición registrada: ${MOTOR_STEPS.find(s => s.id === stepId)?.label}`, 'success')
  }

  const handleValidate = (stepId: string) => {
    const notes = auditorNotesMap[stepId] || ''
    motorValidateStep(stepId, true, notes)
    addNotification(`Paso validado: ${MOTOR_STEPS.find(s => s.id === stepId)?.label}`, 'success')
  }

  const handleReject = (stepId: string) => {
    const reason = rejectReasonMap[stepId] || ''
    if (!reason.trim()) {
      addNotification('Ingrese el motivo del rechazo', 'warning')
      return
    }
    motorValidateStep(stepId, false, reason, reason)
    addNotification(`Paso rechazado: ${MOTOR_STEPS.find(s => s.id === stepId)?.label}`, 'error')
  }

  const getStatusBadge = (status: NormativeStatus) => {
    switch (status) {
      case 'passed': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Conforme</Badge>
      case 'failed': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">No Conforme</Badge>
      default: return <Badge variant="outline" className="text-slate-500 text-[10px]">Pendiente</Badge>
    }
  }

  const getNormativeFeedback = (stepId: string, value: string | null) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num)) return null

    switch (stepId) {
      case 'voltage':
        if (num >= 198 && num <= 242) return { ok: true, msg: 'IRAM 2071: Tensión dentro de rango (198-242V)' }
        return { ok: false, msg: 'IRAM 2071: Tensión FUERA de rango (198-242V)' }
      case 'insulation':
        if (num >= 1) return { ok: true, msg: 'IRAM 2413: Aislamiento OK (≥1MΩ)' }
        return { ok: false, msg: 'IRAM 2413: Aislamiento INSUFICIENTE (<1MΩ). ¡NO poner en servicio!' }
      default:
        return null
    }
  }

  const calculateCoilBalance = () => {
    const r1 = parseFloat(coilValues.r1) || 0
    const r2 = parseFloat(coilValues.r2) || 0
    const r3 = parseFloat(coilValues.r3) || 0
    if (r1 === 0 || r2 === 0 || r3 === 0) return null
    const avg = (r1 + r2 + r3) / 3
    const maxDev = Math.max(
      Math.abs(r1 - avg) / avg * 100,
      Math.abs(r2 - avg) / avg * 100,
      Math.abs(r3 - avg) / avg * 100
    )
    return { avg, maxDev, ok: maxDev <= 5 }
  }

  const allCompleted = motorSteps.every(s => s.tecnicoCompleted && (s.auditorValidated || demoMode))

  const nameplateFields = [
    { key: 'brand', label: 'Marca' },
    { key: 'model', label: 'Modelo' },
    { key: 'powerHp', label: 'Potencia (HP)' },
    { key: 'powerKw', label: 'Potencia (kW)' },
    { key: 'voltage', label: 'Tensión (V)' },
    { key: 'current', label: 'Corriente (A)' },
    { key: 'frequency', label: 'Frecuencia (Hz)' },
    { key: 'rpm', label: 'RPM' },
    { key: 'cosFi', label: 'cos φ' },
    { key: 'serviceFactor', label: 'Factor de servicio' },
    { key: 'insulation', label: 'Clase aislamiento' },
    { key: 'connection', label: 'Conexión' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Cog className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Chequeo de Motor</h2>
            <p className="text-sm text-slate-400">6 pasos de inspección y medición</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Progreso</p>
          <p className="text-lg font-bold text-amber-400">{completed}/{total}</p>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPct} className="h-2 bg-slate-800 [&>div]:bg-amber-500" />

      {/* Nameplate Section */}
      <Card className="bg-slate-900 border-slate-700/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowNameplate(!showNameplate)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                <Info className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-slate-200">Datos de Placa del Motor</CardTitle>
                <p className="text-xs text-slate-400">Lectura de la placa de características</p>
              </div>
            </div>
            {showNameplate
              ? <ChevronDown className="w-4 h-4 text-slate-500" />
              : <ChevronRight className="w-4 h-4 text-slate-500" />
            }
          </div>
        </CardHeader>
        <AnimatePresence>
          {showNameplate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {nameplateFields.map((field) => (
                    <div key={field.key}>
                      <Label className="text-xs text-slate-400">{field.label}</Label>
                      <Input
                        value={nameplateData[field.key] || ''}
                        onChange={(e) => motorSetNameplateData(field.key, e.target.value)}
                        disabled={!isTecnico}
                        placeholder={field.label}
                        className="bg-slate-800 border-slate-700 text-slate-100 text-sm placeholder:text-slate-600 h-8 focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Measurement Steps */}
      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-2">
        {MOTOR_STEPS.map((stepDef, idx) => {
          const step = motorSteps.find(s => s.step === stepDef.id)
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

                    {/* Special: Coil resistance with R1, R2, R3 */}
                    {stepDef.id === 'coil_resistance' && isTecnico && !step.tecnicoCompleted && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 block">Resistencia de bobinas (Ω)</label>
                        {['R1', 'R2', 'R3'].map((r) => (
                          <div key={r} className="flex items-center gap-2">
                            <Label className="text-xs text-slate-300 w-8">{r}</Label>
                            <Input
                              type="number"
                              step="any"
                              value={coilValues[r.toLowerCase() as keyof typeof coilValues] || ''}
                              onChange={(e) => setCoilValues(prev => ({ ...prev, [r.toLowerCase()]: e.target.value }))}
                              placeholder={`${r} (Ω)`}
                              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-amber-500"
                            />
                          </div>
                        ))}
                        {calculateCoilBalance() && (
                          <div className={`p-2 rounded-lg flex items-center gap-2 ${
                            calculateCoilBalance()!.ok
                              ? 'bg-emerald-500/10 border border-emerald-500/30'
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}>
                            {calculateCoilBalance()!.ok
                              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                              : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            }
                            <span className={`text-xs ${calculateCoilBalance()!.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                              Desviación: {calculateCoilBalance()!.maxDev.toFixed(1)}% (máx 5% - IRAM 62271)
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => {
                            const r1 = coilValues.r1 || '0'
                            const r2 = coilValues.r2 || '0'
                            const r3 = coilValues.r3 || '0'
                            motorRegisterMeasurement('coil_resistance', `R1=${r1} R2=${r2} R3=${r3}`, notesMap[stepDef.id] || '')
                            addNotification('Resistencia de bobinas registrada', 'success')
                          }}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                          <FileCheck className="w-4 h-4 mr-1" /> Registrar
                        </Button>
                      </div>
                    )}

                    {/* Regular measurement input */}
                    {isTecnico && !step.tecnicoCompleted && stepDef.id !== 'coil_resistance' && stepDef.unit && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          Medición ({stepDef.unit})
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

                    {/* Non-numeric completion */}
                    {isTecnico && !step.tecnicoCompleted && !stepDef.unit && stepDef.id !== 'coil_resistance' && (
                      <Button
                        onClick={() => {
                          motorRegisterMeasurement(stepDef.id, 'OK', notesMap[stepDef.id] || '')
                          addNotification(`Paso completado: ${stepDef.label}`, 'success')
                        }}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
                        <Check className="w-3 h-3 mr-1" /> Completar
                      </Button>
                    )}

                    {/* Insulation warning */}
                    {stepDef.id === 'insulation' && step.tecnicoValue && parseFloat(step.tecnicoValue) < 1 && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-bold text-red-400">¡ALERTA DE SEGURIDAD!</span>
                        </div>
                        <p className="text-xs text-red-400/70">
                          Aislamiento insuficiente. NO poner el motor en servicio. Verificar humedad o deterioro de bobinas.
                        </p>
                      </div>
                    )}

                    {/* Measurement display */}
                    {step.tecnicoValue && stepDef.id !== 'coil_resistance' && (
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Valor registrado:</span>
                          <span className="text-sm font-mono font-bold text-amber-400">
                            {step.tecnicoValue} {stepDef.unit}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Coil display */}
                    {stepDef.id === 'coil_resistance' && step.tecnicoValue && (
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <span className="text-xs text-slate-400">Valores registrados:</span>
                        <p className="text-sm font-mono text-amber-400 mt-1">{step.tecnicoValue}</p>
                      </div>
                    )}

                    {/* Normative feedback */}
                    {feedback && (
                      <div className={`p-2 rounded-lg flex items-center gap-2 ${
                        feedback.ok ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                        {feedback.ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                        <span className={`text-xs ${feedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.msg}</span>
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
                        <Textarea
                          value={auditorNotesMap[stepDef.id] || ''}
                          onChange={(e) => setAuditorNotesMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                          placeholder="Notas del auditor..."
                          className="bg-slate-800 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:border-emerald-500 min-h-[50px]"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleValidate(stepDef.id)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Check className="w-3 h-3 mr-1" /> Validar
                          </Button>
                          <div className="flex gap-1 flex-1">
                            <Input
                              value={rejectReasonMap[stepDef.id] || ''}
                              onChange={(e) => setRejectReasonMap(prev => ({ ...prev, [stepDef.id]: e.target.value }))}
                              placeholder="Motivo rechazo..."
                              className="bg-slate-800 border-slate-700 text-slate-100 text-xs placeholder:text-slate-600 focus:border-red-500"
                            />
                            <Button onClick={() => handleReject(stepDef.id)} size="sm" variant="destructive" className="shrink-0">
                              <X className="w-3 h-3 mr-1" /> Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {step.auditorErrors && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-xs text-red-400 font-medium">Rechazado:</p>
                        <p className="text-xs text-red-400/70">{step.auditorErrors}</p>
                      </div>
                    )}

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
            onClick={() => { setStage('analysis'); addNotification('Avanzando a Análisis', 'info') }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base"
          >
            Avanzar a Análisis <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      ) : demoMode && motorSteps.some(s => s.tecnicoCompleted && !s.auditorValidated) ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={() => { motorAutoValidateAll(); addNotification('Todos los pasos validados automáticamente', 'success') }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-6 text-base"
          >
            <FastForward className="w-5 h-5 mr-2" /> Validar Todos (Demo)
          </Button>
        </motion.div>
      ) : null}
    </div>
  )
}
