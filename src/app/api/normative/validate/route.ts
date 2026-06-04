import { NextRequest, NextResponse } from 'next/server'
import { validateVoltage, validateGrounding, validateInsulation, validateCoilBalance, validatePowerFactor, validateTorque } from '@/lib/normative'

// POST /api/normative/validate - Validate a measurement against normative rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, value, additionalParams } = body

    if (!type || value === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: type, value' },
        { status: 400 }
      )
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return NextResponse.json(
        { error: 'El valor debe ser numérico' },
        { status: 400 }
      )
    }

    let validation

    switch (type) {
      case 'voltage': {
        const isThreePhase = additionalParams?.isThreePhase ?? false
        const phase = additionalParams?.phase ?? 'medida'
        validation = validateVoltage(phase, numValue, isThreePhase)
        break
      }
      case 'grounding':
        validation = validateGrounding(numValue)
        break
      case 'insulation': {
        const isMotor = additionalParams?.isMotor ?? false
        validation = validateInsulation(numValue, isMotor)
        break
      }
      case 'coil_balance': {
        const r1 = additionalParams?.r1
        const r2 = additionalParams?.r2
        const r3 = additionalParams?.r3
        if (!r1 || !r2 || !r3) {
          return NextResponse.json(
            { error: 'Se requieren r1, r2, r3 para validación de bobinas' },
            { status: 400 }
          )
        }
        validation = validateCoilBalance(parseFloat(r1), parseFloat(r2), parseFloat(r3))
        break
      }
      case 'power_factor':
        validation = validatePowerFactor(numValue)
        break
      case 'torque':
        validation = validateTorque(numValue)
        break
      default:
        return NextResponse.json(
          { error: `Tipo de validación no reconocido: ${type}. Tipos válidos: voltage, grounding, insulation, coil_balance, power_factor, torque` },
          { status: 400 }
        )
    }

    return NextResponse.json(validation)
  } catch (error) {
    console.error('Validate normative error:', error)
    return NextResponse.json(
      { error: 'Error al validar contra normativa' },
      { status: 500 }
    )
  }
}
