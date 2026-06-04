import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoCompleteAudit } from '@/lib/normative'

// POST /api/sessions/[id]/audit/auto-complete - Auto-complete audit for omissions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { category } = body

    if (!category) {
      return NextResponse.json(
        { error: 'Campo "category" requerido (safety, panel, motor, analysis)' },
        { status: 400 }
      )
    }

    const session = await db.session.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    let steps: Array<{ step: string; tecnicoCompleted: boolean; auditorValidated: boolean; value?: string | null }> = []

    if (category === 'safety') {
      const checks = await db.safetyCheck.findMany({
        where: { sessionId: id },
        orderBy: { order: 'asc' },
      })
      steps = checks.map(c => ({
        step: c.step,
        tecnicoCompleted: c.tecnicoCompleted,
        auditorValidated: c.auditorValidated,
      }))
    } else if (category === 'panel') {
      const checks = await db.panelCheck.findMany({
        where: { sessionId: id },
        orderBy: { order: 'asc' },
      })
      steps = checks.map(c => ({
        step: c.step,
        tecnicoCompleted: c.tecnicoCompleted,
        auditorValidated: c.auditorValidated,
        value: c.tecnicoValue,
      }))
    } else if (category === 'motor') {
      const checks = await db.motorCheck.findMany({
        where: { sessionId: id },
        orderBy: { order: 'asc' },
      })
      steps = checks.map(c => ({
        step: c.step,
        tecnicoCompleted: c.tecnicoCompleted,
        auditorValidated: c.auditorValidated,
        value: c.tecnicoValue,
      }))
    } else {
      return NextResponse.json(
        { error: 'Categoría inválida. Debe ser: safety, panel, motor, analysis' },
        { status: 400 }
      )
    }

    // Run auto-complete detection
    const autoResults = autoCompleteAudit(category, steps)

    // Create audit records for detected issues
    const createdRecords = []
    for (const result of autoResults) {
      const record = await db.auditRecord.create({
        data: {
          sessionId: id,
          category,
          action: `Auto-detección: paso "${result.step}"`,
          correct: result.errors.length === 0 && result.omissions.length === 0,
          errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
          omissions: result.omissions.length > 0 ? JSON.stringify(result.omissions) : null,
          normativeReference: 'AEA 90364 / EDESA NT',
          auditorNotes: 'Detectado automáticamente por el sistema',
          autoDetected: true,
        },
      })
      createdRecords.push(record)
    }

    return NextResponse.json({
      category,
      totalIssues: autoResults.length,
      records: createdRecords,
      details: autoResults,
    })
  } catch (error) {
    console.error('Auto-complete audit error:', error)
    return NextResponse.json(
      { error: 'Error al completar auditoría automáticamente' },
      { status: 500 }
    )
  }
}
