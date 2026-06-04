import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PANEL_STEPS } from '@/lib/types'
import { validateVoltage, validateGrounding, validateTorque } from '@/lib/normative'

// GET /api/sessions/[id]/panel - Get all panel checks for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.session.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const panelChecks = await db.panelCheck.findMany({
      where: { sessionId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(panelChecks)
  } catch (error) {
    console.error('Get panel checks error:', error)
    return NextResponse.json(
      { error: 'Error al obtener verificaciones de panel' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/panel - Update a panel check step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { step, tecnicoValue, tecnicoCompleted, auditorValidated, tecnicoNotes, auditorNotes, auditorErrors, userId } = body

    if (!step) {
      return NextResponse.json(
        { error: 'Campo "step" requerido' },
        { status: 400 }
      )
    }

    const session = await db.session.findUnique({
      where: { id },
      include: { panelChecks: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // If there are no panel checks yet, create them (advancing to panel stage)
    if (session.panelChecks.length === 0) {
      await db.panelCheck.createMany({
        data: PANEL_STEPS.map((s) => ({
          sessionId: id,
          step: s.id,
          order: s.order,
          tecnicoCompleted: false,
          auditorValidated: false,
          normativeStatus: 'pending',
        })),
      })
    }

    // Find the panel check
    const panelCheck = await db.panelCheck.findFirst({
      where: { sessionId: id, step },
    })

    if (!panelCheck) {
      return NextResponse.json(
        { error: `Paso de panel "${step}" no encontrado en esta sesión` },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (tecnicoValue !== undefined) {
      updateData.tecnicoValue = tecnicoValue
    }

    if (tecnicoCompleted !== undefined) {
      if (userId !== session.tecnicoId) {
        return NextResponse.json(
          { error: 'Solo el técnico puede marcar pasos como completados' },
          { status: 403 }
        )
      }
      updateData.tecnicoCompleted = tecnicoCompleted
    }

    if (auditorValidated !== undefined) {
      if (userId !== session.auditorId) {
        return NextResponse.json(
          { error: 'Solo el auditor puede validar pasos' },
          { status: 403 }
        )
      }
      updateData.auditorValidated = auditorValidated
    }

    if (tecnicoNotes !== undefined) {
      updateData.tecnicoNotes = tecnicoNotes
    }

    if (auditorNotes !== undefined) {
      updateData.auditorNotes = auditorNotes
    }

    if (auditorErrors !== undefined) {
      updateData.auditorErrors = auditorErrors
    }

    // Run normative validation based on step and value
    const currentValue = tecnicoValue !== undefined ? tecnicoValue : panelCheck.tecnicoValue
    if (currentValue) {
      const numValue = parseFloat(currentValue)
      if (!isNaN(numValue)) {
        let validation
        switch (step) {
          case 'voltage':
            validation = validateVoltage('medida', numValue, numValue > 300)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'grounding':
            validation = validateGrounding(numValue)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'torque':
            validation = validateTorque(numValue)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'current':
          case 'conductors':
          case 'distribution':
          case 'terminals':
            // These are qualitative checks, mark as passed if tecnico completed
            if (tecnicoCompleted) {
              updateData.normativeStatus = 'passed'
            }
            break
        }
      }
    }

    const updatedCheck = await db.panelCheck.update({
      where: { id: panelCheck.id },
      data: updateData,
    })

    // Check if all panel steps are completed and validated
    if (tecnicoCompleted || auditorValidated) {
      const allChecks = await db.panelCheck.findMany({
        where: { sessionId: id },
      })
      const allTecnicoCompleted = allChecks.every(c => c.tecnicoCompleted)
      const allAuditorValidated = allChecks.every(c => c.auditorValidated)

      if (allTecnicoCompleted && allAuditorValidated) {
        await db.session.update({
          where: { id },
          data: { status: 'motor', currentStage: 'motor' },
        })
      }
    }

    return NextResponse.json(updatedCheck)
  } catch (error) {
    console.error('Update panel check error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar verificación de panel' },
      { status: 500 }
    )
  }
}
