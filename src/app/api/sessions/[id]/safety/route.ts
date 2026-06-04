import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sessions/[id]/safety - Get all safety checks for a session
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

    const safetyChecks = await db.safetyCheck.findMany({
      where: { sessionId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(safetyChecks)
  } catch (error) {
    console.error('Get safety checks error:', error)
    return NextResponse.json(
      { error: 'Error al obtener verificaciones de seguridad' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/safety - Update a safety check step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { step, tecnicoCompleted, auditorValidated, tecnicoNotes, auditorNotes, userId } = body

    if (!step) {
      return NextResponse.json(
        { error: 'Campo "step" requerido' },
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

    // Find the safety check
    const safetyCheck = await db.safetyCheck.findFirst({
      where: { sessionId: id, step },
    })

    if (!safetyCheck) {
      return NextResponse.json(
        { error: `Paso de seguridad "${step}" no encontrado en esta sesión` },
        { status: 404 }
      )
    }

    // Determine what to update based on user role
    const updateData: Record<string, unknown> = {}

    if (tecnicoCompleted !== undefined) {
      // Verify user is the tecnico for this session
      if (userId !== session.tecnicoId) {
        return NextResponse.json(
          { error: 'Solo el técnico puede marcar pasos como completados' },
          { status: 403 }
        )
      }
      updateData.tecnicoCompleted = tecnicoCompleted
    }

    if (auditorValidated !== undefined) {
      // Verify user is the auditor for this session
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

    const updatedCheck = await db.safetyCheck.update({
      where: { id: safetyCheck.id },
      data: updateData,
    })

    // Check if all safety steps are now completed by tecnico and validated by auditor
    if (tecnicoCompleted || auditorValidated) {
      const allChecks = await db.safetyCheck.findMany({
        where: { sessionId: id },
      })
      const allTecnicoCompleted = allChecks.every(c => c.tecnicoCompleted)
      const allAuditorValidated = allChecks.every(c => c.auditorValidated)

      if (allTecnicoCompleted && allAuditorValidated) {
        // Auto-advance session status
        await db.session.update({
          where: { id },
          data: { status: 'panel' },
        })
      }
    }

    return NextResponse.json(updatedCheck)
  } catch (error) {
    console.error('Update safety check error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar verificación de seguridad' },
      { status: 500 }
    )
  }
}
