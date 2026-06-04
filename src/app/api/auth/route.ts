import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { PasswordManager, RateLimiter, isValidEmail } from '@/lib/security'
import { authSchemas } from '@/lib/validation'
import {
  ApiError,
  ApiLogger,
  ErrorCode,
  asyncHandler,
  errorResponse,
  successResponse,
  validationError,
} from '@/lib/api-errors'

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register - Register new user
// ═══════════════════════════════════════════════════════════
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { action, email, name, password, role } = body

  // ───────────────────────────────────────────────────────
  // REGISTER ACTION
  // ───────────────────────────────────────────────────────
  if (action === 'register') {
    // Validar esquema
    const validation = authSchemas.register.safeParse({ email, name, password, role })
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        errors[err.path.join('.')] = err.message
      })
      throw validationError(errors)
    }

    // Validar email format
    if (!isValidEmail(email)) {
      throw new ApiError(
        ErrorCode.INVALID_INPUT,
        'Email inválido'
      )
    }

    // Validar fortaleza de password
    const passwordStrength = PasswordManager.validateStrength(password)
    if (!passwordStrength.valid) {
      throw new ApiError(
        ErrorCode.INVALID_INPUT,
        'Password no cumple requisitos de seguridad',
        { requirements: passwordStrength.errors }
      )
    }

    // Verificar duplicado
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ApiError(
        ErrorCode.ALREADY_EXISTS,
        'Ya existe un usuario con ese email'
      )
    }

    // Crear usuario con password hasheado
    const hashedPassword = PasswordManager.hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role,
      },
    })

    ApiLogger.log('POST', '/api/auth', { action: 'register', userId: user.id })

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }, 201)
  }

  // ───────────────────────────────────────────────────────
  // LOGIN ACTION
  // ───────────────────────────────────────────────────────
  if (action === 'login') {
    // Validar esquema
    const validation = authSchemas.login.safeParse({ email, password })
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        errors[err.path.join('.')] = err.message
      })
      throw validationError(errors)
    }

    // RATE LIMITING: Protege contra brute force
    const isLimited = RateLimiter.isLimited(
      email,
      parseInt(process.env.AUTH_RATE_LIMIT || '5'),
      parseInt(process.env.AUTH_RATE_WINDOW_MS || '900000')
    )

    if (isLimited) {
      const resetTime = RateLimiter.getResetTime(email)
      throw new ApiError(
        ErrorCode.UNAUTHORIZED,
        `Demasiados intentos fallidos. Intente en ${resetTime}s`,
        { resetTime }
      )
    }

    // Buscar usuario
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      ApiLogger.log('POST', '/api/auth', { action: 'login', result: 'user_not_found', email })
      throw new ApiError(
        ErrorCode.INVALID_CREDENTIALS,
        'Email o contraseña incorrectos'
      )
    }

    // Verificar password
    const passwordValid = PasswordManager.verifyPassword(password, user.password)
    if (!passwordValid) {
      ApiLogger.log('POST', '/api/auth', { action: 'login', result: 'invalid_password', email })
      throw new ApiError(
        ErrorCode.INVALID_CREDENTIALS,
        'Email o contraseña incorrectos'
      )
    }

    // ✅ Login exitoso: Reset rate limiter
    RateLimiter.reset(email)

    ApiLogger.log('POST', '/api/auth', { action: 'login', result: 'success', userId: user.id })

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })
  }

  throw new ApiError(
    ErrorCode.INVALID_INPUT,
    'Acción no válida. Use "register" o "login"'
  )
})

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me?userId=xxx - Get current user info
// ═══════════════════════════════════════════════════════════
export const GET = asyncHandler(async (request: NextRequest) => {
  const userId = request.nextUrl.searchParams.get('userId')

  if (!userId) {
    throw new ApiError(
      ErrorCode.MISSING_FIELD,
      'Parámetro userId requerido'
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
    throw new ApiError(
      ErrorCode.NOT_FOUND,
      'Usuario no encontrado'
    )
  }

  return successResponse(user)
})
