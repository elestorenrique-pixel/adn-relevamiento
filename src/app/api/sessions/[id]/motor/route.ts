import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOTOR_STEPS } from '@/lib/types'
import { validateVoltage, validateInsulation, validatePowerFactor } from '@/lib/normative'

// GET /api/sessions/[id]/motor - Get all motor checks for a session
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

    const motorChecks = await db.motorCheck.findMany({
      where: { sessionId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(motorChecks)
  } catch (error) {
    console.error('Get motor checks error:', error)
    return NextResponse.json(
      { error: 'Error al obtener verificaciones de motor' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/motor - Update a motor check step
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
      include: { motorChecks: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // If there are no motor checks yet, create them (advancing to motor stage)
    if (session.motorChecks.length === 0) {
      await db.motorCheck.createMany({
        data: MOTOR_STEPS.map((s) => ({
          sessionId: id,
          step: s.id,
          order: s.order,
          tecnicoCompleted: false,
          auditorValidated: false,
          normativeStatus: 'pending',
        })),
      })
    }

    const motorCheck = await db.motorCheck.findFirst({
      where: { sessionId: id, step },
    })

    if (!motorCheck) {
      return NextResponse.json(
        { error: `Paso de motor "${step}" no encontrado en esta sesión` },
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
    const currentValue = tecnicoValue !== undefined ? tecnicoValue : motorCheck.tecnicoValue
    if (currentValue) {
      const numValue = parseFloat(currentValue)
      if (!isNaN(numValue)) {
        let validation
        switch (step) {
          case 'voltage':
            validation = validateVoltage('motor', numValue, numValue > 300)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'insulation':
            validation = validateInsulation(numValue, true)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'power_cosfi':
            validation = validatePowerFactor(numValue)
            updateData.normativeStatus = validation.passed ? 'passed' : 'failed'
            break
          case 'current':
          case 'coil_resistance':
          case 'nameplate':
            // Mark as passed if tecnico completed
            if (tecnicoCompleted) {
              updateData.normativeStatus = 'passed'
            }
            break
        }
      }
    }

    const updatedCheck = await db.motorCheck.update({
      where: { id: motorCheck.id },
      data: updateData,
    })

    // Check if all motor steps are completed and validated
    if (tecnicoCompleted || auditorValidated) {
      const allChecks = await db.motorCheck.findMany({
        where: { sessionId: id },
      })
      const allTecnicoCompleted = allChecks.every(c => c.tecnicoCompleted)
      const allAuditorValidated = allChecks.every(c => c.auditorValidated)

      if (allTecnicoCompleted && allAuditorValidated) {
        await db.session.update({
          where: { id },
          data: { status: 'analysis', currentStage: 'analysis' },
        })
      }
    }

    return NextResponse.json(updatedCheck)
  } catch (error) {
    console.error('Update motor check error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar verificación de motor' },
      { status: 500 }
    )
  }
}
