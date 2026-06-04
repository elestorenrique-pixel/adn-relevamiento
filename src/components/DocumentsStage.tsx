'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Mail, Eye, Check, Printer,
  ClipboardCheck, Receipt, FileSearch, Loader2
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
  const { user, addNotification, currentSession, analysisData, safetySteps, panelSteps, motorSteps } = useStore()

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

    // Client-side fallback - generate a simple PDF
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Header
      doc.setFillColor(30, 58, 46)
      doc.rect(0, 0, 210, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('ADL Tecnico', 14, 15)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Simulacion de Relevamiento Electrico Industrial', 14, 22)

      const titles: Record<string, string> = {
        relevamiento: 'Informe de Relevamiento Electrico',
        auditoria: 'Informe de Auditoria Electrica',
        presupuesto: 'Presupuesto - Correcciones y Materiales',
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(titles[docType] || 'Documento', 14, 31)

      // Session info
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      let y = 45

      doc.text(`Codigo: ${currentSession?.code || 'N/A'}`, 14, y); y += 6
      doc.text(`Tecnico: ${currentSession?.tecnicoName || user?.name || 'N/A'}`, 14, y); y += 6
      doc.text(`Auditor: ${currentSession?.auditorName || 'N/A'}`, 14, y); y += 6
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, y); y += 10

      if (docType === 'relevamiento') {
        // Safety
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 46)
        doc.text('1. Verificaciones de Seguridad - 5 Reglas de Oro', 14, y); y += 7
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const stepLabels: Record<string, string> = {
          identify: 'Identificar',
          verify_zero: 'Verificar Ausencia de Tension',
          grounding: 'Puesta a Tierra',
          block: 'Bloqueo / Senalizacion',
          signal: 'Delimitar Zona de Trabajo',
        }

        for (const step of safetySteps) {
          const label = stepLabels[step.step] || step.step
          const status = step.tecnicoCompleted && step.auditorValidated ? '✓' : '✗'
          doc.text(`  ${status} ${label}${step.tecnicoNotes ? ` - ${step.tecnicoNotes}` : ''}`, 14, y)
          y += 5
          if (y > 270) { doc.addPage(); y = 20 }
        }

        // Panel
        y += 5
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 46)
        doc.text('2. Chequeo de Tablero', 14, y); y += 7
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const panelLabels: Record<string, string> = {
          voltage: 'Medir Tension',
          current: 'Medir Corriente',
          conductors: 'Identificar Conductores',
          distribution: 'Verificar Distribucion',
          grounding: 'Control Puesta a Tierra',
          terminals: 'Verificar Terminales',
          torque: 'Ajustar Torque',
        }

        for (const step of panelSteps) {
          const label = panelLabels[step.step] || step.step
          const value = step.tecnicoValue ? ` = ${step.tecnicoValue}` : ''
          const status = step.normativeStatus === 'passed' ? '✓' : step.normativeStatus === 'failed' ? '✗' : '○'
          doc.text(`  ${status} ${label}${value}`, 14, y)
          y += 5
          if (y > 270) { doc.addPage(); y = 20 }
        }

        // Motor
        y += 5
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 46)
        doc.text('3. Chequeo de Motor', 14, y); y += 7
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const motorLabels: Record<string, string> = {
          voltage: 'Medir Tension',
          current: 'Medir Corriente',
          coil_resistance: 'Resistencia de Bobinas',
          insulation: 'Aislamiento (Bobina-Carcasa)',
          nameplate: 'Lectura de Placa',
          power_cosfi: 'Potencia y Coseno fi',
        }

        for (const step of motorSteps) {
          const label = motorLabels[step.step] || step.step
          const value = step.tecnicoValue ? ` = ${step.tecnicoValue}` : ''
          const status = step.normativeStatus === 'passed' ? '✓' : step.normativeStatus === 'failed' ? '✗' : '○'
          doc.text(`  ${status} ${label}${value}`, 14, y)
          y += 5
          if (y > 270) { doc.addPage(); y = 20 }
        }

        // Analysis
        if (analysisData.length > 0) {
          y += 5
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 58, 46)
          doc.text('4. Analisis de Potencia', 14, y); y += 7
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')

          for (const item of analysisData) {
            const status = item.status === 'passed' ? '✓' : '✗'
            doc.text(`  ${status} ${item.parameter}: Medido=${item.measuredValue}, Placa=${item.plateValue}, Desv=${item.deviation}%`, 14, y)
            y += 5
            if (y > 270) { doc.addPage(); y = 20 }
          }
        }
      } else if (docType === 'auditoria') {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 46)
        doc.text('Registro de Auditoria', 14, y); y += 7
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        // Check safety
        const safetyIssues = safetySteps.filter(s => !s.tecnicoCompleted || !s.auditorValidated)
        if (safetyIssues.length > 0) {
          doc.text('Seguridad - Observaciones:', 14, y); y += 5
          for (const step of safetyIssues) {
            if (!step.tecnicoCompleted) {
              doc.text(`  ✗ Paso "${step.step}" no completado por tecnico`, 14, y); y += 5
            }
            if (!step.auditorValidated) {
              doc.text(`  ✗ Paso "${step.step}" no validado por auditor`, 14, y); y += 5
            }
          }
        }

        // Check normative issues
        const panelFailures = panelSteps.filter(s => s.normativeStatus === 'failed')
        const motorFailures = motorSteps.filter(s => s.normativeStatus === 'failed')

        if (panelFailures.length > 0) {
          y += 3
          doc.text('Tablero - No conformidades:', 14, y); y += 5
          for (const step of panelFailures) {
            doc.text(`  ✗ ${step.step}: ${step.tecnicoValue || 'sin valor'} - Fuera de rango normativo`, 14, y); y += 5
          }
        }

        if (motorFailures.length > 0) {
          y += 3
          doc.text('Motor - No conformidades:', 14, y); y += 5
          for (const step of motorFailures) {
            doc.text(`  ✗ ${step.step}: ${step.tecnicoValue || 'sin valor'} - Fuera de rango normativo`, 14, y); y += 5
          }
        }

        if (safetyIssues.length === 0 && panelFailures.length === 0 && motorFailures.length === 0) {
          doc.text('✓ Todas las verificaciones conformes con la normativa vigente.', 14, y); y += 5
        }

        y += 5
        doc.text('Normativa aplicada: AEA 90364, IRAM 2071, IRAM 2281-3, IRAM 2413, IRAM 62271, EDESA NT', 14, y)
      } else if (docType === 'presupuesto') {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 46)
        doc.text('Presupuesto Estimado', 14, y); y += 7
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        // Calculate basic budget
        const laborBase = 95000
        const materialsBase = 18000
        const corrections = panelSteps.filter(s => s.normativeStatus === 'failed').length * 25000 +
                           motorSteps.filter(s => s.normativeStatus === 'failed').length * 35000

        doc.text('1. Mano de Obra', 14, y); y += 5
        doc.text('  Relevamiento de tablero: $15,000 x 2hs', 14, y); y += 5
        doc.text('  Relevamiento de motor: $15,000 x 1.5hs', 14, y); y += 5
        doc.text('  Auditoria electrica: $18,000 x 2hs', 14, y); y += 5
        doc.text(`  Subtotal: $${laborBase.toLocaleString('es-AR')}`, 14, y); y += 8

        doc.text('2. Materiales', 14, y); y += 5
        doc.text('  Cinta aisladora: $2,500 x 2', 14, y); y += 5
        doc.text('  Funda termocontraible: $1,800 x 2m', 14, y); y += 5
        doc.text('  Terminal de presion: $1,500 x 3', 14, y); y += 5
        doc.text(`  Subtotal: $${materialsBase.toLocaleString('es-AR')}`, 14, y); y += 8

        if (corrections > 0) {
          doc.text('3. Correcciones Necesarias', 14, y); y += 5
          const panelFails = panelSteps.filter(s => s.normativeStatus === 'failed')
          const motorFails = motorSteps.filter(s => s.normativeStatus === 'failed')
          for (const f of panelFails) {
            doc.text(`  ✗ Correccion ${f.step}: $25,000`, 14, y); y += 5
          }
          for (const f of motorFails) {
            doc.text(`  ✗ Correccion ${f.step}: $35,000`, 14, y); y += 5
          }
          doc.text(`  Subtotal correcciones: $${corrections.toLocaleString('es-AR')}`, 14, y); y += 8
        }

        const total = laborBase + materialsBase + corrections
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`TOTAL: $${total.toLocaleString('es-AR')}`, 14, y); y += 8
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('* Valores estimados basados en costos de la region (Salta). Precios en ARS.', 14, y)
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
        doc.text('ADL Tecnico - Simulacion Educativa | Prof. Hector Cruz | AEA 90364 / IRAM / EDESA', 14, pageHeight - 4)
        doc.text(`Pagina ${i} de ${totalPages}`, 196, pageHeight - 4, { align: 'right' })
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
      a.download = `ADL_${docType}_${currentSession?.code || 'doc'}.pdf`
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-500">Código</span>
              <p className="font-mono font-bold text-amber-400">{currentSession?.code}</p>
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
              <span className="text-xs text-slate-500">Fecha</span>
              <p className="text-slate-200">{new Date().toLocaleDateString('es-AR')}</p>
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
