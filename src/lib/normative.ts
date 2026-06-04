// Normative Validation Engine - EDESA (Salta) & AEA (Argentina)
// Based on real Argentine electrical standards

export interface NormativeValidation {
  passed: boolean
  rule: string
  source: string
  severity: 'error' | 'warning' | 'info'
  message: string
  value?: string
  expected?: string
}

// EDESA Standards for Salta region
const EDESA_RULES = {
  // Voltage tolerances (IRAM 2071 / EDESA)
  voltage: {
    nominal220: { min: 198, max: 242, rule: 'IRAM 2071', desc: 'Tensión monofásica 220V ±10%' },
    nominal380: { min: 342, max: 418, rule: 'IRAM 2071', desc: 'Tensión trifásica 380V ±10%' },
    imbalance: { maxPercent: 2, rule: 'EDESA NT', desc: 'Desbalance de tensión entre fases ≤2%' },
  },
  // Grounding (AEA 90364 / IRAM 2281)
  grounding: {
    resistance: { max: 10, rule: 'IRAM 2281-3', desc: 'Resistencia de puesta a tierra ≤10Ω' },
    conductorSection: { min: 16, rule: 'AEA 90364', desc: 'Sección mínima conductor de protección 16mm²' },
  },
  // Current (IRAM 2069)
  current: {
    overloadFactor: 1.25, rule: 'IRAM 2069', desc: 'Factor de sobrecarga 1.25x para protección',
  },
  // Insulation (IRAM 2413)
  insulation: {
    motorMin: 1, rule: 'IRAM 2413', desc: 'Aislamiento mínimo motor 1MΩ por kV de operación',
    panelMin: 0.5, rule: 'IRAM 2413', desc: 'Aislamiento mínimo tablero 0.5MΩ',
  },
  // Torque
  torque: {
    minBornera: 1.2, maxBornera: 2.5, rule: 'EDESA NT', desc: 'Torque borneras 1.2-2.5 Nm según sección',
  },
  // Conductors
  conductors: {
    phaseColors: ['rojo', 'marrón', 'negro'], rule: 'AEA 90364', desc: 'Colores de fases: rojo/marrón/negro',
    neutralColor: 'celeste', rule: 'AEA 90364', desc: 'Color del neutro: celeste',
    groundColor: 'verde-amarillo', rule: 'AEA 90364', desc: 'Color de tierra: verde-amarillo',
  },
  // Motor
  motor: {
    coilImbalance: 5, rule: 'IRAM 62271', desc: 'Desbalance entre bobinas ≤5%',
    cosFiMin: 0.85, rule: 'EDESA NT', desc: 'Factor de potencia mínimo 0.85',
    serviceFactorMax: 1.15, rule: 'IRAM 62271', desc: 'Factor de servicio máximo 1.15',
  }
}

// AEA 90364 Key Rules
const AEA_RULES = {
  // Safety
  safety: {
    fiveGoldenRules: true, rule: 'AEA 90364 Secc. 41', desc: 'Las 5 reglas de oro son obligatorias antes de trabajar',
    epp: true, rule: 'AEA 90364 Secc. 42', desc: 'EPP obligatorio según tipo de trabajo',
    delimitation: true, rule: 'AEA 90364 Secc. 43', desc: 'Delimitación de zona de trabajo obligatoria',
  },
  // Panel requirements
  panel: {
    identification: true, rule: 'AEA 90364 Secc. 51', desc: 'Identificación de circuitos obligatoria',
    thermalMagnetic: true, rule: 'AEA 90364 Secc. 52', desc: 'Protección termomagnética por circuito',
    differential: true, rule: 'AEA 90364 Secc. 53', desc: 'Protección diferencial ≤30mA en circuitos generales',
    groundingBar: true, rule: 'AEA 90364 Secc. 54', desc: 'Barra de puesta a tierra independiente',
    neutralBar: true, rule: 'AEA 90364 Secc. 55', desc: 'Barra de neutro separada',
  },
  // Motor requirements
  motor: {
    protection: true, rule: 'AEA 90364 Secc. 61', desc: 'Protección termomagnética y diferencial',
    thermalRelay: true, rule: 'AEA 90364 Secc. 62', desc: 'Relé térmico de protección',
    command: true, rule: 'AEA 90364 Secc. 63', desc: 'Circuito de comando con seccionador',
    signaling: true, rule: 'AEA 90364 Secc. 64', desc: 'Señalización de estado (marcha/parada/alarma)',
  }
}

// Validate voltage measurements
export function validateVoltage(
  phase: string,
  measuredVoltage: number,
  isThreePhase: boolean = false
): NormativeValidation {
  const rule = isThreePhase ? EDESA_RULES.voltage.nominal380 : EDESA_RULES.voltage.nominal220
  const passed = measuredVoltage >= rule.min && measuredVoltage <= rule.max

  return {
    passed,
    rule: rule.rule,
    source: 'EDESA',
    severity: passed ? 'info' : 'error',
    message: passed
      ? `Tensión ${phase} dentro de rango (${rule.min}-${rule.max}V)`
      : `Tensión ${phase} FUERA de rango (${rule.min}-${rule.max}V). ${rule.desc}`,
    value: `${measuredVoltage}V`,
    expected: `${rule.min}-${rule.max}V`
  }
}

// Validate grounding resistance
export function validateGrounding(resistance: number): NormativeValidation {
  const rule = EDESA_RULES.grounding.resistance
  const passed = resistance <= rule.max

  return {
    passed,
    rule: rule.rule,
    source: 'IRAM 2281',
    severity: passed ? 'info' : 'error',
    message: passed
      ? `Resistencia de puesta a tierra OK (≤${rule.max}Ω)`
      : `Resistencia de puesta a tierra EXCEDIDA (máx ${rule.max}Ω). ${rule.desc}`,
    value: `${resistance}Ω`,
    expected: `≤${rule.max}Ω`
  }
}

// Validate insulation resistance
export function validateInsulation(resistance: number, isMotor: boolean = false): NormativeValidation {
  const rule = isMotor ? EDESA_RULES.insulation.motorMin : EDESA_RULES.insulation.panelMin
  const passed = resistance >= rule

  return {
    passed,
    rule: rule.rule,
    source: 'IRAM 2413',
    severity: passed ? 'info' : 'error',
    message: passed
      ? `Aislamiento OK (≥${rule}MΩ)`
      : `Aislamiento INSUFICIENTE (mín ${rule}MΩ). ${isMotor ? EDESA_RULES.insulation.motorMin.desc : EDESA_RULES.insulation.panelMin.desc}`,
    value: `${resistance}MΩ`,
    expected: `≥${rule}MΩ`
  }
}

// Validate coil resistance balance
export function validateCoilBalance(r1: number, r2: number, r3: number): NormativeValidation {
  const avg = (r1 + r2 + r3) / 3
  const maxDeviation = Math.max(
    Math.abs(r1 - avg) / avg * 100,
    Math.abs(r2 - avg) / avg * 100,
    Math.abs(r3 - avg) / avg * 100
  )
  const rule = EDESA_RULES.motor.coilImbalance
  const passed = maxDeviation <= rule

  return {
    passed,
    rule: rule.rule,
    source: 'IRAM 62271',
    severity: passed ? 'info' : 'warning',
    message: passed
      ? `Balance de bobinas OK (desviación ${maxDeviation.toFixed(1)}% ≤ ${rule}%)`
      : `Desbalance de bobinas EXCEDIDO (${maxDeviation.toFixed(1)}% > ${rule}%). ${rule.desc}`,
    value: `${maxDeviation.toFixed(1)}%`,
    expected: `≤${rule}%`
  }
}

// Validate power factor
export function validatePowerFactor(cosFi: number): NormativeValidation {
  const rule = EDESA_RULES.motor.cosFiMin
  const passed = cosFi >= rule

  return {
    passed,
    rule: rule.rule,
    source: 'EDESA',
    severity: passed ? 'info' : 'warning',
    message: passed
      ? `Factor de potencia OK (cos φ = ${cosFi.toFixed(2)} ≥ ${rule})`
      : `Factor de potencia BAJO (cos φ = ${cosFi.toFixed(2)} < ${rule}). ${rule.desc}`,
    value: cosFi.toFixed(2),
    expected: `≥${rule}`
  }
}

// Validate torque value
export function validateTorque(torque: number): NormativeValidation {
  const rule = EDESA_RULES.torque
  const passed = torque >= rule.minBornera && torque <= rule.maxBornera

  return {
    passed,
    rule: rule.rule,
    source: 'EDESA NT',
    severity: passed ? 'info' : 'warning',
    message: passed
      ? `Torque de bornera OK (${rule.minBornera}-${rule.maxBornera} Nm)`
      : `Torque de bornera fuera de rango (${rule.minBornera}-${rule.maxBornera} Nm). ${rule.desc}`,
    value: `${torque}Nm`,
    expected: `${rule.minBornera}-${rule.maxBornera}Nm`
  }
}

// Auto-detect safety violations
export function validateSafetyCompletion(
  steps: Array<{ step: string; tecnicoCompleted: boolean; auditorValidated: boolean }>
): NormativeValidation[] {
  const validations: NormativeValidation[] = []

  // Check all 5 golden rules are completed
  const allTecnicoCompleted = steps.every(s => s.tecnicoCompleted)
  const allAuditorValidated = steps.every(s => s.auditorValidated)

  if (!allTecnicoCompleted) {
    const incompleteSteps = steps.filter(s => !s.tecnicoCompleted)
    validations.push({
      passed: false,
      rule: 'AEA 90364 Secc. 41',
      source: 'AEA',
      severity: 'error',
      message: `REGLAS DE ORO INCOMPLETAS. Pasos faltantes: ${incompleteSteps.map(s => s.step).join(', ')}. NO se puede avanzar sin completar las 5 reglas de oro.`,
    })
  }

  if (!allAuditorValidated) {
    validations.push({
      passed: false,
      rule: 'AEA 90364 Secc. 42',
      source: 'AEA',
      severity: 'error',
      message: 'AUDITORÍA DE SEGURIDAD INCOMPLETA. El Auditor debe validar todos los pasos de seguridad.',
    })
  }

  if (allTecnicoCompleted && allAuditorValidated) {
    validations.push({
      passed: true,
      rule: 'AEA 90364 Secc. 41',
      source: 'AEA',
      severity: 'info',
      message: 'Seguridad verificada. Las 5 reglas de oro han sido cumplidas y validadas.',
    })
  }

  return validations
}

// Generate audit observations for auditor
export function generateAuditorSuggestions(
  category: string,
  step: string,
  value: string | null,
  tecnicoCompleted: boolean,
  auditorValidated: boolean
): string[] {
  const suggestions: string[] = []

  if (!tecnicoCompleted && !value) {
    suggestions.push(`El técnico no ha completado el paso "${step}". Verificar si se omitió por error.`)
  }

  if (tecnicoCompleted && !auditorValidated) {
    suggestions.push(`Paso "${step}" completado por técnico pero pendiente de validación del auditor.`)
  }

  // Category-specific suggestions
  if (category === 'panel') {
    if (step === 'voltage' && value) {
      const v = parseFloat(value)
      if (v < 198 || v > 242) {
        suggestions.push(`ALERTA: Tensión fuera de rango normativo (198-242V). Verificar condición de suministro EDESA.`)
      }
    }
    if (step === 'grounding' && value) {
      const r = parseFloat(value)
      if (r > 10) {
        suggestions.push(`ALERTA: Resistencia de tierra excedida (>10Ω). Sugerir mejoría de puesta a tierra según IRAM 2281.`)
      }
    }
    if (step === 'torque' && value) {
      const t = parseFloat(value)
      if (t < 1.2 || t > 2.5) {
        suggestions.push(`ALERTA: Torque fuera de especificación (1.2-2.5 Nm). Riesgo de conexión floja o daño en bornera.`)
      }
    }
  }

  if (category === 'motor') {
    if (step === 'insulation' && value) {
      const r = parseFloat(value)
      if (r < 1) {
        suggestions.push(`ALERTA: Aislamiento insuficiente (<1MΩ). NO poner en servicio. Verificar humedad o deterioro de bobinas.`)
      }
    }
    if (step === 'power_cosfi' && value) {
      const cf = parseFloat(value)
      if (cf < 0.85) {
        suggestions.push(`ALERTA: Factor de potencia bajo (<0.85). Sugerir instalación de bancos de capacitores.`)
      }
    }
  }

  return suggestions
}

// Complete audit automatically if auditor has omissions
export function autoCompleteAudit(
  category: string,
  steps: Array<{ step: string; tecnicoCompleted: boolean; auditorValidated: boolean; value?: string | null }>
): Array<{ step: string; autoDetected: boolean; errors: string[]; omissions: string[] }> {
  const results: Array<{ step: string; autoDetected: boolean; errors: string[]; omissions: string[] }> = []

  for (const step of steps) {
    const errors: string[] = []
    const omissions: string[] = []

    if (!step.auditorValidated && step.tecnicoCompleted) {
      omissions.push(`Auditor no validó el paso "${step.step}"`)

      // Auto-validate based on normative
      if (step.value) {
        const numValue = parseFloat(step.value)
        if (!isNaN(numValue)) {
          if (category === 'panel') {
            if (step.step === 'voltage' && (numValue < 198 || numValue > 242)) {
              errors.push(`Tensión fuera de rango: ${numValue}V (rango: 198-242V)`)
            }
            if (step.step === 'grounding' && numValue > 10) {
              errors.push(`Resistencia de tierra excedida: ${numValue}Ω (máx: 10Ω)`)
            }
          }
          if (category === 'motor') {
            if (step.step === 'insulation' && numValue < 1) {
              errors.push(`Aislamiento insuficiente: ${numValue}MΩ (mín: 1MΩ)`)
            }
          }
        }
      }
    }

    if (!step.tecnicoCompleted) {
      omissions.push(`Técnico no completó el paso "${step.step}"`)
    }

    if (errors.length > 0 || omissions.length > 0) {
      results.push({
        step: step.step,
        autoDetected: true,
        errors,
        omissions,
      })
    }
  }

  return results
}

// Get all normative references for a category
export function getNormativeReferences(category: string): Array<{ code: string; description: string; source: string }> {
  const refs: Array<{ code: string; description: string; source: string }> = []

  if (category === 'safety') {
    Object.values(AEA_RULES.safety).forEach((rule: any) => {
      if (typeof rule === 'object' && rule.rule) {
        refs.push({ code: rule.rule, description: rule.desc, source: 'AEA' })
      }
    })
  }

  if (category === 'panel') {
    Object.values(AEA_RULES.panel).forEach((rule: any) => {
      if (typeof rule === 'object' && rule.rule) {
        refs.push({ code: rule.rule, description: rule.desc, source: 'AEA' })
      }
    })
    refs.push(
      { code: 'IRAM 2071', description: 'Tensiones nominales y tolerancias', source: 'IRAM' },
      { code: 'IRAM 2281-3', description: 'Puesta a tierra', source: 'IRAM' },
      { code: 'IRAM 2069', description: 'Protección contra sobrecorrientes', source: 'IRAM' },
    )
  }

  if (category === 'motor') {
    Object.values(AEA_RULES.motor).forEach((rule: any) => {
      if (typeof rule === 'object' && rule.rule) {
        refs.push({ code: rule.rule, description: rule.desc, source: 'AEA' })
      }
    })
    refs.push(
      { code: 'IRAM 2413', description: 'Aislamiento eléctrico', source: 'IRAM' },
      { code: 'IRAM 62271', description: 'Equipos de maniobra y protección', source: 'IRAM' },
    )
  }

  return refs
}
