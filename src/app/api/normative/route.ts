import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateVoltage, validateGrounding, validateInsulation, validateCoilBalance, validatePowerFactor, validateTorque } from '@/lib/normative'

// GET /api/normative - Get normative rules (query by source and category)
export async function GET(request: NextRequest) {
  try {
    const source = request.nextUrl.searchParams.get('source')
    const category = request.nextUrl.searchParams.get('category')

    const where: Record<string, string> = {}
    if (source) where.source = source
    if (category) where.category = category

    const rules = await db.normativeRule.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Get normative rules error:', error)
    return NextResponse.json(
      { error: 'Error al obtener reglas normativas' },
      { status: 500 }
    )
  }
}

// POST /api/normative - Create a normative rule (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source, code, description, category, validationType, minValue, maxValue, requiredValue, severity } = body

    if (!source || !code || !description || !category || !validationType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: source, code, description, category, validationType' },
        { status: 400 }
      )
    }

    const rule = await db.normativeRule.create({
      data: {
        source,
        code,
        description,
        category,
        validationType,
        minValue: minValue ?? null,
        maxValue: maxValue ?? null,
        requiredValue: requiredValue ?? null,
        severity: severity ?? 'error',
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('Create normative rule error:', error)
    return NextResponse.json(
      { error: 'Error al crear regla normativa' },
      { status: 500 }
    )
  }
}
