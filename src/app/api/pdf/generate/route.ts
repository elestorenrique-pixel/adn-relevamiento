import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBudget, formatARS } from '@/lib/costs'
import { getNormativeReferences } from '@/lib/normative'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

// Constants for instructor/course info
const INSTRUCTOR = 'Prof. Héctor Cruz'
const COURSE_INFO = 'Taller y Laboratorio de 3° año - Instalaciones Eléctricas'

// Helper to add ADL Técnico header to PDF (with logo)
function addHeader(doc: jsPDF, title: string, session: { code: string; tecnico: { name: string } | null; auditor: { name: string } | null; createdAt: Date }) {
  // Header background
  doc.setFillColor(30, 58, 46) // Dark green
  doc.rect(0, 0, 210, 40, 'F')

  // Try to add logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'adl-logo.png')
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath)
      doc.addImage(logoData, 'PNG', 14, 3, 22, 22)
    }
  } catch {
    // Logo not available, skip
  }

  // Company name (shifted right to account for logo)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ADL Técnico', 40, 12)

  // Course info
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(COURSE_INFO, 40, 18)

  // Instructor
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Instructor: ${INSTRUCTOR}`, 40, 23)

  // Document title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 40, 32)

  // Session info on right
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código: ${session.code}`, 196, 12, { align: 'right' })
  doc.text(`Técnico: ${session.tecnico?.name ?? 'N/A'}`, 196, 18, { align: 'right' })
  doc.text(`Auditor: ${session.auditor?.name ?? 'N/A'}`, 196, 24, { align: 'right' })
  doc.text(`Fecha: ${new Date(session.createdAt).toLocaleDateString('es-AR')}`, 196, 30, { align: 'right' })

  // Reset text color
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
}

// Helper to add a colored section header
function addSectionHeader(doc: jsPDF, text: string, y: number): number {
  // Colored bar behind the section title
  doc.setFillColor(30, 58, 46)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(text, 16, y + 1)
  doc.setTextColor(0, 0, 0)
  return y + 8
}

// Helper to add footer
function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(30, 58, 46)
  doc.rect(0, pageHeight - 15, 210, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.text(`ADL Técnico - Simulación Educativa | ${INSTRUCTOR} | AEA 90364 / IRAM / EDESA`, 14, pageHeight - 6)
  doc.text(`Página ${pageNum} de ${totalPages}`, 196, pageHeight - 6, { align: 'right' })
  doc.setTextColor(0, 0, 0)
}

// Helper to check page overflow and add new page if needed
function checkPage(doc: jsPDF, y: number, needed: number = 30): number {
  if (y + needed > 270) {
    doc.addPage()
    return 20
  }
  return y
}

// Generate Relevamiento PDF
function generateRelevamiento(
  session: any,
  safetyChecks: any[],
  panelChecks: any[],
  motorChecks: any[],
  analysisData: any[]
): jsPDF {
  const doc = new jsPDF()

  addHeader(doc, 'Informe de Relevamiento Eléctrico', session)

  // Instructor/Course info box
  let y = 46
  doc.setFillColor(240, 245, 240)
  doc.rect(14, y - 3, 182, 14, 'F')
  doc.setDrawColor(30, 58, 46)
  doc.rect(14, y - 3, 182, 14, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text(`${COURSE_INFO}`, 16, y + 2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Instructor: ${INSTRUCTOR} | Normativas: AEA 90364 / IRAM 2071 / IRAM 2281 / IRAM 2413 / EDESA NT`, 16, y + 7)
  y += 18

  // 1. Safety section
  y = addSectionHeader(doc, '1. Verificaciones de Seguridad - 5 Reglas de Oro', y)

  const stepLabels: Record<string, string> = {
    identify: 'Identificar',
    verify_zero: 'Verificar Ausencia de Tensión',
    grounding: 'Puesta a Tierra',
    block: 'Bloqueo / Señalización',
    signal: 'Delimitar Zona de Trabajo',
  }

  const safetyData = safetyChecks.map((c, i) => [
    `${i + 1}`,
    stepLabels[c.step] || c.step,
    c.tecnicoCompleted ? '✓ Completado' : '✗ Pendiente',
    c.auditorValidated ? '✓ Validado' : '✗ Pendiente',
    c.tecnicoNotes || c.auditorNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Técnico', 'Auditor', 'Notas']],
    body: safetyData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 4: { cellWidth: 60 } },
  })

  // 2. Panel section
  y = (doc as any).lastAutoTable.finalY + 10
  y = checkPage(doc, y)

  y = addSectionHeader(doc, '2. Verificaciones de Tablero', y)

  const panelLabels: Record<string, string> = {
    voltage: 'Medir Tensión',
    current: 'Medir Corriente',
    conductors: 'Identificar Conductores',
    distribution: 'Verificar Distribución',
    grounding: 'Control Puesta a Tierra',
    terminals: 'Verificar Terminales',
    torque: 'Ajustar Torque',
  }

  const panelData = panelChecks.map((c, i) => [
    `${i + 1}`,
    panelLabels[c.step] || c.step,
    c.tecnicoValue || '-',
    c.normativeStatus === 'passed' ? '✓ Aprobado' : c.normativeStatus === 'failed' ? '✗ Rechazado' : '○ Pendiente',
    c.tecnicoNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Valor Medido', 'Normativa', 'Notas']],
    body: panelData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 8 },
  })

  // 3. Motor section
  y = (doc as any).lastAutoTable.finalY + 10
  y = checkPage(doc, y)

  y = addSectionHeader(doc, '3. Verificaciones de Motor', y)

  const motorLabels: Record<string, string> = {
    voltage: 'Medir Tensión',
    current: 'Medir Corriente',
    coil_resistance: 'Resistencia de Bobinas',
    insulation: 'Aislamiento (Bobina-Carcasa)',
    nameplate: 'Lectura de Placa',
    power_cosfi: 'Potencia y Coseno φ',
  }

  const motorData = motorChecks.map((c, i) => [
    `${i + 1}`,
    motorLabels[c.step] || c.step,
    c.tecnicoValue || '-',
    c.normativeStatus === 'passed' ? '✓ Aprobado' : c.normativeStatus === 'failed' ? '✗ Rechazado' : '○ Pendiente',
    c.tecnicoNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Valor Medido', 'Normativa', 'Notas']],
    body: motorData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 8 },
  })

  // 4. Datos del Motor (Motor Nameplate Data)
  y = (doc as any).lastAutoTable.finalY + 10
  y = checkPage(doc, y)

  const nameplateCheck = motorChecks.find((c: any) => c.step === 'nameplate')
  if (nameplateCheck && nameplateCheck.tecnicoValue) {
    y = addSectionHeader(doc, '4. Datos de Placa del Motor', y)

    try {
      const nameplateData = JSON.parse(nameplateCheck.tecnicoValue)
      const nameplateRows = [
        ['Marca', nameplateData.brand || '-'],
        ['Modelo', nameplateData.model || '-'],
        ['Potencia (HP)', nameplateData.powerHp || '-'],
        ['Potencia (kW)', nameplateData.powerKw || '-'],
        ['Tensión (V)', nameplateData.voltage || '-'],
        ['Corriente (A)', nameplateData.current || '-'],
        ['Frecuencia (Hz)', nameplateData.frequency || '-'],
        ['RPM', nameplateData.rpm || '-'],
        ['Factor de Potencia (cos φ)', nameplateData.cosFi || '-'],
        ['Factor de Servicio', nameplateData.serviceFactor || '-'],
        ['Aislamiento', nameplateData.insulation || '-'],
        ['Conexión', nameplateData.connection || '-'],
      ]

      autoTable(doc, {
        startY: y,
        head: [['Parámetro', 'Valor de Placa']],
        body: nameplateRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 80 } },
      })

      y = (doc as any).lastAutoTable.finalY + 10
    } catch {
      // Nameplate data is not JSON, just show as text
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Datos de placa: ${nameplateCheck.tecnicoValue}`, 16, y + 4)
      y += 12
    }
  }

  // 5. Analysis section
  const analysisSectionNum = nameplateCheck && nameplateCheck.tecnicoValue ? '5' : '4'
  if (analysisData.length > 0) {
    y = checkPage(doc, y)

    const paramLabels: Record<string, string> = {
      active_power: 'Potencia Activa (P)',
      reactive_power: 'Potencia Reactiva (Q)',
      apparent_power: 'Potencia Aparente (S)',
      comparison: 'Comparación Medido vs Placa',
    }

    y = addSectionHeader(doc, `${analysisSectionNum}. Análisis de Potencia`, y)

    const analysisTableData = analysisData.map((a) => [
      paramLabels[a.parameter] || a.parameter,
      a.measuredValue || '-',
      a.plateValue || '-',
      a.deviation || '-',
      a.status === 'passed' ? '✓ Aprobado' : '✗ Rechazado',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Parámetro', 'Medido', 'Placa', 'Desviación', 'Estado']],
      body: analysisTableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
      styles: { fontSize: 8 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // 6. Normative References section
  y = checkPage(doc, y)
  y = addSectionHeader(doc, 'Referencias Normativas', y)

  const allCategories = ['safety', 'panel', 'motor']
  const categoryLabels: Record<string, string> = {
    safety: 'Seguridad',
    panel: 'Tablero',
    motor: 'Motor',
  }

  for (const cat of allCategories) {
    const refs = getNormativeReferences(cat)
    if (refs.length === 0) continue

    y = checkPage(doc, y, 20)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 46)
    doc.text(`${categoryLabels[cat]}:`, 16, y)
    doc.setTextColor(0, 0, 0)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    for (const ref of refs) {
      y = checkPage(doc, y, 8)
      doc.text(`  • ${ref.code} (${ref.source}): ${ref.description}`, 16, y)
      y += 4
    }
    y += 4
  }

  // Add footers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc
}

// Generate Auditoría PDF
function generateAuditoria(
  session: any,
  auditRecords: any[],
  safetyChecks: any[],
  panelChecks: any[],
  motorChecks: any[],
  chatMessages: any[]
): jsPDF {
  const doc = new jsPDF()

  addHeader(doc, 'Informe de Auditoría Eléctrica', session)

  // Instructor/Course info box
  let y = 46
  doc.setFillColor(240, 245, 240)
  doc.rect(14, y - 3, 182, 14, 'F')
  doc.setDrawColor(30, 58, 46)
  doc.rect(14, y - 3, 182, 14, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text(`${COURSE_INFO}`, 16, y + 2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Instructor: ${INSTRUCTOR} | Normativas: AEA 90364 / IRAM / EDESA`, 16, y + 7)
  y += 18

  // 1. Auto-generated audit findings based on normativeStatus
  y = addSectionHeader(doc, '1. Hallazgos de Auditoría (Evaluación Normativa)', y)

  const stepLabels: Record<string, string> = {
    identify: 'Identificar',
    verify_zero: 'Verificar Ausencia de Tensión',
    grounding: 'Puesta a Tierra',
    block: 'Bloqueo / Señalización',
    signal: 'Delimitar Zona de Trabajo',
    voltage: 'Medir Tensión',
    current: 'Medir Corriente',
    conductors: 'Identificar Conductores',
    distribution: 'Verificar Distribución',
    terminals: 'Verificar Terminales',
    torque: 'Ajustar Torque',
    coil_resistance: 'Resistencia de Bobinas',
    insulation: 'Aislamiento',
    nameplate: 'Lectura de Placa',
    power_cosfi: 'Potencia y Coseno φ',
  }

  const findings: Array<{ category: string; step: string; status: string; value: string; finding: string }> = []

  // Check safety
  for (const c of safetyChecks) {
    if (!c.tecnicoCompleted) {
      findings.push({
        category: 'Seguridad',
        step: stepLabels[c.step] || c.step,
        status: 'No completado',
        value: '-',
        finding: `Paso no completado por el técnico`,
      })
    }
    if (!c.auditorValidated && c.tecnicoCompleted) {
      findings.push({
        category: 'Seguridad',
        step: stepLabels[c.step] || c.step,
        status: 'Pendiente validación',
        value: '-',
        finding: `Completado por técnico, pendiente de validación del auditor`,
      })
    }
  }

  // Check panel normative status
  for (const c of panelChecks) {
    if (c.normativeStatus === 'failed') {
      findings.push({
        category: 'Tablero',
        step: stepLabels[c.step] || c.step,
        status: '✗ Rechazado',
        value: c.tecnicoValue || '-',
        finding: `Fuera de rango normativo`,
      })
    } else if (c.normativeStatus === 'pending' && !c.tecnicoCompleted) {
      findings.push({
        category: 'Tablero',
        step: stepLabels[c.step] || c.step,
        status: '○ Pendiente',
        value: c.tecnicoValue || '-',
        finding: `Verificación no completada`,
      })
    }
  }

  // Check motor normative status
  for (const c of motorChecks) {
    if (c.normativeStatus === 'failed') {
      findings.push({
        category: 'Motor',
        step: stepLabels[c.step] || c.step,
        status: '✗ Rechazado',
        value: c.tecnicoValue || '-',
        finding: `Fuera de rango normativo`,
      })
    } else if (c.normativeStatus === 'pending' && !c.tecnicoCompleted) {
      findings.push({
        category: 'Motor',
        step: stepLabels[c.step] || c.step,
        status: '○ Pendiente',
        value: c.tecnicoValue || '-',
        finding: `Verificación no completada`,
      })
    }
  }

  if (findings.length > 0) {
    const findingsData = findings.map((f) => [
      f.category,
      f.step,
      f.value,
      f.status,
      f.finding,
    ])

    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Paso', 'Valor', 'Estado', 'Hallazgo']],
      body: findingsData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 35 }, 4: { cellWidth: 55 } },
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(34, 139, 34)
    doc.text('✓ Todas las verificaciones conformes con la normativa vigente.', 16, y + 4)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // 2. Manual audit records
  y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10
  y = checkPage(doc, y)

  y = addSectionHeader(doc, '2. Registros de Auditoría Manual', y)

  if (auditRecords.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text('No se registraron acciones manuales de auditoría.', 16, y + 4)
    doc.setTextColor(0, 0, 0)
    y += 12
  } else {
    // Group by category
    const categories = ['safety', 'panel', 'motor', 'analysis']
    const categoryLabels2: Record<string, string> = {
      safety: 'Seguridad',
      panel: 'Tablero',
      motor: 'Motor',
      analysis: 'Análisis',
    }

    for (const cat of categories) {
      const records = auditRecords.filter((r: any) => r.category === cat)
      if (records.length === 0) continue

      y = checkPage(doc, y)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 46)
      doc.text(`${categoryLabels2[cat] || cat}`, 16, y)
      y += 3

      const tableData = records.map((r: any) => [
        r.action,
        r.correct ? '✓ Correcto' : '✗ Incorrecto',
        r.errors ? (() => { try { return JSON.parse(r.errors).join(', ') } catch { return r.errors } })() : '-',
        r.omissions ? (() => { try { return JSON.parse(r.omissions).join(', ') } catch { return r.omissions } })() : '-',
        r.autoDetected ? 'Auto' : 'Manual',
      ])

      autoTable(doc, {
        startY: y,
        head: [['Acción', 'Resultado', 'Errores', 'Omisiónes', 'Tipo']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
        styles: { fontSize: 8 },
      })

      y = (doc as any).lastAutoTable.finalY + 8
    }
  }

  // 3. Summary section with pass/fail counts per category
  y = checkPage(doc, y)
  y = addSectionHeader(doc, '3. Resumen de Auditoría', y)

  const summaryData = []

  // Safety summary
  const safetyCompleted = safetyChecks.filter((c: any) => c.tecnicoCompleted).length
  const safetyValidated = safetyChecks.filter((c: any) => c.auditorValidated).length
  const safetyTotal = safetyChecks.length
  summaryData.push([
    'Seguridad',
    `${safetyCompleted}/${safetyTotal}`,
    `${safetyValidated}/${safetyTotal}`,
    safetyCompleted === safetyTotal && safetyValidated === safetyTotal ? '✓ Conforme' : '✗ No conforme',
  ])

  // Panel summary
  const panelPassed = panelChecks.filter((c: any) => c.normativeStatus === 'passed').length
  const panelFailed = panelChecks.filter((c: any) => c.normativeStatus === 'failed').length
  const panelPending = panelChecks.filter((c: any) => c.normativeStatus === 'pending').length
  const panelTotal = panelChecks.length
  summaryData.push([
    'Tablero',
    `${panelPassed}/${panelTotal}`,
    `${panelFailed} rechazados, ${panelPending} pendientes`,
    panelFailed === 0 && panelPending === 0 ? '✓ Conforme' : '✗ No conforme',
  ])

  // Motor summary
  const motorPassed = motorChecks.filter((c: any) => c.normativeStatus === 'passed').length
  const motorFailed = motorChecks.filter((c: any) => c.normativeStatus === 'failed').length
  const motorPending = motorChecks.filter((c: any) => c.normativeStatus === 'pending').length
  const motorTotal = motorChecks.length
  summaryData.push([
    'Motor',
    `${motorPassed}/${motorTotal}`,
    `${motorFailed} rechazados, ${motorPending} pendientes`,
    motorFailed === 0 && motorPending === 0 ? '✓ Conforme' : '✗ No conforme',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Categoría', 'Aprobados', 'Detalle', 'Estado']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 } },
  })

  // Overall totals
  y = (doc as any).lastAutoTable.finalY + 6
  const totalRecords = auditRecords.length
  const correctCount = auditRecords.filter((r: any) => r.correct).length
  const autoDetectedCount = auditRecords.filter((r: any) => r.autoDetected).length

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de registros manuales: ${totalRecords}`, 16, y); y += 5
  doc.text(`Correctos: ${correctCount}`, 16, y); y += 5
  doc.text(`Con observaciones: ${totalRecords - correctCount}`, 16, y); y += 5
  doc.text(`Auto-detectados: ${autoDetectedCount}`, 16, y); y += 10

  // 4. Chat messages section (if available)
  if (chatMessages && chatMessages.length > 0) {
    y = checkPage(doc, y)
    y = addSectionHeader(doc, '4. Registro de Comunicaciones', y)

    const chatData = chatMessages.slice(0, 50).map((m: any) => [
      m.user?.name || m.userName || 'Sistema',
      m.role === 'system' ? 'Sistema' : m.role === 'tecnico' ? 'Técnico' : 'Auditor',
      new Date(m.timestamp).toLocaleString('es-AR'),
      (m.content || '').substring(0, 80),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Usuario', 'Rol', 'Hora', 'Mensaje']],
      body: chatData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 46], fontSize: 7 },
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 20 }, 2: { cellWidth: 35 }, 3: { cellWidth: 85 } },
    })
  }

  // 5. Normative references
  y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10
  y = checkPage(doc, y)
  y = addSectionHeader(doc, 'Referencias Normativas', y)

  const normativeRefs = [
    { code: 'AEA 90364', desc: 'Asociación Electrotécnica Argentina - Instalaciones eléctricas en inmuebles' },
    { code: 'IRAM 2071', desc: 'Tensiones nominales de redes de distribución' },
    { code: 'IRAM 2281-3', desc: 'Protección contra descargas eléctricas - Puesta a tierra' },
    { code: 'IRAM 2413', desc: 'Ensayos de aislamiento eléctrico' },
    { code: 'IRAM 62271', desc: 'Equipos de maniobra y protección' },
    { code: 'EDESA NT', desc: 'Normas Técnicas de la distribuidora EDESA Salta' },
  ]

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  for (const ref of normativeRefs) {
    y = checkPage(doc, y, 8)
    doc.setFont('helvetica', 'bold')
    doc.text(`  ${ref.code}:`, 16, y)
    doc.setFont('helvetica', 'normal')
    doc.text(ref.desc, 60, y)
    y += 5
  }

  // Add footers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc
}

// Generate Presupuesto PDF
function generatePresupuesto(
  session: any,
  budget: any,
  panelChecks: any[],
  motorChecks: any[]
): jsPDF {
  const doc = new jsPDF()

  addHeader(doc, 'Presupuesto - Correcciones y Materiales', session)

  // Instructor/Course info box
  let y = 46
  doc.setFillColor(240, 245, 240)
  doc.rect(14, y - 3, 182, 14, 'F')
  doc.setDrawColor(30, 58, 46)
  doc.rect(14, y - 3, 182, 14, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text(`${COURSE_INFO}`, 16, y + 2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Instructor: ${INSTRUCTOR} | Validez: 15 días | Precios en ARS (región Salta)`, 16, y + 7)
  y += 18

  // Correcciones Detectadas section
  const failedPanel = panelChecks.filter((c: any) => c.normativeStatus === 'failed')
  const failedMotor = motorChecks.filter((c: any) => c.normativeStatus === 'failed')

  if (failedPanel.length > 0 || failedMotor.length > 0) {
    y = addSectionHeader(doc, 'Correcciones Detectadas', y)

    const stepLabels: Record<string, string> = {
      voltage: 'Medir Tensión',
      current: 'Medir Corriente',
      conductors: 'Identificar Conductores',
      distribution: 'Verificar Distribución',
      grounding: 'Control Puesta a Tierra',
      terminals: 'Verificar Terminales',
      torque: 'Ajustar Torque',
      coil_resistance: 'Resistencia de Bobinas',
      insulation: 'Aislamiento',
      nameplate: 'Lectura de Placa',
      power_cosfi: 'Potencia y Coseno φ',
    }

    const correctionsDetected: string[][] = []

    for (const c of failedPanel) {
      correctionsDetected.push([
        'Tablero',
        stepLabels[c.step] || c.step,
        c.tecnicoValue || '-',
        'Fuera de rango normativo',
      ])
    }
    for (const c of failedMotor) {
      correctionsDetected.push([
        'Motor',
        stepLabels[c.step] || c.step,
        c.tecnicoValue || '-',
        'Fuera de rango normativo',
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Verificación', 'Valor Medido', 'Observación']],
      body: correctionsDetected,
      theme: 'grid',
      headStyles: { fillColor: [180, 50, 50], fontSize: 8 },
      styles: { fontSize: 8 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
    y = checkPage(doc, y)
  }

  // 1. Labor section
  y = addSectionHeader(doc, '1. Mano de Obra', y)

  const laborData = budget.labor.map((item: any) => [
    item.description,
    item.quantity.toString(),
    item.unit,
    formatARS(item.unitPrice),
    formatARS(item.subtotal),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']],
    body: laborData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  })

  // Subtotal labor
  y = (doc as any).lastAutoTable.finalY + 3
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Subtotal Mano de Obra: ${formatARS(budget.laborTotal)}`, 196, y, { align: 'right' })

  // 2. Materials section
  y += 10
  y = checkPage(doc, y)

  y = addSectionHeader(doc, '2. Materiales', y)

  const materialsData = budget.materials.map((item: any) => [
    item.description,
    item.quantity.toString(),
    item.unit,
    formatARS(item.unitPrice),
    formatARS(item.subtotal),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']],
    body: materialsData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  })

  y = (doc as any).lastAutoTable.finalY + 3
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Subtotal Materiales: ${formatARS(budget.materialsTotal)}`, 196, y, { align: 'right' })

  // 3. Corrections section
  if (budget.corrections.length > 0) {
    y += 10
    y = checkPage(doc, y)

    y = addSectionHeader(doc, '3. Correcciones', y)

    const correctionsData = budget.corrections.map((item: any) => [
      item.description,
      item.quantity.toString(),
      item.unit,
      formatARS(item.unitPrice),
      formatARS(item.subtotal),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']],
      body: correctionsData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 46], fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
    })

    y = (doc as any).lastAutoTable.finalY + 3
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Subtotal Correcciones: ${formatARS(budget.correctionsTotal)}`, 196, y, { align: 'right' })
  }

  // Subtotals and IVA calculation
  y += 15
  y = checkPage(doc, y, 60)

  const subtotalNeto = budget.grandTotal
  const ivaRate = 0.21
  const ivaAmount = subtotalNeto * ivaRate
  const totalConIva = subtotalNeto + ivaAmount

  // Subtotal neto
  doc.setFillColor(245, 245, 245)
  doc.rect(120, y - 5, 76, 10, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Subtotal Neto:', 125, y + 2)
  doc.text(formatARS(subtotalNeto), 192, y + 2, { align: 'right' })

  // IVA
  y += 12
  doc.setFillColor(245, 245, 245)
  doc.rect(120, y - 5, 76, 10, 'F')
  doc.setFontSize(10)
  doc.text('IVA (21%):', 125, y + 2)
  doc.text(formatARS(ivaAmount), 192, y + 2, { align: 'right' })

  // Grand total with IVA
  y += 15
  doc.setFillColor(30, 58, 46)
  doc.rect(120, y - 5, 76, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL c/IVA:', 125, y + 4)
  doc.text(formatARS(totalConIva), 192, y + 4, { align: 'right' })

  // Validity note
  y += 20
  y = checkPage(doc, y, 30)
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(255, 250, 230)
  doc.rect(14, y - 3, 182, 22, 'F')
  doc.setDrawColor(200, 180, 0)
  doc.rect(14, y - 3, 182, 22, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(150, 120, 0)
  doc.text('Notas:', 16, y + 2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('• Presupuesto válido por 15 días a partir de la fecha de emisión.', 16, y + 8)
  doc.text('• Valores expresados en Pesos Argentinos (ARS). Precios referenciales región Salta.', 16, y + 13)
  doc.text('• IVA incluido según normativa AFIP vigente.', 16, y + 18)

  // Signature area
  y += 30
  y = checkPage(doc, y, 40)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Tecnico signature
  doc.text('_________________________', 30, y)
  doc.text('Firma del Técnico', 35, y + 5)
  doc.text(session.tecnico?.name ?? '', 35, y + 10)

  // Auditor signature
  doc.text('_________________________', 120, y)
  doc.text('Firma del Auditor', 125, y + 5)
  doc.text(session.auditor?.name ?? '', 125, y + 10)

  // Add footers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc
}

// POST /api/pdf/generate - Generate PDF documents for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, documentType } = body

    if (!sessionId || !documentType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: sessionId, documentType' },
        { status: 400 }
      )
    }

    const validTypes = ['relevamiento', 'auditoria', 'presupuesto', 'all']
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: `Tipo de documento inválido. Debe ser: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        tecnico: { select: { name: true, email: true } },
        auditor: { select: { name: true, email: true } },
        safetyChecks: { orderBy: { order: 'asc' } },
        panelChecks: { orderBy: { order: 'asc' } },
        motorChecks: { orderBy: { order: 'asc' } },
        analysisData: true,
        auditRecords: { orderBy: { createdAt: 'desc' } },
        chatMessages: { orderBy: { timestamp: 'asc' }, include: { user: { select: { name: true } } } },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const generatedDocuments: Array<{ type: string; filename: string; pdfBase64: string }> = []
    const typesToGenerate = documentType === 'all'
      ? ['relevamiento', 'auditoria', 'presupuesto']
      : [documentType]

    for (const type of typesToGenerate) {
      let doc: jsPDF

      switch (type) {
        case 'relevamiento':
          doc = generateRelevamiento(session, session.safetyChecks, session.panelChecks, session.motorChecks, session.analysisData)
          break
        case 'auditoria':
          doc = generateAuditoria(session, session.auditRecords, session.safetyChecks, session.panelChecks, session.motorChecks, session.chatMessages)
          break
        case 'presupuesto': {
          const budget = calculateBudget(
            session.panelChecks.map(c => ({
              step: c.step,
              normativeStatus: c.normativeStatus,
              tecnicoValue: c.tecnicoValue,
            })),
            session.motorChecks.map(c => ({
              step: c.step,
              normativeStatus: c.normativeStatus,
              tecnicoValue: c.tecnicoValue,
            })),
            session.safetyChecks.map(c => ({
              step: c.step,
              tecnicoCompleted: c.tecnicoCompleted,
              auditorValidated: c.auditorValidated,
            }))
          )
          doc = generatePresupuesto(session, budget, session.panelChecks, session.motorChecks)
          break
        }
        default:
          continue
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1]
      const filename = `ADL_${type}_${session.code}.pdf`

      // Save document record in database
      await db.generatedDocument.create({
        data: {
          sessionId,
          type,
          filePath: filename,
          content: JSON.stringify({
            generatedAt: new Date().toISOString(),
            sessionCode: session.code,
            tecnicoName: session.tecnico?.name,
            auditorName: session.auditor?.name,
            instructor: INSTRUCTOR,
            course: COURSE_INFO,
          }),
        },
      })

      generatedDocuments.push({ type, filename, pdfBase64 })
    }

    return NextResponse.json({
      message: `${generatedDocuments.length} documento(s) generado(s) exitosamente`,
      documents: generatedDocuments,
    })
  } catch (error) {
    console.error('Generate PDF error:', error)
    return NextResponse.json(
      { error: 'Error al generar documentos PDF' },
      { status: 500 }
    )
  }
}
