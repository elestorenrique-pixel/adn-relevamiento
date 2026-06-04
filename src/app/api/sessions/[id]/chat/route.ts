import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sessions/[id]/chat - Get chat messages for a session
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

    const messages = await db.chatMessage.findMany({
      where: { sessionId: id },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { timestamp: 'asc' },
    })

    const formattedMessages = messages.map(m => ({
      id: m.id,
      sessionId: m.sessionId,
      userId: m.userId,
      userName: m.user.name,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes del chat' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/chat - Save a chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, role, content } = body

    if (!userId || !role || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: userId, role, content' },
        { status: 400 }
      )
    }

    if (!['tecnico', 'auditor', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser: tecnico, auditor, system' },
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

    // Verify user belongs to this session (except system messages)
    if (role !== 'system') {
      if (userId !== session.tecnicoId && userId !== session.auditorId) {
        return NextResponse.json(
          { error: 'El usuario no pertenece a esta sesión' },
          { status: 403 }
        )
      }
    }

    const message = await db.chatMessage.create({
      data: {
        sessionId: id,
        userId,
        role,
        content,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({
      id: message.id,
      sessionId: message.sessionId,
      userId: message.userId,
      userName: message.user.name,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Save chat message error:', error)
    return NextResponse.json(
      { error: 'Error al guardar mensaje del chat' },
      { status: 500 }
    )
  }
}
