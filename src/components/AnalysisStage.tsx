'use client'

import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Check, AlertTriangle,
  ArrowRight, Triangle
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { NormativeStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function AnalysisStage() {
  const {
    user, analysisData, isAnalysisGenerated, generateAnalysis,
    setStage, addNotification,
  } = useStore()

  const handleGenerate = () => {
    generateAnalysis()
    addNotification('Análisis generado exitosamente', 'success')
  }

  const getDeviationColor = (deviation: string, status: NormativeStatus) => {
    if (status === 'passed') return 'text-emerald-400'
    return 'text-red-400'
  }

  const getDeviationIcon = (status: NormativeStatus) => {
    if (status === 'passed') return <TrendingUp className="w-4 h-4 text-emerald-400" />
    return <TrendingDown className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Análisis de Potencia</h2>
            <p className="text-sm text-slate-400">Cálculos y desviaciones vs. placa</p>
          </div>
        </div>
      </div>

      {!isAnalysisGenerated ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Generar Análisis</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Se calcularán los valores de potencia activa, reactiva, aparente y factor de potencia
            comparando las mediciones con los datos de placa del motor.
          </p>
          <Button
            onClick={handleGenerate}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            Generar Análisis <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Analysis Results */}
          <div className="space-y-4">
            {analysisData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`bg-slate-900 border-slate-700/50 ${
                  item.status === 'passed' ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-red-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getDeviationIcon(item.status)}
                        <span className="text-sm font-semibold text-slate-200">{item.parameter}</span>
                      </div>
                      <Badge className={item.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {item.status === 'passed' ? 'Conforme' : 'No Conforme'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Medido</p>
                        <p className="text-lg font-mono font-bold text-amber-400">{item.measuredValue}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Placa</p>
                        <p className="text-lg font-mono font-bold text-slate-300">{item.plateValue}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Desviación</p>
                        <p className={`text-lg font-mono font-bold ${getDeviationColor(item.deviation || '0', item.status)}`}>
                          {item.deviation}%
                        </p>
                      </div>
                    </div>

                    {item.status === 'failed' && (
                      <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-xs text-red-400">Desviación excede los límites normativos permitidos</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Triangle of Powers Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-slate-900 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
                  <Triangle className="w-4 h-4 text-amber-500" />
                  Triángulo de Potencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <svg width="280" height="200" viewBox="0 0 280 200">
                    {/* Axes */}
                    <line x1="40" y1="170" x2="250" y2="170" stroke="rgb(71 85 105)" strokeWidth="1" />
                    <line x1="40" y1="170" x2="40" y2="20" stroke="rgb(71 85 105)" strokeWidth="1" />

                    {/* Triangle - measured */}
                    {(() => {
                      const s = analysisData.find(d => d.parameter.includes('S aparente'))
                      const p = analysisData.find(d => d.parameter.includes('P activa'))
                      const q = analysisData.find(d => d.parameter.includes('Q reactiva'))

                      if (!s || !p || !q) return null

                      const sVal = parseFloat(s.measuredValue) || 1
                      const pVal = parseFloat(p.measuredValue) || 0
                      const qVal = parseFloat(q.measuredValue) || 0
                      const maxVal = Math.max(sVal, 1)

                      const scale = 160 / maxVal
                      const px = pVal * scale
                      const qy = qVal * scale
                      const sx = px
                      const sy = 170 - qy

                      return (
                        <g>
                          {/* S (hypotenuse) */}
                          <line x1="40" y1="170" x2={40 + sx} y2={170 - qy}
                            stroke="rgb(245 158 11)" strokeWidth="2" />
                          {/* P (horizontal) */}
                          <line x1="40" y1="170" x2={40 + sx} y2="170"
                            stroke="rgb(16 185 129)" strokeWidth="2" />
                          {/* Q (vertical) */}
                          <line x1={40 + sx} y1="170" x2={40 + sx} y2={170 - qy}
                            stroke="rgb(239 68 68)" strokeWidth="2" />

                          {/* φ angle arc */}
                          <path d={`M 70 170 A 30 30 0 0 0 ${40 + 30 * Math.cos(Math.atan2(qVal, pVal))} ${170 - 30 * Math.sin(Math.atan2(qVal, pVal))}`}
                            fill="none" stroke="rgb(245 158 11)" strokeWidth="1.5" />

                          {/* Labels */}
                          <text x={40 + sx / 2} y="185" fill="rgb(16 185 129)" fontSize="12" textAnchor="middle" fontWeight="bold">
                            P = {p.measuredValue} kW
                          </text>
                          <text x={40 + sx + 10} y={170 - qy / 2} fill="rgb(239 68 68)" fontSize="12" textAnchor="start" fontWeight="bold">
                            Q = {q.measuredValue} kVAR
                          </text>
                          <text x={20 + sx / 2} y={165 - qy / 2} fill="rgb(245 158 11)" fontSize="12" textAnchor="middle" fontWeight="bold">
                            S = {s.measuredValue} kVA
                          </text>
                          <text x="75" y="166" fill="rgb(245 158 11)" fontSize="10">φ</text>
                        </g>
                      )
                    })()}

                    {/* Axis labels */}
                    <text x="145" y="198" fill="rgb(148 163 184)" fontSize="10" textAnchor="middle">P (kW)</text>
                    <text x="15" y="95" fill="rgb(148 163 184)" fontSize="10" textAnchor="middle" transform="rotate(-90, 15, 95)">Q (kVAR)</text>
                  </svg>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Advance button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Button
              onClick={() => { setStage('analysis'); addNotification('Avanzando a Documentos', 'info') }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base"
            >
              Generar Documentos <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </>
      )}
    </div>
  )
}
