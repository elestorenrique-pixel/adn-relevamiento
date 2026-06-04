import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBudget } from '@/lib/costs'

// GET /api/costs/calculate?sessionId=xxx - Calculate budget for a session
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Parámetro sessionId requerido' },
        { status: 400 }
      )
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        panelChecks: { orderBy: { order: 'asc' } },
        motorChecks: { orderBy: { order: 'asc' } },
        safetyChecks: { orderBy: { order: 'asc' } },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Use the cost engine to calculate budget
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

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Calculate budget error:', error)
    return NextResponse.json(
      { error: 'Error al calcular presupuesto' },
      { status: 500 }
    )
  }
}
