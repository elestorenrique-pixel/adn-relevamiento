import { PrismaClient } from '@prisma/client'
import { DEFAULT_COSTS } from '../src/lib/costs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed cost items from DEFAULT_COSTS
  const allCosts = [
    ...DEFAULT_COSTS.labor,
    ...DEFAULT_COSTS.materials,
    ...DEFAULT_COSTS.corrections,
  ]

  console.log(`📦 Seeding ${allCosts.length} cost items...`)

  for (const cost of allCosts) {
    await prisma.costItem.upsert({
      where: { id: cost.id },
      update: {
        category: cost.category,
        description: cost.description,
        unit: cost.unit,
        unitPrice: cost.unitPrice,
        isActive: true,
      },
      create: {
        id: cost.id,
        category: cost.category,
        description: cost.description,
        unit: cost.unit,
        unitPrice: cost.unitPrice,
        isActive: true,
      },
    })
  }

  // Seed normative rules
  console.log('📜 Seeding normative rules...')

  const normativeRules = [
    // EDESA rules
    { source: 'EDESA', code: 'IRAM 2071', description: 'Tensión monofásica 220V ±10% (198-242V)', category: 'panel', validationType: 'range', minValue: '198', maxValue: '242', severity: 'error' },
    { source: 'EDESA', code: 'IRAM 2071', description: 'Tensión trifásica 380V ±10% (342-418V)', category: 'motor', validationType: 'range', minValue: '342', maxValue: '418', severity: 'error' },
    { source: 'EDESA', code: 'EDESA NT', description: 'Desbalance de tensión entre fases ≤2%', category: 'panel', validationType: 'range', maxValue: '2', severity: 'warning' },
    { source: 'IRAM', code: 'IRAM 2281-3', description: 'Resistencia de puesta a tierra ≤10Ω', category: 'panel', validationType: 'range', maxValue: '10', severity: 'error' },
    { source: 'IRAM', code: 'IRAM 2281-3', description: 'Sección mínima conductor de protección 16mm²', category: 'panel', validationType: 'required', requiredValue: '16', severity: 'error' },
    { source: 'IRAM', code: 'IRAM 2069', description: 'Factor de sobrecarga 1.25x para protección', category: 'panel', validationType: 'required', requiredValue: '1.25', severity: 'warning' },
    { source: 'IRAM', code: 'IRAM 2413', description: 'Aislamiento mínimo motor 1MΩ por kV de operación', category: 'motor', validationType: 'range', minValue: '1', severity: 'error' },
    { source: 'IRAM', code: 'IRAM 2413', description: 'Aislamiento mínimo tablero 0.5MΩ', category: 'panel', validationType: 'range', minValue: '0.5', severity: 'error' },
    { source: 'EDESA', code: 'EDESA NT', description: 'Torque borneras 1.2-2.5 Nm según sección', category: 'panel', validationType: 'range', minValue: '1.2', maxValue: '2.5', severity: 'warning' },
    { source: 'IRAM', code: 'IRAM 62271', description: 'Desbalance entre bobinas ≤5%', category: 'motor', validationType: 'range', maxValue: '5', severity: 'warning' },
    { source: 'EDESA', code: 'EDESA NT', description: 'Factor de potencia mínimo 0.85', category: 'motor', validationType: 'range', minValue: '0.85', severity: 'warning' },
    { source: 'IRAM', code: 'IRAM 62271', description: 'Factor de servicio máximo 1.15', category: 'motor', validationType: 'range', maxValue: '1.15', severity: 'warning' },
    // AEA rules
    { source: 'AEA', code: 'AEA 90364 Secc. 41', description: 'Las 5 reglas de oro son obligatorias antes de trabajar', category: 'safety', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 42', description: 'EPP obligatorio según tipo de trabajo', category: 'safety', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 43', description: 'Delimitación de zona de trabajo obligatoria', category: 'safety', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 51', description: 'Identificación de circuitos obligatoria', category: 'panel', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 52', description: 'Protección termomagnética por circuito', category: 'panel', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 53', description: 'Protección diferencial ≤30mA en circuitos generales', category: 'panel', validationType: 'required', requiredValue: '30', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 54', description: 'Barra de puesta a tierra independiente', category: 'panel', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 55', description: 'Barra de neutro separada', category: 'panel', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 61', description: 'Protección termomagnética y diferencial para motor', category: 'motor', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 62', description: 'Relé térmico de protección', category: 'motor', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 63', description: 'Circuito de comando con seccionador', category: 'motor', validationType: 'required', requiredValue: 'true', severity: 'error' },
    { source: 'AEA', code: 'AEA 90364 Secc. 64', description: 'Señalización de estado (marcha/parada/alarma)', category: 'motor', validationType: 'required', requiredValue: 'true', severity: 'error' },
    // General
    { source: 'AEA', code: 'AEA 90364', description: 'Colores de fases: rojo/marrón/negro', category: 'general', validationType: 'required', requiredValue: 'rojo,marrón,negro', severity: 'warning' },
    { source: 'AEA', code: 'AEA 90364', description: 'Color del neutro: celeste', category: 'general', validationType: 'required', requiredValue: 'celeste', severity: 'warning' },
    { source: 'AEA', code: 'AEA 90364', description: 'Color de tierra: verde-amarillo', category: 'general', validationType: 'required', requiredValue: 'verde-amarillo', severity: 'warning' },
  ]

  for (const rule of normativeRules) {
    await prisma.normativeRule.create({
      data: rule,
    })
  }

  console.log('✅ Seeding completed!')
  console.log(`  - ${allCosts.length} cost items seeded`)
  console.log(`  - ${normativeRules.length} normative rules seeded`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
