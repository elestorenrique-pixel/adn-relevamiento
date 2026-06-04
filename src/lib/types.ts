// Core types for ADL Técnico - Industrial Electrical Simulation

export type UserRole = 'tecnico' | 'auditor'

export type SessionStatus = 'lobby' | 'safety' | 'panel' | 'motor' | 'analysis' | 'completed'

export type SessionStage = 'safety' | 'panel' | 'motor' | 'analysis'

export type NormativeStatus = 'pending' | 'passed' | 'failed'

export type Severity = 'error' | 'warning' | 'info'

// Safety steps - 5 Golden Rules
export const SAFETY_STEPS = [
  { id: 'identify', label: 'Identificar', description: 'Identificar la instalación / equipo sobre el que se va a trabajar', order: 1 },
  { id: 'verify_zero', label: 'Verificar Ausencia de Tensión', description: 'Verificar la ausencia de tensión con equipo adecuado (detector de tensión)', order: 2 },
  { id: 'grounding', label: 'Puesta a Tierra', description: 'Colocar puesta a tierra y en cortocircuito las fases del circuito', order: 3 },
  { id: 'block', label: 'Bloqueo / Señalización', description: 'Bloquear los dispositivos de corte y colocar señalización de seguridad', order: 4 },
  { id: 'signal', label: 'Delimitar Zona de Trabajo', description: 'Delimitar la zona de trabajo y colocar carteles de advertencia', order: 5 },
] as const

// Panel check steps
export const PANEL_STEPS = [
  { id: 'voltage', label: 'Medir Tensión', description: 'Medir tensión en las fases del tablero (V)', unit: 'V', order: 1 },
  { id: 'current', label: 'Medir Corriente', description: 'Medir corriente en cada circuito (A)', unit: 'A', order: 2 },
  { id: 'conductors', label: 'Identificar Conductores', description: 'Identificar conductores (fase, neutro, tierra)', unit: '', order: 3 },
  { id: 'distribution', label: 'Verificar Distribución', description: 'Verificar distribución de circuitos y protecciones', unit: '', order: 4 },
  { id: 'grounding', label: 'Control Puesta a Tierra', description: 'Medir resistencia de puesta a tierra (Ω)', unit: 'Ω', order: 5 },
  { id: 'terminals', label: 'Verificar Terminales', description: 'Verificar estado de terminales y conexiones', unit: '', order: 6 },
  { id: 'torque', label: 'Ajustar Torque', description: 'Verificar y ajustar torque de borneras (Nm)', unit: 'Nm', order: 7 },
] as const

// Motor check steps
export const MOTOR_STEPS = [
  { id: 'voltage', label: 'Medir Tensión', description: 'Medir tensión en bornes del motor (V)', unit: 'V', order: 1 },
  { id: 'current', label: 'Medir Corriente', description: 'Medir corriente de cada fase (A)', unit: 'A', order: 2 },
  { id: 'coil_resistance', label: 'Resistencia de Bobinas', description: 'Medir resistencia de bobinas (Ω)', unit: 'Ω', order: 3 },
  { id: 'insulation', label: 'Aislamiento (Bobina-Carcasa)', description: 'Medir resistencia de aislamiento bobina a carcasa (MΩ)', unit: 'MΩ', order: 4 },
  { id: 'nameplate', label: 'Lectura de Placa', description: 'Leer y registrar datos de placa del motor', unit: '', order: 5 },
  { id: 'power_cosfi', label: 'Potencia y Coseno φ', description: 'Identificar potencia activa y factor de potencia', unit: '', order: 6 },
] as const

// EPP items
export const EPP_ITEMS = [
  'Casco de seguridad dieléctrico',
  'Guantes dieléctricos clase 0',
  'Calzado de seguridad dieléctrico',
  'Protección ocular (antiparra)',
  'Ropa de trabajo sin partes metálicas',
] as const

// User interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

// Session interface
export interface Session {
  id: string
  code: string
  status: SessionStatus
  currentStage: SessionStage
  tecnicoId: string
  auditorId: string | null
  tecnicoName: string
  auditorName: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

// Safety check item
export interface SafetyCheckItem {
  id: string
  sessionId: string
  step: string
  tecnicoCompleted: boolean
  auditorValidated: boolean
  tecnicoNotes: string | null
  auditorNotes: string | null
  order: number
}

// Panel check item
export interface PanelCheckItem {
  id: string
  sessionId: string
  step: string
  tecnicoValue: string | null
  tecnicoCompleted: boolean
  auditorValidated: boolean
  tecnicoNotes: string | null
  auditorNotes: string | null
  auditorErrors: string | null
  normativeStatus: NormativeStatus
  order: number
}

// Motor check item
export interface MotorCheckItem {
  id: string
  sessionId: string
  step: string
  tecnicoValue: string | null
  tecnicoCompleted: boolean
  auditorValidated: boolean
  tecnicoNotes: string | null
  auditorNotes: string | null
  auditorErrors: string | null
  normativeStatus: NormativeStatus
  order: number
}

// Analysis data item
export interface AnalysisDataItem {
  id: string
  sessionId: string
  parameter: string
  measuredValue: string | null
  plateValue: string | null
  calculatedValue: string | null
  deviation: string | null
  status: NormativeStatus
  notes: string | null
}

// Chat message
export interface ChatMessageData {
  id: string
  sessionId: string
  userId: string
  userName: string
  role: UserRole | 'system'
  content: string
  timestamp: string
}

// Audit record
export interface AuditRecord {
  id: string
  sessionId: string
  category: string
  action: string
  correct: boolean
  errors: string | null
  omissions: string | null
  normativeReference: string | null
  auditorNotes: string | null
  autoDetected: boolean
  createdAt: string
}

// Normative rule
export interface NormativeRule {
  id: string
  source: string
  code: string
  description: string
  category: string
  validationType: string
  minValue: string | null
  maxValue: string | null
  requiredValue: string | null
  severity: Severity
}

// Cost item
export interface CostItem {
  id: string
  category: string
  description: string
  unit: string
  unitPrice: number
  isActive: boolean
}

// Motor nameplate data
export interface MotorNameplate {
  brand: string
  model: string
  powerHp: string
  powerKw: string
  voltage: string
  current: string
  frequency: string
  rpm: string
  cosFi: string
  serviceFactor: string
  insulation: string
  connection: string
}

// Analysis calculation results
export interface PowerAnalysis {
  activePowerMeasured: number
  reactivePowerMeasured: number
  apparentPowerMeasured: number
  activePowerPlate: number
  reactivePowerPlate: number
  apparentPowerPlate: number
  cosFiMeasured: number
  cosFiPlate: number
  activeDeviation: number
  reactiveDeviation: number
  apparentDeviation: number
}
