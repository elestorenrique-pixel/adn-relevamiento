import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoCompleteAudit } from '@/lib/normative'

// GET /api/sessions/[id]/audit - Get audit records for a session
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

    const auditRecords = await db.auditRecord.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(auditRecords)
  } catch (error) {
    console.error('Get audit records error:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros de auditoría' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/audit - Create audit record (auditor action)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { category, action, correct, errors, omissions, normativeReference, auditorNotes, autoDetected } = body

    if (!category || !action || correct === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: category, action, correct' },
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

    const auditRecord = await db.auditRecord.create({
      data: {
        sessionId: id,
        category,
        action,
        correct,
        errors: errors ? JSON.stringify(errors) : null,
        omissions: omissions ? JSON.stringify(omissions) : null,
        normativeReference: normativeReference ?? null,
        auditorNotes: auditorNotes ?? null,
        autoDetected: autoDetected ?? false,
      },
    })

    return NextResponse.json(auditRecord, { status: 201 })
  } catch (error) {
    console.error('Create audit record error:', error)
    return NextResponse.json(
      { error: 'Error al crear registro de auditoría' },
      { status: 500 }
    )
  }
}
