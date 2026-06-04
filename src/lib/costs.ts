// Cost Engine - Configurable pricing for Salta region (Argentina)
// Prices in Argentine Pesos (ARS)

export interface CostCalculation {
  category: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
}

export interface BudgetResult {
  labor: CostCalculation[]
  materials: CostCalculation[]
  corrections: CostCalculation[]
  laborTotal: number
  materialsTotal: number
  correctionsTotal: number
  grandTotal: number
}

// Default cost items for Salta region (approximate values in ARS)
export const DEFAULT_COSTS = {
  // Labor (mano de obra)
  labor: [
    { id: 'l1', category: 'mano_obra', description: 'Relevamiento de tablero eléctrico', unit: 'hora', unitPrice: 15000 },
    { id: 'l2', category: 'mano_obra', description: 'Relevamiento de motor eléctrico', unit: 'hora', unitPrice: 15000 },
    { id: 'l3', category: 'mano_obra', description: 'Verificación de puesta a tierra', unit: 'hora', unitPrice: 12000 },
    { id: 'l4', category: 'mano_obra', description: 'Medición de aislamiento', unit: 'hora', unitPrice: 12000 },
    { id: 'l5', category: 'mano_obra', description: 'Ajuste de torque en borneras', unit: 'unidad', unitPrice: 5000 },
    { id: 'l6', category: 'mano_obra', description: 'Corrección de conexiones', unit: 'hora', unitPrice: 18000 },
    { id: 'l7', category: 'mano_obra', description: 'Reemplazo de protecciones', unit: 'unidad', unitPrice: 10000 },
    { id: 'l8', category: 'mano_obra', description: 'Mejora de puesta a tierra', unit: 'hora', unitPrice: 20000 },
    { id: 'l9', category: 'mano_obra', description: 'Instalación de capacitor', unit: 'unidad', unitPrice: 25000 },
    { id: 'l10', category: 'mano_obra', description: 'Auditoría eléctrica completa', unit: 'hora', unitPrice: 18000 },
  ],
  // Materials
  materials: [
    { id: 'm1', category: 'material', description: 'Conductor de fase 2.5mm²', unit: 'metro', unitPrice: 2500 },
    { id: 'm2', category: 'material', description: 'Conductor de fase 4mm²', unit: 'metro', unitPrice: 3800 },
    { id: 'm3', category: 'material', description: 'Conductor de fase 6mm²', unit: 'metro', unitPrice: 5500 },
    { id: 'm4', category: 'material', description: 'Conductor de fase 10mm²', unit: 'metro', unitPrice: 9500 },
    { id: 'm5', category: 'material', description: 'Conductor neutro 2.5mm² celeste', unit: 'metro', unitPrice: 2500 },
    { id: 'm6', category: 'material', description: 'Conductor tierra 16mm² verde-amarillo', unit: 'metro', unitPrice: 12000 },
    { id: 'm7', category: 'material', description: 'Terminal de presión (categoría según sección)', unit: 'unidad', unitPrice: 1500 },
    { id: 'm8', category: 'material', description: 'Bornera de conexión', unit: 'unidad', unitPrice: 3500 },
    { id: 'm9', category: 'material', description: 'Disyuntor diferencial 2x25A 30mA', unit: 'unidad', unitPrice: 35000 },
    { id: 'm10', category: 'material', description: 'Termomagnético 2x10A', unit: 'unidad', unitPrice: 12000 },
    { id: 'm11', category: 'material', description: 'Termomagnético 2x16A', unit: 'unidad', unitPrice: 14000 },
    { id: 'm12', category: 'material', description: 'Termomagnético 2x20A', unit: 'unidad', unitPrice: 16000 },
    { id: 'm13', category: 'material', description: 'Termomagnético 3x25A', unit: 'unidad', unitPrice: 25000 },
    { id: 'm14', category: 'material', description: 'Barra de puesta a tierra cobre', unit: 'unidad', unitPrice: 18000 },
    { id: 'm15', category: 'material', description: 'Cable de puesta a tierra Cu 16mm²', unit: 'metro', unitPrice: 12000 },
    { id: 'm16', category: 'material', description: 'Banco de capacitores monofásico', unit: 'unidad', unitPrice: 65000 },
    { id: 'm17', category: 'material', description: 'Cinta aisladora', unit: 'rollo', unitPrice: 2500 },
    { id: 'm18', category: 'material', description: 'Funda termocontraíble', unit: 'metro', unitPrice: 1800 },
    { id: 'm19', category: 'material', description: 'Cartelería de seguridad', unit: 'juego', unitPrice: 8500 },
    { id: 'm20', category: 'material', description: 'Candado de seguridad', unit: 'unidad', unitPrice: 6000 },
  ],
  // Corrections (based on detected issues)
  corrections: [
    { id: 'c1', category: 'correccion', description: 'Corrección de tensión fuera de rango', unit: 'servicio', unitPrice: 25000 },
    { id: 'c2', category: 'correccion', description: 'Mejora de puesta a tierra', unit: 'servicio', unitPrice: 45000 },
    { id: 'c3', category: 'correccion', description: 'Reemplazo de conductores no normativos', unit: 'metro', unitPrice: 5000 },
    { id: 'c4', category: 'correccion', description: 'Reconexión de circuitos', unit: 'circuito', unitPrice: 15000 },
    { id: 'c5', category: 'correccion', description: 'Instalación de protección diferencial faltante', unit: 'unidad', unitPrice: 40000 },
    { id: 'c6', category: 'correccion', description: 'Corrección de identificación de circuitos', unit: 'circuito', unitPrice: 5000 },
    { id: 'c7', category: 'correccion', description: 'Corrección de aislamiento de motor', unit: 'servicio', unitPrice: 55000 },
    { id: 'c8', category: 'correccion', description: 'Corrección de factor de potencia', unit: 'servicio', unitPrice: 70000 },
    { id: 'c9', category: 'correccion', description: 'Reemplazo de borneras defectuosas', unit: 'unidad', unitPrice: 8000 },
    { id: 'c10', category: 'correccion', description: 'Ajuste de torque en conexiones', unit: 'punto', unitPrice: 3000 },
  ],
}

// Calculate budget based on detected issues and measurements
export function calculateBudget(
  panelChecks: Array<{ step: string; normativeStatus: string; tecnicoValue?: string | null }>,
  motorChecks: Array<{ step: string; normativeStatus: string; tecnicoValue?: string | null }>,
  safetyChecks: Array<{ step: string; tecnicoCompleted: boolean; auditorValidated: boolean }>
): BudgetResult {
  const labor: CostCalculation[] = []
  const materials: CostCalculation[] = []
  const corrections: CostCalculation[] = []

  // Base labor: always include survey and audit time
  labor.push({
    category: 'mano_obra',
    description: 'Relevamiento de tablero eléctrico',
    quantity: 2,
    unit: 'hora',
    unitPrice: DEFAULT_COSTS.labor[0].unitPrice,
    subtotal: DEFAULT_COSTS.labor[0].unitPrice * 2,
  })

  labor.push({
    category: 'mano_obra',
    description: 'Relevamiento de motor eléctrico',
    quantity: 1.5,
    unit: 'hora',
    unitPrice: DEFAULT_COSTS.labor[1].unitPrice,
    subtotal: DEFAULT_COSTS.labor[1].unitPrice * 1.5,
  })

  labor.push({
    category: 'mano_obra',
    description: 'Auditoría eléctrica completa',
    quantity: 2,
    unit: 'hora',
    unitPrice: DEFAULT_COSTS.labor[9].unitPrice,
    subtotal: DEFAULT_COSTS.labor[9].unitPrice * 2,
  })

  // Check for issues in panel
  for (const check of panelChecks) {
    if (check.normativeStatus === 'failed') {
      switch (check.step) {
        case 'voltage':
          corrections.push({
            category: 'correccion',
            description: 'Corrección de tensión fuera de rango',
            quantity: 1,
            unit: 'servicio',
            unitPrice: DEFAULT_COSTS.corrections[0].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[0].unitPrice,
          })
          break
        case 'grounding':
          corrections.push({
            category: 'correccion',
            description: 'Mejora de puesta a tierra',
            quantity: 1,
            unit: 'servicio',
            unitPrice: DEFAULT_COSTS.corrections[1].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[1].unitPrice,
          })
          materials.push({
            category: 'material',
            description: 'Barra de puesta a tierra cobre',
            quantity: 1,
            unit: 'unidad',
            unitPrice: DEFAULT_COSTS.materials[13].unitPrice,
            subtotal: DEFAULT_COSTS.materials[13].unitPrice,
          })
          materials.push({
            category: 'material',
            description: 'Cable de puesta a tierra Cu 16mm²',
            quantity: 5,
            unit: 'metro',
            unitPrice: DEFAULT_COSTS.materials[14].unitPrice,
            subtotal: DEFAULT_COSTS.materials[14].unitPrice * 5,
          })
          break
        case 'conductors':
          corrections.push({
            category: 'correccion',
            description: 'Reemplazo de conductores no normativos',
            quantity: 10,
            unit: 'metro',
            unitPrice: DEFAULT_COSTS.corrections[2].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[2].unitPrice * 10,
          })
          break
        case 'distribution':
          corrections.push({
            category: 'correccion',
            description: 'Reconexión de circuitos',
            quantity: 1,
            unit: 'circuito',
            unitPrice: DEFAULT_COSTS.corrections[3].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[3].unitPrice,
          })
          break
        case 'terminals':
          corrections.push({
            category: 'correccion',
            description: 'Reemplazo de borneras defectuosas',
            quantity: 3,
            unit: 'unidad',
            unitPrice: DEFAULT_COSTS.corrections[8].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[8].unitPrice * 3,
          })
          break
        case 'torque':
          corrections.push({
            category: 'correccion',
            description: 'Ajuste de torque en conexiones',
            quantity: 8,
            unit: 'punto',
            unitPrice: DEFAULT_COSTS.corrections[9].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[9].unitPrice * 8,
          })
          labor.push({
            category: 'mano_obra',
            description: 'Ajuste de torque en borneras',
            quantity: 1,
            unit: 'unidad',
            unitPrice: DEFAULT_COSTS.labor[4].unitPrice,
            subtotal: DEFAULT_COSTS.labor[4].unitPrice,
          })
          break
      }
    }
  }

  // Check for issues in motor
  for (const check of motorChecks) {
    if (check.normativeStatus === 'failed') {
      switch (check.step) {
        case 'insulation':
          corrections.push({
            category: 'correccion',
            description: 'Corrección de aislamiento de motor',
            quantity: 1,
            unit: 'servicio',
            unitPrice: DEFAULT_COSTS.corrections[6].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[6].unitPrice,
          })
          break
        case 'power_cosfi':
          corrections.push({
            category: 'correccion',
            description: 'Corrección de factor de potencia',
            quantity: 1,
            unit: 'servicio',
            unitPrice: DEFAULT_COSTS.corrections[7].unitPrice,
            subtotal: DEFAULT_COSTS.corrections[7].unitPrice,
          })
          materials.push({
            category: 'material',
            description: 'Banco de capacitores monofásico',
            quantity: 1,
            unit: 'unidad',
            unitPrice: DEFAULT_COSTS.materials[15].unitPrice,
            subtotal: DEFAULT_COSTS.materials[15].unitPrice,
          })
          labor.push({
            category: 'mano_obra',
            description: 'Instalación de capacitor',
            quantity: 1,
            unit: 'unidad',
            unitPrice: DEFAULT_COSTS.labor[8].unitPrice,
            subtotal: DEFAULT_COSTS.labor[8].unitPrice,
          })
          break
      }
    }
  }

  // Basic materials for any job
  materials.push({
    category: 'material',
    description: 'Cinta aisladora',
    quantity: 2,
    unit: 'rollo',
    unitPrice: DEFAULT_COSTS.materials[16].unitPrice,
    subtotal: DEFAULT_COSTS.materials[16].unitPrice * 2,
  })

  materials.push({
    category: 'material',
    description: 'Funda termocontraíble',
    quantity: 2,
    unit: 'metro',
    unitPrice: DEFAULT_COSTS.materials[17].unitPrice,
    subtotal: DEFAULT_COSTS.materials[17].unitPrice * 2,
  })

  // Safety materials
  const hasSafetyIssues = safetyChecks.some(s => !s.auditorValidated)
  if (hasSafetyIssues) {
    materials.push({
      category: 'material',
      description: 'Cartelería de seguridad',
      quantity: 1,
      unit: 'juego',
      unitPrice: DEFAULT_COSTS.materials[18].unitPrice,
      subtotal: DEFAULT_COSTS.materials[18].unitPrice,
    })
    materials.push({
      category: 'material',
      description: 'Candado de seguridad',
      quantity: 2,
      unit: 'unidad',
      unitPrice: DEFAULT_COSTS.materials[19].unitPrice,
      subtotal: DEFAULT_COSTS.materials[19].unitPrice * 2,
    })
  }

  const laborTotal = labor.reduce((sum, item) => sum + item.subtotal, 0)
  const materialsTotal = materials.reduce((sum, item) => sum + item.subtotal, 0)
  const correctionsTotal = corrections.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    labor,
    materials,
    corrections,
    laborTotal,
    materialsTotal,
    correctionsTotal,
    grandTotal: laborTotal + materialsTotal + correctionsTotal,
  }
}

// Format currency in ARS
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
