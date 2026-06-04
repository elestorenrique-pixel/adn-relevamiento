'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  Session,
  SafetyCheckItem,
  PanelCheckItem,
  MotorCheckItem,
  AnalysisDataItem,
  ChatMessageData,
  AuditRecord,
  UserRole,
  SessionStage,
  NormativeStatus,
  SystemType,
} from '@/lib/types'
import {
  SAFETY_STEPS,
  PANEL_STEPS_MONOFASICO,
  PANEL_STEPS_TRIFASICO,
  MOTOR_STEPS_MONOFASICO,
  MOTOR_STEPS_TRIFASICO,
  EPP_ITEMS,
} from '@/lib/types'

export type AppScreen = 'login' | 'lobby' | 'session'

const generateId = () => Math.random().toString(36).substring(2, 11)
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString()

export interface AppStore {
  // ── UI ──
  currentScreen: AppScreen
  currentStage: SessionStage
  isLoading: boolean
  loadingMessage: string | null
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  setScreen: (screen: AppScreen) => void
  setStage: (stage: SessionStage) => void
  setLoading: (loading: boolean, message?: string | null) => void
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  removeNotification: (id: string) => void

  // ── Auth ──
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void

  // ── Session ──
  currentSession: Session | null
  sessions: Session[]
  systemType: SystemType
  setSystemType: (type: SystemType) => void
  createSession: (systemType?: SystemType) => Promise<string | null>
  joinSession: (code: string) => Promise<boolean>
  leaveSession: () => void
  setSession: (session: Session) => void

  // ── Demo Mode ──
  demoMode: boolean
  toggleDemoMode: () => void

  // ── Safety ──
  safetySteps: SafetyCheckItem[]
  eppChecks: Record<string, boolean>
  isSafetyComplete: boolean
  initSafetySteps: (sessionId: string) => void
  safetyCompleteStep: (stepId: string, notes?: string) => void
  safetyValidateStep: (stepId: string, notes?: string) => void
  safetyAutoValidateAll: () => void
  toggleEpp: (item: string) => void
  eppAutoCheckAll: () => void
  checkSafetyCompletion: () => void

  // ── Panel ──
  panelSteps: PanelCheckItem[]
  initPanelSteps: (sessionId: string, systemType: SystemType) => void
  panelRegisterMeasurement: (stepId: string, value: string, notes?: string) => void
  panelValidateStep: (stepId: string, passed: boolean, notes?: string, errors?: string) => void
  panelAutoValidateAll: () => void
  panelGetProgress: () => { completed: number; total: number }

  // ── Motor ──
  motorSteps: MotorCheckItem[]
  nameplateData: Record<string, string>
  initMotorSteps: (sessionId: string, systemType: SystemType) => void
  motorRegisterMeasurement: (stepId: string, value: string, notes?: string) => void
  motorValidateStep: (stepId: string, passed: boolean, notes?: string, errors?: string) => void
  motorAutoValidateAll: () => void
  motorSetNameplateData: (field: string, value: string) => void
  motorGetProgress: () => { completed: number; total: number }

  // ── Analysis ──
  analysisData: AnalysisDataItem[]
  isAnalysisGenerated: boolean
  generateAnalysis: () => void

  // ── Chat ──
  chatMessages: ChatMessageData[]
  isChatConnected: boolean
  typingUser: string | null
  addChatMessage: (msg: ChatMessageData) => void
  setChatConnected: (connected: boolean) => void
  setTypingUser: (userName: string | null) => void
  clearChatMessages: () => void

  // ── Audit ──
  auditRecords: AuditRecord[]
  addAuditRecord: (record: AuditRecord) => void
  clearAuditRecords: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ══════════════════════════════════════════════════
      // UI
      // ══════════════════════════════════════════════════
      currentScreen: 'login',
      currentStage: 'safety' as SessionStage,
      isLoading: false,
      loadingMessage: null,
      notifications: [],

      setScreen: (screen) => set({ currentScreen: screen }),
      setStage: (stage) => set({ currentStage: stage }),
      setLoading: (loading, message = null) => set({ isLoading: loading, loadingMessage: message }),
      addNotification: (message, type) => {
        const id = generateId()
        set((s) => ({ notifications: [...s.notifications, { id, message, type }] }))
        setTimeout(() => get().removeNotification(id), 5000)
      },
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      // ══════════════════════════════════════════════════
      // Auth
      // ══════════════════════════════════════════════════
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, loadingMessage: 'Iniciando sesión...' })
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password }),
          })
          if (res.ok) {
            const data = await res.json()
            const user: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as UserRole,
              createdAt: data.createdAt,
            }
            set({ user, isAuthenticated: true, currentScreen: 'lobby', isLoading: false, loadingMessage: null })
            return true
          }
        } catch {
          // fallback to demo
        }
        // Demo fallback - accept any login
        const user: User = {
          id: generateId(),
          email,
          name: email.split('@')[0],
          role: 'tecnico',
          createdAt: new Date().toISOString(),
        }
        set({ user, isAuthenticated: true, currentScreen: 'lobby', isLoading: false, loadingMessage: null })
        return true
      },

      register: async (name: string, email: string, password: string, role: UserRole) => {
        set({ isLoading: true, loadingMessage: 'Registrando...' })
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', name, email, password, role }),
          })
          if (res.ok) {
            const data = await res.json()
            const user: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as UserRole,
              createdAt: data.createdAt,
            }
            set({ user, isAuthenticated: true, currentScreen: 'lobby', isLoading: false, loadingMessage: null })
            return true
          }
        } catch {
          // fallback
        }
        const user: User = {
          id: generateId(),
          email,
          name,
          role,
          createdAt: new Date().toISOString(),
        }
        set({ user, isAuthenticated: true, currentScreen: 'lobby', isLoading: false, loadingMessage: null })
        return true
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          currentScreen: 'login',
          currentSession: null,
          chatMessages: [],
          safetySteps: [],
          panelSteps: [],
          motorSteps: [],
          analysisData: [],
          isAnalysisGenerated: false,
          isSafetyComplete: false,
        })
      },

      // ══════════════════════════════════════════════════
      // Session
      // ══════════════════════════════════════════════════
      currentSession: null,
      sessions: [],
      systemType: 'monofasico' as SystemType,

      setSystemType: (type: SystemType) => set({ systemType: type }),

      createSession: async (systemTypeOverride?: SystemType) => {
        const user = get().user
        if (!user) return null

        const st = systemTypeOverride || get().systemType

        set({ isLoading: true, loadingMessage: 'Creando sesión...' })

        const session: Session = {
          id: generateId(),
          code: generateCode(),
          status: 'safety',
          currentStage: 'safety',
          systemType: st,
          tecnicoId: '',
          auditorId: null,
          tecnicoName: '',
          auditorName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        }

        if (user.role === 'tecnico') {
          session.tecnicoId = user.id
          session.tecnicoName = user.name
        } else {
          session.auditorId = user.id
          session.auditorName = user.name
        }

        set((s) => ({
          currentSession: session,
          sessions: [session, ...s.sessions],
          currentScreen: 'session',
          currentStage: 'safety' as SessionStage,
          systemType: st,
          isLoading: false,
          loadingMessage: null,
        }))

        get().initSafetySteps(session.id)
        get().initPanelSteps(session.id, st)
        get().initMotorSteps(session.id, st)

        return session.code
      },

      joinSession: async (code: string) => {
        const user = get().user
        if (!user) return false

        set({ isLoading: true, loadingMessage: 'Uniéndose a sesión...' })

        const existingSession = get().sessions.find((s) => s.code === code)
        if (existingSession) {
          const updated = { ...existingSession }
          if (user.role === 'auditor' && !updated.auditorId) {
            updated.auditorId = user.id
            updated.auditorName = user.name
          }
          if (user.role === 'tecnico' && !updated.tecnicoId) {
            updated.tecnicoId = user.id
            updated.tecnicoName = user.name
          }
          const st = updated.systemType || 'monofasico'
          set((s) => ({
            currentSession: updated,
            sessions: s.sessions.map((sess) => (sess.id === updated.id ? updated : sess)),
            currentScreen: 'session',
            currentStage: updated.currentStage as SessionStage,
            systemType: st,
            isLoading: false,
            loadingMessage: null,
          }))
          get().initSafetySteps(updated.id)
          get().initPanelSteps(updated.id, st)
          get().initMotorSteps(updated.id, st)
          return true
        }

        // Demo: create a session with the provided code
        const st = get().systemType
        const session: Session = {
          id: generateId(),
          code,
          status: 'safety',
          currentStage: 'safety',
          systemType: st,
          tecnicoId: user.role === 'tecnico' ? user.id : 'pending',
          auditorId: user.role === 'auditor' ? user.id : null,
          tecnicoName: user.role === 'tecnico' ? user.name : 'Pendiente',
          auditorName: user.role === 'auditor' ? user.name : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        }

        set((s) => ({
          currentSession: session,
          sessions: [session, ...s.sessions],
          currentScreen: 'session',
          currentStage: 'safety' as SessionStage,
          systemType: st,
          isLoading: false,
          loadingMessage: null,
        }))
        get().initSafetySteps(session.id)
        get().initPanelSteps(session.id, st)
        get().initMotorSteps(session.id, st)
        return true
      },

      leaveSession: () => {
        set({ currentSession: null, currentScreen: 'lobby', chatMessages: [] })
      },

      setSession: (session) => set({ currentSession: session }),

      // ══════════════════════════════════════════════════
      // Demo Mode
      // ══════════════════════════════════════════════════
      demoMode: false,
      toggleDemoMode: () => set((s) => ({ demoMode: !s.demoMode })),

      // ══════════════════════════════════════════════════
      // Safety
      // ══════════════════════════════════════════════════
      safetySteps: [],
      eppChecks: Object.fromEntries(EPP_ITEMS.map((item) => [item, false])),
      isSafetyComplete: false,

      initSafetySteps: (sessionId: string) => {
        const steps: SafetyCheckItem[] = SAFETY_STEPS.map((s) => ({
          id: generateId(),
          sessionId,
          step: s.id,
          tecnicoCompleted: false,
          auditorValidated: false,
          tecnicoNotes: null,
          auditorNotes: null,
          order: s.order,
        }))
        const eppChecks = Object.fromEntries(EPP_ITEMS.map((item) => [item, false]))
        set({ safetySteps: steps, eppChecks, isSafetyComplete: false })
      },

      safetyCompleteStep: (stepId: string, notes?: string) => {
        set((s) => ({
          safetySteps: s.safetySteps.map((step) =>
            step.step === stepId
              ? { ...step, tecnicoCompleted: true, tecnicoNotes: notes || null }
              : step
          ),
        }))
        // In demo mode, also auto-validate
        if (get().demoMode) {
          set((s) => ({
            safetySteps: s.safetySteps.map((step) =>
              step.step === stepId
                ? { ...step, auditorValidated: true }
                : step
            ),
          }))
        }
        get().checkSafetyCompletion()
      },

      safetyValidateStep: (stepId: string, notes?: string) => {
        set((s) => ({
          safetySteps: s.safetySteps.map((step) =>
            step.step === stepId
              ? { ...step, auditorValidated: true, auditorNotes: notes || null }
              : step
          ),
        }))
        get().checkSafetyCompletion()
      },

      safetyAutoValidateAll: () => {
        set((s) => ({
          safetySteps: s.safetySteps.map((step) => ({
            ...step,
            tecnicoCompleted: true,
            auditorValidated: true,
          })),
        }))
        get().checkSafetyCompletion()
      },

      toggleEpp: (item: string) => {
        set((s) => ({
          eppChecks: { ...s.eppChecks, [item]: !s.eppChecks[item] },
        }))
        get().checkSafetyCompletion()
      },

      eppAutoCheckAll: () => {
        set({
          eppChecks: Object.fromEntries(EPP_ITEMS.map((item) => [item, true])),
        })
        get().checkSafetyCompletion()
      },

      checkSafetyCompletion: () => {
        const { safetySteps, eppChecks, demoMode } = get()
        const allStepsCompleted = safetySteps.every((s) => s.tecnicoCompleted)
        const allValidated = safetySteps.every((s) => s.auditorValidated)
        const allEpp = Object.values(eppChecks).every((v) => v)
        // In demo mode, auto-validate bypasses auditor requirement
        set({ isSafetyComplete: demoMode ? (allStepsCompleted && allEpp) : (allStepsCompleted && allValidated && allEpp) })
      },

      // ══════════════════════════════════════════════════
      // Panel
      // ══════════════════════════════════════════════════
      panelSteps: [],

      initPanelSteps: (sessionId: string, systemType: SystemType) => {
        const stepsDef = systemType === 'trifasico' ? PANEL_STEPS_TRIFASICO : PANEL_STEPS_MONOFASICO
        const steps: PanelCheckItem[] = stepsDef.map((s) => ({
          id: generateId(),
          sessionId,
          step: s.id,
          tecnicoValue: null,
          tecnicoCompleted: false,
          auditorValidated: false,
          tecnicoNotes: null,
          auditorNotes: null,
          auditorErrors: null,
          normativeStatus: 'pending' as NormativeStatus,
          order: s.order,
        }))
        set({ panelSteps: steps })
      },

      panelRegisterMeasurement: (stepId: string, value: string, notes?: string) => {
        let normativeStatus: NormativeStatus = 'pending'
        const numValue = parseFloat(value)

        if (stepId === 'voltage_ln' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 198 && numValue <= 242) ? 'passed' : 'failed'
        } else if (stepId === 'voltage_ll' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 342 && numValue <= 418) ? 'passed' : 'failed'
        } else if (stepId === 'voltage_imbalance' && !isNaN(numValue)) {
          normativeStatus = numValue <= 2 ? 'passed' : 'failed'
        } else if (stepId === 'grounding' && !isNaN(numValue)) {
          normativeStatus = numValue <= 10 ? 'passed' : 'failed'
        } else if (stepId === 'torque' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 1.2 && numValue <= 2.5) ? 'passed' : 'failed'
        } else if (['current_phase', 'current_r', 'current_s', 'current_t', 'current_neutral', 'differential'].includes(stepId) && !isNaN(numValue)) {
          normativeStatus = 'passed'
        } else if (value.trim() !== '') {
          normativeStatus = 'passed'
        }

        set((s) => ({
          panelSteps: s.panelSteps.map((step) =>
            step.step === stepId
              ? { ...step, tecnicoValue: value, tecnicoCompleted: true, tecnicoNotes: notes || null, normativeStatus }
              : step
          ),
        }))

        // In demo mode, auto-validate
        if (get().demoMode) {
          set((s) => ({
            panelSteps: s.panelSteps.map((step) =>
              step.step === stepId
                ? { ...step, auditorValidated: true }
                : step
            ),
          }))
        }
      },

      panelValidateStep: (stepId: string, passed: boolean, notes?: string, errors?: string) => {
        set((s) => ({
          panelSteps: s.panelSteps.map((step) =>
            step.step === stepId
              ? {
                  ...step,
                  auditorValidated: passed,
                  auditorNotes: notes || null,
                  auditorErrors: errors || null,
                  normativeStatus: (passed ? 'passed' : 'failed') as NormativeStatus,
                }
              : step
          ),
        }))
      },

      panelAutoValidateAll: () => {
        set((s) => ({
          panelSteps: s.panelSteps.map((step) =>
            step.tecnicoCompleted
              ? { ...step, auditorValidated: true, normativeStatus: step.normativeStatus === 'pending' ? 'passed' as NormativeStatus : step.normativeStatus }
              : step
          ),
        }))
      },

      panelGetProgress: () => {
        const steps = get().panelSteps
        return {
          completed: steps.filter((s) => s.tecnicoCompleted && (s.auditorValidated || get().demoMode)).length,
          total: steps.length,
        }
      },

      // ══════════════════════════════════════════════════
      // Motor
      // ══════════════════════════════════════════════════
      motorSteps: [],
      nameplateData: {
        brand: '', model: '', powerHp: '', powerKw: '',
        voltage: '', current: '', frequency: '', rpm: '',
        cosFi: '', serviceFactor: '', insulation: '', connection: '',
        systemType: 'monofasico', voltage_ll: '',
      },

      initMotorSteps: (sessionId: string, systemType: SystemType) => {
        const stepsDef = systemType === 'trifasico' ? MOTOR_STEPS_TRIFASICO : MOTOR_STEPS_MONOFASICO
        const steps: MotorCheckItem[] = stepsDef.map((s) => ({
          id: generateId(),
          sessionId,
          step: s.id,
          tecnicoValue: null,
          tecnicoCompleted: false,
          auditorValidated: false,
          tecnicoNotes: null,
          auditorNotes: null,
          auditorErrors: null,
          normativeStatus: 'pending' as NormativeStatus,
          order: s.order,
        }))
        set({
          motorSteps: steps,
          nameplateData: {
            ...get().nameplateData,
            systemType: systemType,
            voltage_ll: systemType === 'trifasico' ? '' : '',
          },
        })
      },

      motorRegisterMeasurement: (stepId: string, value: string, notes?: string) => {
        let normativeStatus: NormativeStatus = 'pending'
        const numValue = parseFloat(value)

        if (stepId === 'voltage' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 198 && numValue <= 242) ? 'passed' : 'failed'
        } else if (stepId === 'voltage_ln' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 198 && numValue <= 242) ? 'passed' : 'failed'
        } else if (stepId === 'voltage_ll' && !isNaN(numValue)) {
          normativeStatus = (numValue >= 342 && numValue <= 418) ? 'passed' : 'failed'
        } else if (stepId === 'insulation' && !isNaN(numValue)) {
          normativeStatus = numValue >= 1 ? 'passed' : 'failed'
        } else if (['current', 'current_r', 'current_s', 'current_t', 'current_start'].includes(stepId) && !isNaN(numValue)) {
          normativeStatus = 'passed'
        } else if (value.trim() !== '') {
          normativeStatus = 'passed'
        }

        set((s) => ({
          motorSteps: s.motorSteps.map((step) =>
            step.step === stepId
              ? { ...step, tecnicoValue: value, tecnicoCompleted: true, tecnicoNotes: notes || null, normativeStatus }
              : step
          ),
        }))

        // In demo mode, auto-validate
        if (get().demoMode) {
          set((s) => ({
            motorSteps: s.motorSteps.map((step) =>
              step.step === stepId
                ? { ...step, auditorValidated: true }
                : step
            ),
          }))
        }
      },

      motorValidateStep: (stepId: string, passed: boolean, notes?: string, errors?: string) => {
        set((s) => ({
          motorSteps: s.motorSteps.map((step) =>
            step.step === stepId
              ? {
                  ...step,
                  auditorValidated: passed,
                  auditorNotes: notes || null,
                  auditorErrors: errors || null,
                  normativeStatus: (passed ? 'passed' : 'failed') as NormativeStatus,
                }
              : step
          ),
        }))
      },

      motorAutoValidateAll: () => {
        set((s) => ({
          motorSteps: s.motorSteps.map((step) =>
            step.tecnicoCompleted
              ? { ...step, auditorValidated: true, normativeStatus: step.normativeStatus === 'pending' ? 'passed' as NormativeStatus : step.normativeStatus }
              : step
          ),
        }))
      },

      motorSetNameplateData: (field: string, value: string) => {
        set((s) => ({
          nameplateData: { ...s.nameplateData, [field]: value },
        }))
      },

      motorGetProgress: () => {
        const steps = get().motorSteps
        return {
          completed: steps.filter((s) => s.tecnicoCompleted && (s.auditorValidated || get().demoMode)).length,
          total: steps.length,
        }
      },

      // ══════════════════════════════════════════════════
      // Analysis
      // ══════════════════════════════════════════════════
      analysisData: [],
      isAnalysisGenerated: false,

      generateAnalysis: () => {
        const { motorSteps, nameplateData, currentSession, systemType } = get()

        // Get voltage value based on system type
        const voltageStr = motorSteps.find(s => s.step === 'voltage_ln')?.tecnicoValue
          || motorSteps.find(s => s.step === 'voltage')?.tecnicoValue
          || '220'
        const voltageLlStr = motorSteps.find(s => s.step === 'voltage_ll')?.tecnicoValue || '380'

        // Get current value based on system type
        let currentStr = '10'
        if (systemType === 'trifasico') {
          // For trifásico, use average of phase currents or single current
          const iR = parseFloat(motorSteps.find(s => s.step === 'current_r')?.tecnicoValue || '0')
          const iS = parseFloat(motorSteps.find(s => s.step === 'current_s')?.tecnicoValue || '0')
          const iT = parseFloat(motorSteps.find(s => s.step === 'current_t')?.tecnicoValue || '0')
          if (iR > 0 || iS > 0 || iT > 0) {
            currentStr = ((iR + iS + iT) / 3).toString()
          }
        } else {
          currentStr = motorSteps.find(s => s.step === 'current')?.tecnicoValue || '10'
        }

        const cosFiStr = motorSteps.find(s => s.step === 'power_cosfi')?.tecnicoValue || nameplateData.cosFi || '0.85'
        const powerKwStr = nameplateData.powerKw || '5.5'

        const V = parseFloat(voltageStr) || 220
        const I = parseFloat(currentStr) || 10
        const cosFiMeasured = parseFloat(cosFiStr) || 0.85
        const Pplate = parseFloat(powerKwStr) || 5.5
        const cosFiPlate = parseFloat(nameplateData.cosFi) || 0.85

        // Different formulas for monofásico vs trifásico
        let PactiveMeasured: number
        let SapparentMeasured: number

        if (systemType === 'trifasico') {
          // Trifásico: P = V_LL * I * cosFi * √3 / 1000
          const Vll = parseFloat(voltageLlStr) || 380
          PactiveMeasured = Vll * I * cosFiMeasured * Math.sqrt(3) / 1000
          SapparentMeasured = Vll * I * Math.sqrt(3) / 1000
        } else {
          // Monofásico: P = V * I * cosFi / 1000
          PactiveMeasured = V * I * cosFiMeasured / 1000
          SapparentMeasured = V * I / 1000
        }

        const QreactiveMeasured = Math.sqrt(Math.max(0, SapparentMeasured ** 2 - PactiveMeasured ** 2))
        const SapparentPlate = Pplate / cosFiPlate
        const QreactivePlate = Math.sqrt(Math.max(0, SapparentPlate ** 2 - Pplate ** 2))

        const activeDeviation = Pplate > 0 ? ((PactiveMeasured - Pplate) / Pplate) * 100 : 0
        const reactiveDeviation = QreactivePlate > 0 ? ((QreactiveMeasured - QreactivePlate) / QreactivePlate) * 100 : 0
        const apparentDeviation = SapparentPlate > 0 ? ((SapparentMeasured - SapparentPlate) / SapparentPlate) * 100 : 0
        const cosFiDeviation = cosFiPlate > 0 ? ((cosFiMeasured - cosFiPlate) / cosFiPlate) * 100 : 0

        const sid = currentSession?.id || ''

        const data: AnalysisDataItem[] = [
          {
            id: generateId(), sessionId: sid, parameter: 'P activa (kW)',
            measuredValue: PactiveMeasured.toFixed(2), plateValue: Pplate.toFixed(2),
            calculatedValue: null, deviation: activeDeviation.toFixed(1),
            status: Math.abs(activeDeviation) <= 10 ? 'passed' : 'failed', notes: null,
          },
          {
            id: generateId(), sessionId: sid, parameter: 'Q reactiva (kVAR)',
            measuredValue: QreactiveMeasured.toFixed(2), plateValue: QreactivePlate.toFixed(2),
            calculatedValue: null, deviation: reactiveDeviation.toFixed(1),
            status: Math.abs(reactiveDeviation) <= 15 ? 'passed' : 'failed', notes: null,
          },
          {
            id: generateId(), sessionId: sid, parameter: 'S aparente (kVA)',
            measuredValue: SapparentMeasured.toFixed(2), plateValue: SapparentPlate.toFixed(2),
            calculatedValue: null, deviation: apparentDeviation.toFixed(1),
            status: Math.abs(apparentDeviation) <= 10 ? 'passed' : 'failed', notes: null,
          },
          {
            id: generateId(), sessionId: sid, parameter: 'cos φ',
            measuredValue: cosFiMeasured.toFixed(3), plateValue: cosFiPlate.toFixed(3),
            calculatedValue: null, deviation: cosFiDeviation.toFixed(1),
            status: cosFiMeasured >= 0.85 ? 'passed' : 'failed', notes: null,
          },
        ]

        set({ analysisData: data, isAnalysisGenerated: true })
      },

      // ══════════════════════════════════════════════════
      // Chat
      // ══════════════════════════════════════════════════
      chatMessages: [],
      isChatConnected: false,
      typingUser: null,

      addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
      setChatConnected: (connected) => set({ isChatConnected: connected }),
      setTypingUser: (userName) => set({ typingUser: userName }),
      clearChatMessages: () => set({ chatMessages: [] }),

      // ══════════════════════════════════════════════════
      // Audit
      // ══════════════════════════════════════════════════
      auditRecords: [],

      addAuditRecord: (record) => set((s) => ({ auditRecords: [...s.auditRecords, record] })),
      clearAuditRecords: () => set({ auditRecords: [] }),
    }),
    {
      name: 'adl-tecnico-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentScreen: state.currentScreen,
        currentStage: state.currentStage,
        currentSession: state.currentSession,
        sessions: state.sessions,
        systemType: state.systemType,
        demoMode: state.demoMode,
        safetySteps: state.safetySteps,
        eppChecks: state.eppChecks,
        panelSteps: state.panelSteps,
        motorSteps: state.motorSteps,
        nameplateData: state.nameplateData,
        analysisData: state.analysisData,
        isAnalysisGenerated: state.isAnalysisGenerated,
        isSafetyComplete: state.isSafetyComplete,
      }),
    }
  )
)
