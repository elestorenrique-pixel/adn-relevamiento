/**
 * Sistema de logging centralizado
 * Reemplaza console.log para mejor control
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: any
  stack?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Registrar un log
   */
  private log(
    level: LogLevel,
    module: string,
    message: string,
    data?: any,
    stack?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      stack,
    }

    this.logs.push(entry)

    // Limitar tamaño en memoria
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // En desarrollo, mostrar en console con colores
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // cyan
        [LogLevel.INFO]: '\x1b[32m', // green
        [LogLevel.WARN]: '\x1b[33m', // yellow
        [LogLevel.ERROR]: '\x1b[31m', // red
      }

      const reset = '\x1b[0m'
      const color = colors[level]

      console.log(
        `${color}[${entry.timestamp}] [${module}] ${message}${reset}`,
        data || ''
      )

      if (stack) {
        console.error(stack)
      }
    }

    // TODO: En producción, enviar a servicio de logging (Sentry, DataDog, etc)
  }

  debug(module: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  info(module: string, message: string, data?: any) {
    this.log(LogLevel.INFO, module, message, data)
  }

  warn(module: string, message: string, data?: any) {
    this.log(LogLevel.WARN, module, message, data)
  }

  error(module: string, message: string, data?: any, error?: Error) {
    this.log(LogLevel.ERROR, module, message, data, error?.stack)
  }

  /**
   * Obtener todos los logs
   */
  getLogs(filter?: { level?: LogLevel; module?: string }): LogEntry[] {
    return this.logs.filter((log) => {
      if (filter?.level && log.level !== filter.level) return false
      if (filter?.module && log.module !== filter.module) return false
      return true
    })
  }

  /**
   * Limpiar logs
   */
  clear() {
    this.logs = []
  }

  /**
   * Exportar logs como JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Exportar logs como CSV
   */
  exportAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Module', 'Message', 'Data']
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.module,
      log.message,
      JSON.stringify(log.data || ''),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csv
  }
}

// Exportar instancia singleton
export const logger = new Logger()

// Aliases para conveniencia
export const debug = (module: string, message: string, data?: any) =>
  logger.debug(module, message, data)
export const info = (module: string, message: string, data?: any) =>
  logger.info(module, message, data)
export const warn = (module: string, message: string, data?: any) =>
  logger.warn(module, message, data)
export const error = (module: string, message: string, data?: any, err?: Error) =>
  logger.error(module, message, data, err)
