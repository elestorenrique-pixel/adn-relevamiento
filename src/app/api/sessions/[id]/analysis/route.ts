import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sessions/[id]/analysis - Get analysis data for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.session.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const analysisData = await db.analysisData.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(analysisData)
  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de análisis' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/analysis - Calculate and store power analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      // Measured values
      measuredVoltage,
      measuredCurrent,
      measuredCosFi,
      // Plate (nameplate) values
      plateVoltage,
      plateCurrent,
      plateCosFi,
      platePowerKw,
    } = body

    const session = await db.session.findUnique({
      where: { id },
      include: {
        panelChecks: { orderBy: { order: 'asc' } },
        motorChecks: { orderBy: { order: 'asc' } },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Get measured values from motor checks if not provided directly
    const motorVoltage = measuredVoltage ?? session.motorChecks.find(c => c.step === 'voltage')?.tecnicoValue
    const motorCurrent = measuredCurrent ?? session.motorChecks.find(c => c.step === 'current')?.tecnicoValue
    const motorCosFi = measuredCosFi ?? session.motorChecks.find(c => c.step === 'power_cosfi')?.tecnicoValue

    if (!motorVoltage || !motorCurrent || !motorCosFi) {
      return NextResponse.json(
        { error: 'Faltan valores medidos. Se requiere tensión, corriente y cos φ del motor.' },
        { status: 400 }
      )
    }

    const V = parseFloat(motorVoltage)
    const I = parseFloat(motorCurrent)
    const cosFi = parseFloat(motorCosFi)
    const sinFi = Math.sqrt(1 - cosFi * cosFi)

    // Calculate measured power values
    // P = V * I * cosφ (Active Power in W)
    // Q = V * I * sinφ (Reactive Power in VAR)
    // S = V * I (Apparent Power in VA)
    const activePowerMeasured = V * I * cosFi
    const reactivePowerMeasured = V * I * sinFi
    const apparentPowerMeasured = V * I

    // Plate values
    const plateV = plateVoltage ? parseFloat(plateVoltage) : V
    const plateI = plateCurrent ? parseFloat(plateCurrent) : I
    const plateCF = plateCosFi ? parseFloat(plateCosFi) : cosFi
    const plateSinFi = Math.sqrt(1 - plateCF * plateCF)

    const activePowerPlate = platePowerKw
      ? parseFloat(platePowerKw) * 1000 // Convert kW to W
      : plateV * plateI * plateCF
    const reactivePowerPlate = plateV * plateI * plateSinFi
    const apparentPowerPlate = plateV * plateI

    // Calculate deviation percentages
    const activeDeviation = activePowerPlate !== 0
      ? ((activePowerMeasured - activePowerPlate) / activePowerPlate) * 100
      : 0
    const reactiveDeviation = reactivePowerPlate !== 0
      ? ((reactivePowerMeasured - reactivePowerPlate) / reactivePowerPlate) * 100
      : 0
    const apparentDeviation = apparentPowerPlate !== 0
      ? ((apparentPowerMeasured - apparentPowerPlate) / apparentPowerPlate) * 100
      : 0

    // Clear existing analysis data
    await db.analysisData.deleteMany({ where: { sessionId: id } })

    // Create analysis records
    const analysisRecords = await db.analysisData.createMany({
      data: [
        {
          sessionId: id,
          parameter: 'active_power',
          measuredValue: activePowerMeasured.toFixed(2),
          plateValue: activePowerPlate.toFixed(2),
          calculatedValue: `${V}V × ${I}A × ${cosFi} = ${activePowerMeasured.toFixed(2)}W`,
          deviation: `${activeDeviation.toFixed(2)}%`,
          status: Math.abs(activeDeviation) <= 10 ? 'passed' : 'failed',
          notes: `Potencia Activa (P = V×I×cosφ)`,
        },
        {
          sessionId: id,
          parameter: 'reactive_power',
          measuredValue: reactivePowerMeasured.toFixed(2),
          plateValue: reactivePowerPlate.toFixed(2),
          calculatedValue: `${V}V × ${I}A × ${sinFi.toFixed(4)} = ${reactivePowerMeasured.toFixed(2)}VAR`,
          deviation: `${reactiveDeviation.toFixed(2)}%`,
          status: Math.abs(reactiveDeviation) <= 15 ? 'passed' : 'failed',
          notes: `Potencia Reactiva (Q = V×I×sinφ)`,
        },
        {
          sessionId: id,
          parameter: 'apparent_power',
          measuredValue: apparentPowerMeasured.toFixed(2),
          plateValue: apparentPowerPlate.toFixed(2),
          calculatedValue: `${V}V × ${I}A = ${apparentPowerMeasured.toFixed(2)}VA`,
          deviation: `${apparentDeviation.toFixed(2)}%`,
          status: Math.abs(apparentDeviation) <= 10 ? 'passed' : 'failed',
          notes: `Potencia Aparente (S = V×I)`,
        },
        {
          sessionId: id,
          parameter: 'comparison',
          measuredValue: `${(activePowerMeasured / 1000).toFixed(2)} kW`,
          plateValue: `${(activePowerPlate / 1000).toFixed(2)} kW`,
          calculatedValue: `cosφ medido: ${cosFi.toFixed(3)} | cosφ placa: ${plateCF.toFixed(3)}`,
          deviation: `Δcosφ: ${((cosFi - plateCF) / plateCF * 100).toFixed(2)}%`,
          status: Math.abs(cosFi - plateCF) / plateCF <= 0.1 ? 'passed' : 'failed',
          notes: 'Comparación medido vs placa',
        },
      ],
    })

    // Update session status to completed if analysis is done
    await db.session.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
    })

    // Return the created analysis data
    const result = await db.analysisData.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      analysis: result,
      summary: {
        activePowerMeasured,
        reactivePowerMeasured,
        apparentPowerMeasured,
        activePowerPlate,
        reactivePowerPlate,
        apparentPowerPlate,
        cosFiMeasured: cosFi,
        cosFiPlate: plateCF,
        activeDeviation,
        reactiveDeviation,
        apparentDeviation,
      },
      count: analysisRecords.count,
    })
  } catch (error) {
    console.error('Calculate analysis error:', error)
    return NextResponse.json(
      { error: 'Error al calcular análisis de potencia' },
      { status: 500 }
    )
  }
}
