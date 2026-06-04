import { NextResponse } from 'next/server'

/**
 * Error types with HTTP status codes
 * Helps in debugging and API client handling
 */
export enum ErrorCode {
  // 400 - Client errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // 401 - Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // 403 - Permission
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 404 - Not found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // 409 - Conflict
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // 422 - Unprocessable entity
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  
  // 500 - Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Map ErrorCode to HTTP status
 */
export const errorCodeToStatus: Record<ErrorCode, number> = {
  // 400
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_FIELD]: 400,
  
  // 401
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  
  // 403
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  
  // 404
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  
  // 409
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  
  // 422
  [ErrorCode.UNPROCESSABLE_ENTITY]: 422,
  
  // 500
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,
}

/**
 * ApiError class for consistent error handling
 */
export class ApiError extends Error {
  public code: ErrorCode
  public status: number
  public details?: Record<string, any>
  public timestamp: string

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>
  ) {
    super(message)
    this.code = code
    this.status = errorCodeToStatus[code]
    this.details = details
    this.timestamp = new Date().toISOString()
    
    // Preserve error chain
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details,
        timestamp: this.timestamp,
      },
    }
  }
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Create an error response
 */
export function errorResponse(error: ApiError | Error, customStatus?: number) {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.status })
  }

  // Fallback for non-ApiError exceptions
  const apiError = new ApiError(
    ErrorCode.INTERNAL_ERROR,
    error.message || 'Error interno del servidor',
    { originalError: error.name }
  )

  return NextResponse.json(apiError.toJSON(), { status: customStatus || 500 })
}

/**
 * Validation error helper
 */
export function validationError(fields: Record<string, string>) {
  return new ApiError(
    ErrorCode.VALIDATION_ERROR,
    'Errores de validación',
    { fields }
  )
}

/**
 * Safe async wrapper for API routes
 * Catches errors and returns proper responses
 */
export function asyncHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ApiError) {
        return errorResponse(error)
      }
      
      return errorResponse(error as Error)
    }
  }
}

/**
 * Logger for API operations
 */
export class ApiLogger {
  static log(method: string, path: string, details: Record<string, any>) {
    console.log(
      `[${new Date().toISOString()}] ${method} ${path}`,
      details
    )
  }

  static error(method: string, path: string, error: Error, details?: Record<string, any>) {
    console.error(
      `[${new Date().toISOString()}] ERROR ${method} ${path}`,
      { error: error.message, stack: error.stack, ...details }
    )
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
}
