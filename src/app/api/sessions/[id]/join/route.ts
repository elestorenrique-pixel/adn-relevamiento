import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/sessions/[id]/join - Join session as auditor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { code, auditorId } = body

    if (!code || !auditorId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: code, auditorId' },
        { status: 400 }
      )
    }

    // Verify the auditor exists
    const auditor = await db.user.findUnique({ where: { id: auditorId } })
    if (!auditor) {
      return NextResponse.json(
        { error: 'Auditor no encontrado' },
        { status: 404 }
      )
    }
    if (auditor.role !== 'auditor') {
      return NextResponse.json(
        { error: 'El usuario debe tener rol de auditor' },
        { status: 403 }
      )
    }

    const session = await db.session.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Validate the 6-digit code
    if (session.code !== code) {
      return NextResponse.json(
        { error: 'Código de sesión incorrecto' },
        { status: 401 }
      )
    }

    // Check if session already has an auditor
    if (session.auditorId) {
      return NextResponse.json(
        { error: 'Esta sesión ya tiene un auditor asignado' },
        { status: 409 }
      )
    }

    // Join the session
    const updatedSession = await db.session.update({
      where: { id },
      data: {
        auditorId,
        status: 'safety', // Start at safety stage when auditor joins
      },
      include: {
        tecnico: { select: { id: true, name: true, email: true, role: true } },
        auditor: { select: { id: true, name: true, email: true, role: true } },
        safetyChecks: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Join session error:', error)
    return NextResponse.json(
      { error: 'Error al unirse a la sesión' },
      { status: 500 }
    )
  }
}
