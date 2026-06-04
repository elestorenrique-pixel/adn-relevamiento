import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.session.findUnique({
      where: { id },
      include: {
        tecnico: { select: { id: true, name: true, email: true, role: true } },
        auditor: { select: { id: true, name: true, email: true, role: true } },
        safetyChecks: { orderBy: { order: 'asc' } },
        panelChecks: { orderBy: { order: 'asc' } },
        motorChecks: { orderBy: { order: 'asc' } },
        analysisData: true,
        chatMessages: { orderBy: { timestamp: 'asc' } },
        auditRecords: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Error al obtener la sesión' },
      { status: 500 }
    )
  }
}

// PATCH /api/sessions/[id] - Update session (change stage, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, currentStage, userId } = body

    const session = await db.session.findUnique({
      where: { id },
      include: {
        safetyChecks: true,
        panelChecks: true,
        motorChecks: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Validate stage transitions
    if (currentStage) {
      const validStages = ['safety', 'panel', 'motor', 'analysis']
      if (!validStages.includes(currentStage)) {
        return NextResponse.json(
          { error: `Etapa inválida. Debe ser una de: ${validStages.join(', ')}` },
          { status: 400 }
        )
      }

      // Safety must be fully completed before advancing to panel
      if (currentStage === 'panel' && session.currentStage === 'safety') {
        const allTecnicoCompleted = session.safetyChecks.every(s => s.tecnicoCompleted)
        const allAuditorValidated = session.safetyChecks.every(s => s.auditorValidated)

        if (!allTecnicoCompleted || !allAuditorValidated) {
          return NextResponse.json(
            { error: 'No se puede avanzar a Panel. Las 5 Reglas de Oro deben ser completadas por el técnico Y validadas por el auditor.' },
            { status: 400 }
          )
        }
      }

      // Panel must be completed before advancing to motor
      if (currentStage === 'motor' && session.currentStage === 'panel') {
        const allTecnicoCompleted = session.panelChecks.every(s => s.tecnicoCompleted)
        const allAuditorValidated = session.panelChecks.every(s => s.auditorValidated)

        if (!allTecnicoCompleted || !allAuditorValidated) {
          return NextResponse.json(
            { error: 'No se puede avanzar a Motor. Todas las verificaciones de Panel deben estar completadas y validadas.' },
            { status: 400 }
          )
        }
      }

      // Motor must be completed before advancing to analysis
      if (currentStage === 'analysis' && session.currentStage === 'motor') {
        const allTecnicoCompleted = session.motorChecks.every(s => s.tecnicoCompleted)
        const allAuditorValidated = session.motorChecks.every(s => s.auditorValidated)

        if (!allTecnicoCompleted || !allAuditorValidated) {
          return NextResponse.json(
            { error: 'No se puede avanzar a Análisis. Todas las verificaciones de Motor deben estar completadas y validadas.' },
            { status: 400 }
          )
        }
      }
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (currentStage) updateData.currentStage = currentStage
    if (status === 'completed') updateData.completedAt = new Date()

    const updatedSession = await db.session.update({
      where: { id },
      data: updateData,
      include: {
        tecnico: { select: { id: true, name: true, email: true, role: true } },
        auditor: { select: { id: true, name: true, email: true, role: true } },
        safetyChecks: { orderBy: { order: 'asc' } },
        panelChecks: { orderBy: { order: 'asc' } },
        motorChecks: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la sesión' },
      { status: 500 }
    )
  }
}
