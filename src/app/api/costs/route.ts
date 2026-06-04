import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBudget, DEFAULT_COSTS } from '@/lib/costs'

// GET /api/costs - Get all cost items
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')

    const where: Record<string, string> = {}
    if (category) where.category = category

    const costItems = await db.costItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(costItems)
  } catch (error) {
    console.error('Get cost items error:', error)
    return NextResponse.json(
      { error: 'Error al obtener ítems de costo' },
      { status: 500 }
    )
  }
}

// POST /api/costs - Add/update cost item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, category, description, unit, unitPrice, isActive } = body

    if (!category || !description || !unit || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: category, description, unit, unitPrice' },
        { status: 400 }
      )
    }

    if (!['mano_obra', 'material', 'correccion'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida. Debe ser: mano_obra, material, correccion' },
        { status: 400 }
      )
    }

    if (id) {
      // Update existing cost item
      const updated = await db.costItem.update({
        where: { id },
        data: {
          category,
          description,
          unit,
          unitPrice,
          isActive: isActive ?? true,
        },
      })
      return NextResponse.json(updated)
    }

    // Create new cost item
    const costItem = await db.costItem.create({
      data: {
        category,
        description,
        unit,
        unitPrice,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(costItem, { status: 201 })
  } catch (error) {
    console.error('Add/update cost item error:', error)
    return NextResponse.json(
      { error: 'Error al agregar/actualizar ítem de costo' },
      { status: 500 }
    )
  }
}
