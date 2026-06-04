import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAFETY_STEPS } from '@/lib/types'

// Generate a unique 6-digit session code
async function generateSessionCode(): Promise<string> {
  let code: string
  let exists = true

  while (exists) {
    code = String(Math.floor(100000 + Math.random() * 900000))
    const existing = await db.session.findUnique({ where: { code } })
    exists = !!existing
  }

  return code!
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tecnicoId } = body

    if (!tecnicoId) {
      return NextResponse.json(
        { error: 'tecnicoId es requerido' },
        { status: 400 }
      )
    }

    // Verify the tecnico exists and has the correct role
    const tecnico = await db.user.findUnique({ where: { id: tecnicoId } })
    if (!tecnico) {
      return NextResponse.json(
        { error: 'Técnico no encontrado' },
        { status: 404 }
      )
    }
    if (tecnico.role !== 'tecnico') {
      return NextResponse.json(
        { error: 'El usuario debe tener rol de técnico' },
        { status: 403 }
      )
    }

    const code = await generateSessionCode()

    const session = await db.session.create({
      data: {
        code,
        status: 'lobby',
        currentStage: 'safety',
        tecnicoId,
        safetyChecks: {
          create: SAFETY_STEPS.map((step) => ({
            step: step.id,
            order: step.order,
            tecnicoCompleted: false,
            auditorValidated: false,
          })),
        },
      },
      include: {
        tecnico: { select: { id: true, name: true, email: true, role: true } },
        auditor: { select: { id: true, name: true, email: true, role: true } },
        safetyChecks: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión' },
      { status: 500 }
    )
  }
}

// GET /api/sessions?userId=xxx - List sessions for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Parámetro userId requerido' },
        { status: 400 }
      )
    }

    const sessions = await db.session.findMany({
      where: {
        OR: [
          { tecnicoId: userId },
          { auditorId: userId },
        ],
      },
      include: {
        tecnico: { select: { id: true, name: true, email: true } },
        auditor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('List sessions error:', error)
    return NextResponse.json(
      { error: 'Error al obtener las sesiones' },
      { status: 500 }
    )
  }
}
