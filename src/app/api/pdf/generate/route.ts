import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBudget, formatARS } from '@/lib/costs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Helper to add ADL Técnico header to PDF
function addHeader(doc: jsPDF, title: string, session: { code: string; tecnico: { name: string } | null; auditor: { name: string } | null; createdAt: Date }) {
  // Header background
  doc.setFillColor(30, 58, 46) // Dark green
  doc.rect(0, 0, 210, 35, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ADL Técnico', 14, 15)

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Simulación de Relevamiento Eléctrico Industrial', 14, 22)

  // Document title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 31)

  // Session info on right
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código: ${session.code}`, 196, 15, { align: 'right' })
  doc.text(`Técnico: ${session.tecnico?.name ?? 'N/A'}`, 196, 21, { align: 'right' })
  doc.text(`Auditor: ${session.auditor?.name ?? 'N/A'}`, 196, 27, { align: 'right' })
  doc.text(`Fecha: ${new Date(session.createdAt).toLocaleDateString('es-AR')}`, 196, 33, { align: 'right' })

  // Reset text color
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
}

// Helper to add footer
function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(30, 58, 46)
  doc.rect(0, pageHeight - 15, 210, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text('ADL Técnico - Simulación Educativa', 14, pageHeight - 6)
  doc.text(`Página ${pageNum} de ${totalPages}`, 196, pageHeight - 6, { align: 'right' })
  doc.setTextColor(0, 0, 0)
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
  let y = 40

  addHeader(doc, 'Informe de Relevamiento Eléctrico', session)

  // Safety section
  y = 45
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text('1. Verificaciones de Seguridad - 5 Reglas de Oro', 14, y)
  y += 3

  const safetyData = safetyChecks.map((c, i) => [
    `${i + 1}`,
    c.step,
    c.tecnicoCompleted ? '✓ Completado' : '✗ Pendiente',
    c.auditorValidated ? '✓ Validado' : '✗ Pendiente',
    c.tecnicoNotes || c.auditorNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Técnico', 'Auditor', 'Notas']],
    body: safetyData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46] },
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 4: { cellWidth: 60 } },
  })

  // Panel section
  y = (doc as any).lastAutoTable.finalY + 10
  if (y > 250) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Verificaciones de Tablero', 14, y)
  y += 3

  const panelData = panelChecks.map((c, i) => [
    `${i + 1}`,
    c.step,
    c.tecnicoValue || '-',
    c.normativeStatus === 'passed' ? '✓ Aprobado' : c.normativeStatus === 'failed' ? '✗ Rechazado' : '○ Pendiente',
    c.tecnicoNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Valor Medido', 'Normativa', 'Notas']],
    body: panelData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46] },
    styles: { fontSize: 8 },
  })

  // Motor section
  y = (doc as any).lastAutoTable.finalY + 10
  if (y > 250) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Verificaciones de Motor', 14, y)
  y += 3

  const motorData = motorChecks.map((c, i) => [
    `${i + 1}`,
    c.step,
    c.tecnicoValue || '-',
    c.normativeStatus === 'passed' ? '✓ Aprobado' : c.normativeStatus === 'failed' ? '✗ Rechazado' : '○ Pendiente',
    c.tecnicoNotes || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Paso', 'Valor Medido', 'Normativa', 'Notas']],
    body: motorData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 46] },
    styles: { fontSize: 8 },
  })

  // Analysis section
  if (analysisData.length > 0) {
    y = (doc as any).lastAutoTable.finalY + 10
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('4. Análisis de Potencia', 14, y)
    y += 3

    const analysisTableData = analysisData.map((a) => [
      a.parameter,
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
      headStyles: { fillColor: [30, 58, 46] },
      styles: { fontSize: 8 },
    })
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
  motorChecks: any[]
): jsPDF {
  const doc = new jsPDF()
  let y = 40

  addHeader(doc, 'Informe de Auditoría Eléctrica', session)

  y = 45
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text('Registros de Auditoría', 14, y)
  y += 5

  if (auditRecords.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('No se encontraron registros de auditoría para esta sesión.', 14, y)
  } else {
    // Group by category
    const categories = ['safety', 'panel', 'motor', 'analysis']
    const categoryLabels: Record<string, string> = {
      safety: 'Seguridad',
      panel: 'Tablero',
      motor: 'Motor',
      analysis: 'Análisis',
    }

    for (const cat of categories) {
      const records = auditRecords.filter((r: any) => r.category === cat)
      if (records.length === 0) continue

      if (y > 250) { doc.addPage(); y = 20 }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${categoryLabels[cat] || cat}`, 14, y)
      y += 3

      const tableData = records.map((r: any) => [
        r.action,
        r.correct ? '✓ Correcto' : '✗ Incorrecto',
        r.errors ? JSON.parse(r.errors).join(', ') : '-',
        r.omissions ? JSON.parse(r.omissions).join(', ') : '-',
        r.autoDetected ? 'Auto' : 'Manual',
      ])

      autoTable(doc, {
        startY: y,
        head: [['Acción', 'Resultado', 'Errores', 'Omisiónes', 'Tipo']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 46] },
        styles: { fontSize: 8 },
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // Summary
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen de Auditoría', 14, y)
    y += 5

    const totalRecords = auditRecords.length
    const correctCount = auditRecords.filter((r: any) => r.correct).length
    const autoDetectedCount = auditRecords.filter((r: any) => r.autoDetected).length

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de registros: ${totalRecords}`, 14, y); y += 6
    doc.text(`Correctos: ${correctCount}`, 14, y); y += 6
    doc.text(`Con observaciones: ${totalRecords - correctCount}`, 14, y); y += 6
    doc.text(`Auto-detectados: ${autoDetectedCount}`, 14, y); y += 6
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
  budget: any
): jsPDF {
  const doc = new jsPDF()
  let y = 40

  addHeader(doc, 'Presupuesto - Correcciones y Materiales', session)

  y = 45

  // Labor section
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 46)
  doc.text('1. Mano de Obra', 14, y)
  y += 3

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
    headStyles: { fillColor: [30, 58, 46] },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  })

  // Subtotal labor
  y = (doc as any).lastAutoTable.finalY + 3
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Subtotal Mano de Obra: ${formatARS(budget.laborTotal)}`, 196, y, { align: 'right' })

  // Materials section
  y += 10
  if (y > 250) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.text('2. Materiales', 14, y)
  y += 3

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
    headStyles: { fillColor: [30, 58, 46] },
    styles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  })

  y = (doc as any).lastAutoTable.finalY + 3
  doc.setFontSize(10)
  doc.text(`Subtotal Materiales: ${formatARS(budget.materialsTotal)}`, 196, y, { align: 'right' })

  // Corrections section
  if (budget.corrections.length > 0) {
    y += 10
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.text('3. Correcciones', 14, y)
    y += 3

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
      headStyles: { fillColor: [30, 58, 46] },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
    })

    y = (doc as any).lastAutoTable.finalY + 3
    doc.setFontSize(10)
    doc.text(`Subtotal Correcciones: ${formatARS(budget.correctionsTotal)}`, 196, y, { align: 'right' })
  }

  // Grand total
  y += 15
  if (y > 260) { doc.addPage(); y = 20 }

  doc.setFillColor(30, 58, 46)
  doc.rect(120, y - 5, 76, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 125, y + 4)
  doc.text(formatARS(budget.grandTotal), 192, y + 4, { align: 'right' })

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
          doc = generateAuditoria(session, session.auditRecords, session.safetyChecks, session.panelChecks, session.motorChecks)
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
          doc = generatePresupuesto(session, budget)
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
