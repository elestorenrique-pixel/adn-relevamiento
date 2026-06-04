import { z } from 'zod'

// ════════════════════════════════════════════════════════════
// AUTH VALIDATION
// ════════════════════════════════════════════════════════════
export const authSchemas = {
  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
  }),

  register: z.object({
    name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    role: z.enum(['tecnico', 'auditor'], { message: 'Rol inválido' }),
  }),
}

// ════════════════════════════════════════════════════════════
// MEASUREMENT VALIDATION - MONOFÁSICO
// ════════════════════════════════════════════════════════════
export const monofasicoSchemas = {
  voltage_ln: z.object({
    value: z.number().min(150, 'Tensión baja (<150V)').max(280, 'Tensión alta (>280V)'),
    unit: z.literal('V'),
  }).describe('220V ±15% = 187-253V'),

  current_phase: z.object({
    value: z.number().min(0, 'Corriente negativa').max(100, 'Corriente excesiva (>100A)'),
    unit: z.literal('A'),
  }),

  current_neutral: z.object({
    value: z.number().min(0).max(100),
    unit: z.literal('A'),
    notes: z.string().optional(),
  }).refine(
    (data) => data.value <= 10,
    { message: 'Corriente de neutro anormal (>10A) - revisar equilibrio', path: ['value'] }
  ),

  grounding_resistance: z.object({
    value: z.number().min(0.1, 'Resistencia muy baja').max(10, 'Resistencia excesiva (>10Ω)'),
    unit: z.literal('Ω'),
  }).describe('IRAM 2281: ≤10Ω recomendado'),

  torque: z.object({
    phase: z.enum(['L', 'N', 'T']),
    value: z.number().min(1, 'Torque insuficiente').max(20, 'Torque excesivo'),
    unit: z.literal('Nm'),
  }),
}

// ════════════════════════════════════════════════════════════
// MEASUREMENT VALIDATION - TRIFÁSICO
// ════════════════════════════════════════════════════════════
export const trifasicoSchemas = {
  voltage_ln: z.object({
    value: z.number().min(180, 'Tensión baja').max(260, 'Tensión alta'),
    unit: z.literal('V'),
  }).describe('220V ±10%'),

  voltage_ll: z.object({
    value: z.number().min(330, 'Tensión baja').max(415, 'Tensión alta'),
    unit: z.literal('V'),
  }).describe('380V ±10% = 342-418V'),

  voltage_imbalance: z.object({
    r: z.number().min(330).max(415),
    s: z.number().min(330).max(415),
    t: z.number().min(330).max(415),
    unit: z.literal('V'),
  }).refine(
    (data) => {
      const values = [data.r, data.s, data.t]
      const avg = values.reduce((a, b) => a + b) / 3
      const maxDiff = Math.max(...values.map(v => Math.abs(v - avg)))
      const imbalance = (maxDiff / avg) * 100
      return imbalance <= 2 // EDESA: ≤2%
    },
    { message: 'Desbalance de tensión >2% (ver EDESA)', path: ['r'] }
  ),

  current_phase: z.object({
    r: z.number().min(0).max(100),
    s: z.number().min(0).max(100),
    t: z.number().min(0).max(100),
    neutral: z.number().min(0).max(50),
    unit: z.literal('A'),
  }).refine(
    (data) => {
      const values = [data.r, data.s, data.t]
      const avg = values.reduce((a, b) => a + b) / 3
      const maxDiff = Math.max(...values.map(v => Math.abs(v - avg)))
      return maxDiff <= 0.1 * avg // ≤10% desvío
    },
    { message: 'Desbalance de corriente >10%', path: ['r'] }
  ),
}

// ════════════════════════════════════════════════════════════
// MOTOR VALIDATION
// ════════════════════════════════════════════════════════════
export const motorSchemas = {
  nameplate: z.object({
    power: z.number().min(0.1, 'Potencia no válida'),
    voltage: z.number().min(100, 'Voltaje no válido').max(500),
    current: z.number().min(0.1, 'Corriente no válida').max(200),
    frequency: z.number().refine(v => v === 50 || v === 60, 'Frecuencia debe ser 50 o 60 Hz'),
    rpm: z.number().min(0, 'RPM no válido').max(5000),
    frame: z.string().optional(),
  }),

  coil_resistance: z.object({
    phase_r: z.number().min(0.01, 'Resistencia muy baja').max(100, 'Resistencia muy alta'),
    phase_s: z.number().min(0.01).max(100),
    phase_t: z.number().min(0.01).max(100),
    unit: z.literal('Ω'),
  }).refine(
    (data) => {
      const values = [data.phase_r, data.phase_s, data.phase_t]
      const avg = values.reduce((a, b) => a + b) / 3
      const tolerance = 0.05 * avg // ±5% tolerance
      return values.every(v => Math.abs(v - avg) <= tolerance)
    },
    { message: 'Desvío de resistencia >5% entre fases', path: ['phase_r'] }
  ),

  insulation: z.object({
    phase_r: z.number().min(0.5, 'Aislamiento bajo (<0.5MΩ)').max(10000),
    phase_s: z.number().min(0.5).max(10000),
    phase_t: z.number().min(0.5).max(10000),
    unit: z.literal('MΩ'),
    temperature: z.number().optional().describe('Temperatura ambiente'),
  }),
}

// ════════════════════════════════════════════════════════════
// ANALYSIS VALIDATION
// ════════════════════════════════════════════════════════════
export const analysisSchemas = {
  power: z.object({
    active: z.number().min(0, 'Potencia activa negativa'),
    reactive: z.number().min(0, 'Potencia reactiva negativa'),
    apparent: z.number().min(0, 'Potencia aparente negativa'),
    power_factor: z.number().min(0.5, 'Factor de potencia bajo (<0.5)').max(1, 'Factor de potencia inválido'),
  }),

  comparison: z.object({
    measured: z.number(),
    nameplate: z.number(),
    tolerance: z.number().default(10).describe('% de tolerancia'),
  }).refine(
    (data) => {
      const diff = Math.abs(data.measured - data.nameplate) / data.nameplate * 100
      return diff <= data.tolerance
    },
    { message: 'Valor fuera de tolerancia especificada', path: ['measured'] }
  ),
}

// ════════════════════════════════════════════════════════════
// NORMATIVE VALIDATION
// ════════════════════════════════════════════════════════════
export const normativeSchemas = {
  safety_validation: z.object({
    safety_completed: z.boolean(),
    epp_complete: z.boolean(),
    zero_voltage_verified: z.boolean(),
    grounding_verified: z.boolean(),
  }).refine(
    (data) => data.safety_completed && data.epp_complete && data.zero_voltage_verified,
    { message: 'No se cumplen todos los requisitos de seguridad', path: ['safety_completed'] }
  ),

  grounding_check: z.object({
    resistance: z.number(),
  }).refine(
    (data) => data.resistance <= 10,
    { message: 'Resistencia puesta a tierra >10Ω (IRAM 2281)', path: ['resistance'] }
  ),

  circuit_breaker: z.object({
    differential: z.boolean(),
    current_rating: z.number(),
  }).refine(
    (data) => data.current_rating <= 30,
    { message: 'Disyuntor diferencial debe ser ≤30mA', path: ['current_rating'] }
  ),
}

// ════════════════════════════════════════════════════════════
// ERROR RESPONSE TYPES
// ════════════════════════════════════════════════════════════
export const validationErrorSchema = z.object({
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    value: z.any().optional(),
    expected: z.string().optional(),
  })),
})

export type ValidationError = z.infer<typeof validationErrorSchema>
