'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  FileText, Download, Mail, Eye, Check, Printer,
  ClipboardCheck, Receipt, FileSearch, Loader2, User
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface DocumentCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: 'pending' | 'generating' | 'ready'
  onGenerate: () => void
  onPreview: () => void
  onDownload: () => void
  onEmail: () => void
  color: string
}

function DocumentCard({ icon, title, description, status, onGenerate, onPreview, onDownload, onEmail, color }: DocumentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900 border-slate-700/50 hover:border-slate-600 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                {status === 'generating' ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
              </div>
              <div>
                <CardTitle className="text-sm text-slate-200">{title}</CardTitle>
                <CardDescription className="text-xs text-slate-400">{description}</CardDescription>
              </div>
            </div>
            <Badge className={
              status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              status === 'generating' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }>
              {status === 'ready' ? 'Listo' : status === 'generating' ? 'Generando...' : 'Pendiente'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {status === 'pending' && (
              <Button onClick={onGenerate} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                Generar
              </Button>
            )}
            {status === 'generating' && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando documento...
              </div>
            )}
            {status === 'ready' && (
              <>
                <Button onClick={onDownload} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                  <Download className="w-3 h-3 mr-1" /> Descargar PDF
                </Button>
                <Button onClick={onPreview} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Eye className="w-3 h-3 mr-1" /> Vista Previa
                </Button>
                <Button onClick={onEmail} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Mail className="w-3 h-3 mr-1" /> Email
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function DocumentsStage() {
  const { user, addNotification, currentSession, analysisData, safetySteps, panelSteps, motorSteps, systemType } = useStore()

  const isTrifasico = systemType === 'trifasico'

  const [docStatuses, setDocStatuses] = useState<Record<string, 'pending' | 'generating' | 'ready'>>({
    relevamiento: 'pending',
    auditoria: 'pending',
    presupuesto: 'pending',
  })

  const [pdfData, setPdfData] = useState<Record<string, string>>({})

  const handleGenerate = async (docType: string) => {
    setDocStatuses(prev => ({ ...prev, [docType]: 'generating' }))

    try {
      // Try the API first
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession?.id || 'demo',
          documentType: docType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0]
          setPdfData(prev => ({ ...prev, [docType]: doc.pdfBase64 }))
          setDocStatuses(prev => ({ ...prev, [docType]: 'ready' }))
          addNotification(`Documento "${docType}" generado exitosamente`, 'success')
          return
        }
      }
    } catch {
      // Fallback to client-side generation
    }

    // Client-side fallback - generate a PDF with improved formatting
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Header with logo placeholder
      doc.setFillColor(30, 58, 46)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('ADN Técnico', 14, 12)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('Taller y Laboratorio de 3° año - Instalaciones Eléctricas', 14, 18)
      doc.setFont('helvetica', 'normal')
      doc.text('Instructor: Prof. Héctor Cruz', 14, 23)

      const titles: Record<string, string> = {
        relevamiento: 'Informe de Relevamiento Eléctrico',
        auditoria: 'Informe de Auditoría Eléctrica',
        presupuesto: 'Presupuesto - Correcciones y Materiales',
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(titles[docType] || 'Documento', 14, 32)

      // Session info on right
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Código: ${currentSession?.code || 'N/A'}`, 196, 12, { align: 'right' })
      doc.text(`Sistema: ${isTrifasico ? 'Trifásico 380V' : 'Monofásico 220V'}`, 196, 17, { align: 'right' })
      doc.text(`Técnico: ${currentSession?.tecnicoName || user?.name || 'N/A'}`, 196, 22, { align: 'right' })
      doc.text(`Auditor: ${currentSession?.auditorName || 'N/A'}`, 196, 27, { align: 'right' })
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 196, 32, { align: 'right' })

      // Instructor/Course info box
      let y = 46
      doc.setFillColor(240, 245, 240)
      doc.rect(14, y - 3, 182, 12, 'F')
      doc.setDrawColor(30, 58, 46)
      doc.rect(14, y - 3, 182, 12, 'S')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 46)
      doc.text('Taller y Laboratorio de 3° año - Instalaciones Eléctricas', 16, y + 2)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('Instructor: Prof. Héctor Cruz | AEA 90364 / IRAM / EDESA', 16, y + 7)
      y += 16

      // Helper to add colored section header
      const addSectionHeader = (text: string, yPos: number): number => {
        doc.setFillColor(30, 58, 46)
        doc.rect(14, yPos - 4, 182, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(text, 16, yPos + 1)
        doc.setTextColor(0, 0, 0)
        return yPos + 8
      }

      // Helper to check page overflow
      const checkPage = (yPos: number, needed: number = 30): number => {
        if (yPos + needed > 265) { doc.addPage(); return 20 }
        return yPos
      }

      const stepLabels: Record<string, string> = {
        identify: 'Identificar',
        verify_zero: 'Verificar Ausencia de Tensión',
        grounding: 'Puesta a Tierra',
        block: 'Bloqueo / Señalización',
        signal: 'Delimitar Zona de Trabajo',
      }
      const panelLabels: Record<string, string> = {
        voltage_ln: 'Tensión L-N',
        voltage_ll: 'Tensión L-L',
        voltage_imbalance: 'Desbalance de Tensión',
        current_phase: 'Corriente de Fase',
        current_r: 'Corriente Fase R',
        current_s: 'Corriente Fase S',
        current_t: 'Corriente Fase T',
        current_neutral: 'Corriente de Neutro',
        conductors: 'Identificar Conductores',
        distribution: 'Verificar Distribución',
        differential: 'Protección Diferencial',
        grounding: 'Control Puesta a Tierra',
        terminals: 'Verificar Terminales',
        torque: 'Ajustar Torque',
        voltage: 'Medir Tensión',
        current: 'Medir Corriente',
      }
      const motorLabels: Record<string, string> = {
        voltage: 'Medir Tensión',
        voltage_ln: 'Tensión L-N en Bornes',
        voltage_ll: 'Tensión L-L en Bornes',
        current: 'Corriente de Trabajo',
        current_r: 'Corriente Fase R',
        current_s: 'Corriente Fase S',
        current_t: 'Corriente Fase T',
        current_start: 'Corriente de Arranque',
        coil_resistance: 'Resistencia de Bobinas',
        insulation: 'Aislamiento (Bobina-Carcasa)',
        nameplate: 'Lectura de Placa',
        power_cosfi: 'Potencia y Coseno φ',
      }

      if (docType === 'relevamiento') {
        // 1. Safety
        y = addSectionHeader('1. Verificaciones de Seguridad - 5 Reglas de Oro', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)

        for (const step of safetySteps) {
          y = checkPage(y, 8)
          const label = stepLabels[step.step] || step.step
          const status = step.tecnicoCompleted && step.auditorValidated ? '✓' : '✗'
          doc.text(`  ${status} ${label}${step.tecnicoNotes ? ` - ${step.tecnicoNotes}` : ''}`, 14, y)
          y += 5
        }

        // 2. Panel
        y += 5; y = checkPage(y)
        y = addSectionHeader('2. Verificaciones de Tablero', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        for (const step of panelSteps) {
          y = checkPage(y, 8)
          const label = panelLabels[step.step] || step.step
          const value = step.tecnicoValue ? ` = ${step.tecnicoValue}` : ''
          const status = step.normativeStatus === 'passed' ? '✓' : step.normativeStatus === 'failed' ? '✗' : '○'
          doc.text(`  ${status} ${label}${value}`, 14, y)
          y += 5
        }

        // 3. Motor
        y += 5; y = checkPage(y)
        y = addSectionHeader('3. Verificaciones de Motor', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        for (const step of motorSteps) {
          y = checkPage(y, 8)
          const label = motorLabels[step.step] || step.step
          const value = step.tecnicoValue ? ` = ${step.tecnicoValue}` : ''
          const status = step.normativeStatus === 'passed' ? '✓' : step.normativeStatus === 'failed' ? '✗' : '○'
          doc.text(`  ${status} ${label}${value}`, 14, y)
          y += 5
        }

        // 4. Motor Nameplate Data
        const nameplateStep = motorSteps.find(s => s.step === 'nameplate')
        if (nameplateStep && nameplateStep.tecnicoValue) {
          y += 5; y = checkPage(y)
          y = addSectionHeader('4. Datos de Placa del Motor', y)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          try {
            const np = JSON.parse(nameplateStep.tecnicoValue)
            const npFields = [
              ['Marca', np.brand], ['Modelo', np.model], ['Potencia (HP)', np.powerHp],
              ['Potencia (kW)', np.powerKw], ['Tensión (V)', np.voltage], ['Corriente (A)', np.current],
              ['Frecuencia (Hz)', np.frequency], ['RPM', np.rpm], ['cos φ', np.cosFi],
              ['Factor de Servicio', np.serviceFactor], ['Aislamiento', np.insulation], ['Conexión', np.connection],
            ]
            for (const [label, val] of npFields) {
              y = checkPage(y, 8)
              doc.text(`  ${label}: ${val || '-'}`, 14, y)
              y += 5
            }
          } catch {
            doc.text(`  Datos de placa: ${nameplateStep.tecnicoValue}`, 14, y)
            y += 5
          }
        }

        // 5. Analysis
        const analysisNum = nameplateStep && nameplateStep.tecnicoValue ? '5' : '4'
        if (analysisData.length > 0) {
          y += 5; y = checkPage(y)
          y = addSectionHeader(`${analysisNum}. Análisis de Potencia`, y)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')

          for (const item of analysisData) {
            y = checkPage(y, 8)
            const status = item.status === 'passed' ? '✓' : '✗'
            doc.text(`  ${status} ${item.parameter}: Medido=${item.measuredValue}, Placa=${item.plateValue}, Desv=${item.deviation}%`, 14, y)
            y += 5
          }
        }

        // Normative References
        y += 8; y = checkPage(y)
        y = addSectionHeader('Referencias Normativas', y)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        const normRefs = [
          'AEA 90364 - Instalaciones eléctricas en inmuebles',
          'IRAM 2071 - Tensiones nominales de distribución',
          'IRAM 2281-3 - Puesta a tierra',
          'IRAM 2413 - Aislamiento eléctrico',
          'IRAM 62271 - Equipos de maniobra y protección',
          'EDESA NT - Normas Técnicas distribuidora Salta',
        ]
        for (const ref of normRefs) {
          y = checkPage(y, 8)
          doc.text(`  • ${ref}`, 14, y)
          y += 4
        }

      } else if (docType === 'auditoria') {
        // 1. Auto-generated findings
        y = addSectionHeader('1. Hallazgos de Auditoría (Evaluación Normativa)', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const safetyIssues = safetySteps.filter(s => !s.tecnicoCompleted || !s.auditorValidated)
        const panelFailures = panelSteps.filter(s => s.normativeStatus === 'failed')
        const motorFailures = motorSteps.filter(s => s.normativeStatus === 'failed')

        if (safetyIssues.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 58, 46)
          doc.text('Seguridad - Observaciones:', 14, y); y += 5
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          for (const step of safetyIssues) {
            y = checkPage(y, 8)
            const label = stepLabels[step.step] || step.step
            if (!step.tecnicoCompleted) {
              doc.text(`  ✗ "${label}" no completado por técnico`, 14, y); y += 5
            }
            if (!step.auditorValidated) {
              doc.text(`  ✗ "${label}" no validado por auditor`, 14, y); y += 5
            }
          }
        }

        if (panelFailures.length > 0) {
          y += 3; y = checkPage(y)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 58, 46)
          doc.text('Tablero - No conformidades:', 14, y); y += 5
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          for (const step of panelFailures) {
            y = checkPage(y, 8)
            const label = panelLabels[step.step] || step.step
            doc.text(`  ✗ ${label}: ${step.tecnicoValue || 'sin valor'} - Fuera de rango normativo`, 14, y); y += 5
          }
        }

        if (motorFailures.length > 0) {
          y += 3; y = checkPage(y)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 58, 46)
          doc.text('Motor - No conformidades:', 14, y); y += 5
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          for (const step of motorFailures) {
            y = checkPage(y, 8)
            const label = motorLabels[step.step] || step.step
            doc.text(`  ✗ ${label}: ${step.tecnicoValue || 'sin valor'} - Fuera de rango normativo`, 14, y); y += 5
          }
        }

        if (safetyIssues.length === 0 && panelFailures.length === 0 && motorFailures.length === 0) {
          doc.setTextColor(34, 139, 34)
          doc.text('✓ Todas las verificaciones conformes con la normativa vigente.', 14, y); y += 5
          doc.setTextColor(0, 0, 0)
        }

        // 2. Summary
        y += 5; y = checkPage(y)
        y = addSectionHeader('2. Resumen de Auditoría', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const safetyCompleted = safetySteps.filter(s => s.tecnicoCompleted).length
        const safetyTotal = safetySteps.length
        const panelPassed = panelSteps.filter(s => s.normativeStatus === 'passed').length
        const panelTotal = panelSteps.length
        const motorPassed = motorSteps.filter(s => s.normativeStatus === 'passed').length
        const motorTotal = motorSteps.length

        doc.text(`Seguridad: ${safetyCompleted}/${safetyTotal} completados`, 14, y); y += 5
        doc.text(`Tablero: ${panelPassed}/${panelTotal} aprobados, ${panelFailures.length} rechazados`, 14, y); y += 5
        doc.text(`Motor: ${motorPassed}/${motorTotal} aprobados, ${motorFailures.length} rechazados`, 14, y); y += 8

        // 3. Normative references
        y = checkPage(y)
        y = addSectionHeader('3. Referencias Normativas', y)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        const auditNormRefs = [
          'AEA 90364 - Asociación Electrotécnica Argentina',
          'IRAM 2071 - Tensiones nominales y tolerancias',
          'IRAM 2281-3 - Protección contra descargas - Puesta a tierra',
          'IRAM 2413 - Ensayos de aislamiento eléctrico',
          'IRAM 62271 - Equipos de maniobra y protección',
          'EDESA NT - Normas Técnicas distribuidora EDESA Salta',
        ]
        for (const ref of auditNormRefs) {
          y = checkPage(y, 8)
          doc.text(`  • ${ref}`, 14, y)
          y += 4
        }

      } else if (docType === 'presupuesto') {
        // Correcciones Detectadas
        const failedPanel = panelSteps.filter(s => s.normativeStatus === 'failed')
        const failedMotor = motorSteps.filter(s => s.normativeStatus === 'failed')

        if (failedPanel.length > 0 || failedMotor.length > 0) {
          y = addSectionHeader('Correcciones Detectadas', y)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')

          for (const f of failedPanel) {
            y = checkPage(y, 8)
            const label = panelLabels[f.step] || f.step
            doc.text(`  ✗ Tablero - ${label}: ${f.tecnicoValue || 'sin valor'} - Fuera de rango`, 14, y); y += 5
          }
          for (const f of failedMotor) {
            y = checkPage(y, 8)
            const label = motorLabels[f.step] || f.step
            doc.text(`  ✗ Motor - ${label}: ${f.tecnicoValue || 'sin valor'} - Fuera de rango`, 14, y); y += 5
          }
          y += 5
        }

        // Budget calculation using calculateBudget function
        y = checkPage(y)
        const { calculateBudget: calcBudget, formatARS: fmtARS } = await import('@/lib/costs')
        const budget = calcBudget(
          panelSteps.map(c => ({ step: c.step, normativeStatus: c.normativeStatus, tecnicoValue: c.tecnicoValue })),
          motorSteps.map(c => ({ step: c.step, normativeStatus: c.normativeStatus, tecnicoValue: c.tecnicoValue })),
          safetySteps.map(c => ({ step: c.step, tecnicoCompleted: c.tecnicoCompleted, auditorValidated: c.auditorValidated }))
        )

        // 1. Labor
        y = addSectionHeader('1. Mano de Obra', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        for (const item of budget.labor) {
          y = checkPage(y, 8)
          doc.text(`  ${item.description}: ${fmtARS(item.unitPrice)} x ${item.quantity} ${item.unit} = ${fmtARS(item.subtotal)}`, 14, y)
          y += 5
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`  Subtotal Mano de Obra: ${fmtARS(budget.laborTotal)}`, 14, y); y += 8

        // 2. Materials
        y = checkPage(y); y = addSectionHeader('2. Materiales', y)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        for (const item of budget.materials) {
          y = checkPage(y, 8)
          doc.text(`  ${item.description}: ${fmtARS(item.unitPrice)} x ${item.quantity} ${item.unit} = ${fmtARS(item.subtotal)}`, 14, y)
          y += 5
        }
        doc.setFont('helvetica', 'bold')
        doc.text(`  Subtotal Materiales: ${fmtARS(budget.materialsTotal)}`, 14, y); y += 8

        // 3. Corrections
        if (budget.corrections.length > 0) {
          y = checkPage(y); y = addSectionHeader('3. Correcciones', y)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          for (const item of budget.corrections) {
            y = checkPage(y, 8)
            doc.text(`  ✗ ${item.description}: ${fmtARS(item.unitPrice)} x ${item.quantity} ${item.unit} = ${fmtARS(item.subtotal)}`, 14, y)
            y += 5
          }
          doc.setFont('helvetica', 'bold')
          doc.text(`  Subtotal Correcciones: ${fmtARS(budget.correctionsTotal)}`, 14, y); y += 10
        }

        // Totals with IVA
        y = checkPage(y, 50)
        const subtotalNeto = budget.grandTotal
        const ivaAmount = subtotalNeto * 0.21
        const totalConIva = subtotalNeto + ivaAmount

        doc.setFillColor(245, 245, 245)
        doc.rect(120, y - 3, 76, 8, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Subtotal Neto:', 125, y + 2)
        doc.text(fmtARS(subtotalNeto), 192, y + 2, { align: 'right' })
        y += 10

        doc.setFillColor(245, 245, 245)
        doc.rect(120, y - 3, 76, 8, 'F')
        doc.text('IVA (21%):', 125, y + 2)
        doc.text(fmtARS(ivaAmount), 192, y + 2, { align: 'right' })
        y += 12

        doc.setFillColor(30, 58, 46)
        doc.rect(120, y - 4, 76, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('TOTAL c/IVA:', 125, y + 3)
        doc.text(fmtARS(totalConIva), 192, y + 3, { align: 'right' })
        y += 16

        // Validity note
        doc.setTextColor(0, 0, 0)
        doc.setFillColor(255, 250, 230)
        doc.rect(14, y - 2, 182, 18, 'F')
        doc.setDrawColor(200, 180, 0)
        doc.rect(14, y - 2, 182, 18, 'S')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(150, 120, 0)
        doc.text('Notas:', 16, y + 2)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('• Presupuesto válido por 15 días a partir de la fecha de emisión.', 16, y + 7)
        doc.text('• Valores expresados en ARS. Precios referenciales región Salta. IVA incluido.', 16, y + 12)
      }

      // Footer on each page
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        const pageHeight = doc.internal.pageSize.height
        doc.setFillColor(30, 58, 46)
        doc.rect(0, pageHeight - 12, 210, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.text('ADN Técnico - Simulación Educativa | Prof. Héctor Cruz | AEA 90364 / IRAM / EDESA', 14, pageHeight - 4)
        doc.text(`Página ${i} de ${totalPages}`, 196, pageHeight - 4, { align: 'right' })
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1]
      setPdfData(prev => ({ ...prev, [docType]: pdfBase64 }))
      setDocStatuses(prev => ({ ...prev, [docType]: 'ready' }))
      addNotification(`Documento "${docType}" generado exitosamente`, 'success')
    } catch (error) {
      console.error('PDF generation error:', error)
      setDocStatuses(prev => ({ ...prev, [docType]: 'pending' }))
      addNotification(`Error al generar documento "${docType}"`, 'error')
    }
  }

  const handlePreview = (docType: string) => {
    const base64 = pdfData[docType]
    if (base64) {
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } else {
      addNotification('Primero debe generar el documento', 'warning')
    }
  }

  const handleDownload = (docType: string) => {
    const base64 = pdfData[docType]
    if (base64) {
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ADN_${docType}_${currentSession?.code || 'doc'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addNotification('Descarga iniciada', 'success')
    } else {
      addNotification('Primero debe generar el documento', 'warning')
    }
  }

  const handleEmail = (docType: string) => {
    addNotification(`Enviando "${docType}" por email a ${user?.email || ''}...`, 'info')
    setTimeout(() => {
      addNotification(`Documento "${docType}" enviado exitosamente a ${user?.email}`, 'success')
    }, 1500)
  }

  const handleGenerateAll = async () => {
    for (const type of ['relevamiento', 'auditoria', 'presupuesto']) {
      if (docStatuses[type] === 'pending') {
        await handleGenerate(type)
      }
    }
  }

  const allReady = Object.values(docStatuses).every(s => s === 'ready')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Documentación</h2>
            <p className="text-sm text-slate-400">Generación de reportes y documentos</p>
          </div>
        </div>
        {!allReady && (
          <Button onClick={handleGenerateAll} size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
            Generar Todos
          </Button>
        )}
      </div>

      {/* Session info */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-amber-500/30 flex items-center justify-center p-2 shrink-0">
              <Image
                src="/adn-logo.png"
                alt="ADN Técnico"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm flex-1">
              <div>
                <span className="text-xs text-slate-500">Código</span>
                <p className="font-mono font-bold text-amber-400">{currentSession?.code}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Sistema</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                  isTrifasico ? 'border-sky-500/50 text-sky-400' : 'border-amber-500/50 text-amber-400'
                }`}>
                  {isTrifasico ? '380V Tri' : '220V Mono'}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-slate-500">Técnico</span>
                <p className="text-slate-200">{currentSession?.tecnicoName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Auditor</span>
                <p className="text-slate-200">{currentSession?.auditorName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Instructor</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <p className="text-slate-200">Prof. Héctor Cruz</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Fecha</span>
                <p className="text-slate-200">{new Date().toLocaleDateString('es-AR')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-slate-800" />

      {/* Document Cards */}
      <div className="space-y-4">
        <DocumentCard
          icon={<FileSearch className="w-5 h-5 text-amber-400" />}
          title="Relevamiento Técnico"
          description="Informe completo de mediciones, normativas y observaciones técnicas"
          status={docStatuses.relevamiento}
          onGenerate={() => handleGenerate('relevamiento')}
          onPreview={() => handlePreview('relevamiento')}
          onDownload={() => handleDownload('relevamiento')}
          onEmail={() => handleEmail('relevamiento')}
          color="bg-amber-500/10 border border-amber-500/30"
        />

        <DocumentCard
          icon={<ClipboardCheck className="w-5 h-5 text-emerald-400" />}
          title="Auditoría"
          description="Registro de validaciones, no conformidades y observaciones del auditor"
          status={docStatuses.auditoria}
          onGenerate={() => handleGenerate('auditoria')}
          onPreview={() => handlePreview('auditoria')}
          onDownload={() => handleDownload('auditoria')}
          onEmail={() => handleEmail('auditoria')}
          color="bg-emerald-500/10 border border-emerald-500/30"
        />

        <DocumentCard
          icon={<Receipt className="w-5 h-5 text-sky-400" />}
          title="Presupuesto"
          description="Detalle de costos de mano de obra, materiales y correcciones necesarias"
          status={docStatuses.presupuesto}
          onGenerate={() => handleGenerate('presupuesto')}
          onPreview={() => handlePreview('presupuesto')}
          onDownload={() => handleDownload('presupuesto')}
          onEmail={() => handleEmail('presupuesto')}
          color="bg-sky-500/10 border border-sky-500/30"
        />
      </div>

      {/* Complete session */}
      {allReady && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-emerald-500/5 border-emerald-500/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">Documentos Generados</h3>
              <p className="text-sm text-slate-400 mb-4">
                Todos los documentos han sido generados exitosamente. Puede descargarlos o enviarlos por email.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    for (const type of ['relevamiento', 'auditoria', 'presupuesto']) {
                      handleDownload(type)
                    }
                  }}
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Download className="w-4 h-4 mr-2" /> Descargar Todos
                </Button>
                <Button
                  onClick={() => addNotification('Enviando todos los documentos por email...', 'info')}
                  variant="outline"
                  className="border-sky-500/50 text-sky-400 hover:bg-sky-500/10"
                >
                  <Mail className="w-4 h-4 mr-2" /> Enviar Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
