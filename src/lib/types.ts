// Core types for ADN Técnico - Industrial Electrical Simulation

export type UserRole = 'tecnico' | 'auditor'

export type SessionStatus = 'lobby' | 'safety' | 'panel' | 'motor' | 'analysis' | 'completed'

export type SessionStage = 'safety' | 'panel' | 'motor' | 'analysis'

export type NormativeStatus = 'pending' | 'passed' | 'failed'

export type Severity = 'error' | 'warning' | 'info'

// System type: monofásico (220V) or trifásico (380V)
export type SystemType = 'monofasico' | 'trifasico'

// Safety steps - 5 Golden Rules
export const SAFETY_STEPS = [
  { id: 'identify', label: 'Identificar', description: 'Identificar la instalación / equipo sobre el que se va a trabajar', order: 1 },
  { id: 'verify_zero', label: 'Verificar Ausencia de Tensión', description: 'Verificar la ausencia de tensión con equipo adecuado (detector de tensión)', order: 2 },
  { id: 'grounding', label: 'Puesta a Tierra', description: 'Colocar puesta a tierra y en cortocircuito las fases del circuito', order: 3 },
  { id: 'block', label: 'Bloqueo / Señalización', description: 'Bloquear los dispositivos de corte y colocar señalización de seguridad', order: 4 },
  { id: 'signal', label: 'Delimitar Zona de Trabajo', description: 'Delimitar la zona de trabajo y colocar carteles de advertencia', order: 5 },
] as const

// Panel check steps — supports monofásico and trifásico
// For monofásico: voltage L-N (220V), single phase current
// For trifásico: voltages L-L (380V) and L-N (220V), phase currents + neutral
export const PANEL_STEPS_MONOFASICO = [
  { id: 'voltage_ln', label: 'Tensión L-N', description: 'Medir tensión fase-neutro (220V nominal)', unit: 'V', order: 1 },
  { id: 'current_phase', label: 'Corriente de Fase', description: 'Medir corriente en la fase (A)', unit: 'A', order: 2 },
  { id: 'current_neutral', label: 'Corriente de Neutro', description: 'Medir corriente de neutro (A)', unit: 'A', order: 3 },
  { id: 'conductors', label: 'Identificar Conductores', description: 'Identificar conductores (fase, neutro, tierra) — colores según AEA 90364', unit: '', order: 4 },
  { id: 'distribution', label: 'Verificar Distribución', description: 'Verificar distribución de circuitos y protecciones termomagnéticas', unit: '', order: 5 },
  { id: 'differential', label: 'Protección Diferencial', description: 'Verificar disyuntor diferencial (≤30mA)', unit: '', order: 6 },
  { id: 'grounding', label: 'Control Puesta a Tierra', description: 'Medir resistencia de puesta a tierra (Ω) — IRAM 2281', unit: 'Ω', order: 7 },
  { id: 'terminals', label: 'Verificar Terminales', description: 'Verificar estado de terminales y conexiones', unit: '', order: 8 },
  { id: 'torque', label: 'Ajustar Torque', description: 'Verificar y ajustar torque de borneras (Nm)', unit: 'Nm', order: 9 },
] as const

export const PANEL_STEPS_TRIFASICO = [
  { id: 'voltage_ln', label: 'Tensión L-N', description: 'Medir tensión fase-neutro (220V nominal)', unit: 'V', order: 1 },
  { id: 'voltage_ll', label: 'Tensión L-L', description: 'Medir tensión entre fases (380V nominal)', unit: 'V', order: 2 },
  { id: 'voltage_imbalance', label: 'Desbalance de Tensión', description: 'Verificar desbalance entre fases (≤2% EDESA)', unit: '%', order: 3 },
  { id: 'current_r', label: 'Corriente Fase R', description: 'Medir corriente en fase R (A)', unit: 'A', order: 4 },
  { id: 'current_s', label: 'Corriente Fase S', description: 'Medir corriente en fase S (A)', unit: 'A', order: 5 },
  { id: 'current_t', label: 'Corriente Fase T', description: 'Medir corriente en fase T (A)', unit: 'A', order: 6 },
  { id: 'current_neutral', label: 'Corriente de Neutro', description: 'Medir corriente de neutro (A)', unit: 'A', order: 7 },
  { id: 'conductors', label: 'Identificar Conductores', description: 'Identificar conductores (R, S, T, neutro, tierra) — colores AEA 90364', unit: '', order: 8 },
  { id: 'distribution', label: 'Verificar Distribución', description: 'Verificar distribución de circuitos y protecciones termomagnéticas', unit: '', order: 9 },
  { id: 'differential', label: 'Protección Diferencial', description: 'Verificar disyuntor diferencial (≤30mA)', unit: '', order: 10 },
  { id: 'grounding', label: 'Control Puesta a Tierra', description: 'Medir resistencia de puesta a tierra (Ω) — IRAM 2281', unit: 'Ω', order: 11 },
  { id: 'terminals', label: 'Verificar Terminales', description: 'Verificar estado de terminales y conexiones', unit: '', order: 12 },
  { id: 'torque', label: 'Ajustar Torque', description: 'Verificar y ajustar torque de borneras (Nm)', unit: 'Nm', order: 13 },
] as const

// Backward-compatible alias (defaults to monofásico)
export const PANEL_STEPS = PANEL_STEPS_MONOFASICO

// Motor check steps — monofásico and trifásico
export const MOTOR_STEPS_MONOFASICO = [
  { id: 'voltage', label: 'Tensión en Bornes', description: 'Medir tensión en bornes del motor monofásico (220V)', unit: 'V', order: 1 },
  { id: 'current', label: 'Corriente de Trabajo', description: 'Medir corriente de trabajo del motor (A)', unit: 'A', order: 2 },
  { id: 'current_start', label: 'Corriente de Arranque', description: 'Medir corriente de arranque (A)', unit: 'A', order: 3 },
  { id: 'coil_resistance', label: 'Resistencia de Bobinas', description: 'Medir resistencia de bobinas (principal y auxiliar) (Ω)', unit: 'Ω', order: 4 },
  { id: 'insulation', label: 'Aislamiento (Bobina-Carcasa)', description: 'Medir resistencia de aislamiento bobina a carcasa (MΩ)', unit: 'MΩ', order: 5 },
  { id: 'nameplate', label: 'Lectura de Placa', description: 'Leer y registrar datos de placa del motor', unit: '', order: 6 },
  { id: 'power_cosfi', label: 'Potencia y Coseno φ', description: 'Identificar potencia activa y factor de potencia', unit: '', order: 7 },
] as const

export const MOTOR_STEPS_TRIFASICO = [
  { id: 'voltage_ln', label: 'Tensión L-N en Bornes', description: 'Medir tensión fase-neutro en bornes del motor (220V)', unit: 'V', order: 1 },
  { id: 'voltage_ll', label: 'Tensión L-L en Bornes', description: 'Medir tensión entre fases en bornes del motor (380V)', unit: 'V', order: 2 },
  { id: 'current_r', label: 'Corriente Fase R', description: 'Medir corriente en fase R (A)', unit: 'A', order: 3 },
  { id: 'current_s', label: 'Corriente Fase S', description: 'Medir corriente en fase S (A)', unit: 'A', order: 4 },
  { id: 'current_t', label: 'Corriente Fase T', description: 'Medir corriente en fase T (A)', unit: 'A', order: 5 },
  { id: 'coil_resistance', label: 'Resistencia de Bobinas', description: 'Medir resistencia de bobinas R1, R2, R3 (Ω)', unit: 'Ω', order: 6 },
  { id: 'insulation', label: 'Aislamiento (Bobina-Carcasa)', description: 'Medir resistencia de aislamiento bobina a carcasa (MΩ)', unit: 'MΩ', order: 7 },
  { id: 'nameplate', label: 'Lectura de Placa', description: 'Leer y registrar datos de placa del motor trifásico', unit: '', order: 8 },
  { id: 'power_cosfi', label: 'Potencia y Coseno φ', description: 'Identificar potencia activa y factor de potencia trifásico', unit: '', order: 9 },
] as const

// Backward-compatible alias (defaults to monofásico)
export const MOTOR_STEPS = MOTOR_STEPS_MONOFASICO

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
  systemType: SystemType    // monofasico | trifasico
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

// Motor nameplate data — supports monofásico and trifásico
export interface MotorNameplate {
  brand: string
  model: string
  powerHp: string
  powerKw: string
  voltage: string          // Monofásico: 220V | Trifásico: 220/380V
  current: string          // Monofásico: corriente nominal | Trifásico: corriente por fase
  frequency: string
  rpm: string
  cosFi: string
  serviceFactor: string
  insulation: string
  connection: string       // Monofásico: directo/capacitor | Trifásico: estrella/triángulo
  systemType: SystemType   // monofasico | trifasico
  voltage_ll?: string     // Solo trifásico: tensión entre fases (380V)
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
