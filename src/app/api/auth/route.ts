import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple base64 password hashing for demo purposes
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password: string, hash: string): boolean {
  return Buffer.from(password).toString('base64') === hash
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, name, password, role, userId } = body

    // Handle different auth actions
    if (action === 'register') {
      if (!email || !name || !password || !role) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: email, name, password, role' },
          { status: 400 }
        )
      }

      if (!['tecnico', 'auditor'].includes(role)) {
        return NextResponse.json(
          { error: 'Rol inválido. Debe ser "tecnico" o "auditor"' },
          { status: 400 }
        )
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con ese email' },
          { status: 409 }
        )
      }

      const hashedPassword = hashPassword(password)
      const user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
        },
      })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      }, { status: 201 })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: email, password' },
          { status: 400 }
        )
      }

      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      if (!verifyPassword(password, user.password)) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use "register" o "login"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/auth/me?userId=xxx - Get current user info
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Parámetro userId requerido' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
