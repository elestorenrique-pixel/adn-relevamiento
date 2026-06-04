import crypto from 'crypto'

/**
 * PASSWORD HASHING WITH SALT
 * Reemplaza el base64 débil
 */
export class PasswordManager {
  /**
   * Hash password with SHA-256 + salt
   * Para producción: usar bcrypt o argon2
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex')
    
    return `${salt}:${hash}`
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':')
      if (!salt || !hash) return false

      const computedHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex')

      return computedHash === hash
    } catch {
      return false
    }
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) errors.push('Mínimo 8 caracteres')
    if (!/[A-Z]/.test(password)) errors.push('Requiere al menos una mayúscula')
    if (!/[a-z]/.test(password)) errors.push('Requiere al menos una minúscula')
    if (!/[0-9]/.test(password)) errors.push('Requiere al menos un número')
    if (!/[!@#$%^&*]/.test(password)) errors.push('Requiere al menos un símbolo (!@#$%^&*)')

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

/**
 * RATE LIMITING
 * Previene brute force y abuso
 */
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>()

  /**
   * Check if request exceeds rate limit
   * @param key Identificador único (ej: email, IP)
   * @param limit Máximo de intentos
   * @param windowMs Ventana de tiempo en ms
   */
  static isLimited(key: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      // Nueva ventana
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return false
    }

    record.count++
    return record.count > limit
  }

  /**
   * Get remaining attempts
   */
  static getRemaining(key: string, limit: number = 5): number {
    const record = this.store.get(key)
    if (!record) return limit
    return Math.max(0, limit - record.count)
  }

  /**
   * Reset counter for key (after successful auth)
   */
  static reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get time until reset (in seconds)
   */
  static getResetTime(key: string): number {
    const record = this.store.get(key)
    if (!record) return 0

    const remaining = record.resetTime - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
  }
}

/**
 * SECURE HEADERS FOR API RESPONSES
 */
export function getSecureHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

/**
 * GENERATE SECURE SESSION TOKEN
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * VALIDATE EMAIL FORMAT
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * SANITIZE STRING (previene SQL injection básico)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/['";\\]/g, '')
    .substring(0, 500) // Limita longitud
}
