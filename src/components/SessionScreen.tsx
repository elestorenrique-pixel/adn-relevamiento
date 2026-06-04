'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, LogOut, Users, Shield, ChevronRight,
  MessageSquare
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { SessionStage } from '@/lib/types'
import SafetyStage from '@/components/SafetyStage'
import PanelCheckStage from '@/components/PanelCheckStage'
import MotorCheckStage from '@/components/MotorCheckStage'
import AnalysisStage from '@/components/AnalysisStage'
import DocumentsStage from '@/components/DocumentsStage'
import ChatPanel from '@/components/ChatPanel'
import StageProgress from '@/components/StageProgress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const STAGE_LABELS: Record<SessionStage, string> = {
  safety: 'Seguridad',
  panel: 'Chequeo de Tablero',
  motor: 'Chequeo de Motor',
  analysis: 'Análisis & Documentos',
}

export default function SessionScreen() {
  const {
    user, currentSession, currentStage, isSafetyComplete, demoMode,
    leaveSession, addNotification,
  } = useStore()

  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [completedStages, setCompletedStages] = useState<SessionStage[]>([])

  const isTecnico = user?.role === 'tecnico'
  const isAuditor = user?.role === 'auditor'

  const handleLeave = () => {
    leaveSession()
    addNotification('Sesión abandonada', 'info')
  }

  const handleStageChange = (stage: SessionStage) => {
    // Mark previous stages as completed when advancing
    const stageOrder: SessionStage[] = ['safety', 'panel', 'motor', 'analysis']
    const currentIdx = stageOrder.indexOf(currentStage)
    const newIdx = stageOrder.indexOf(stage)

    if (newIdx > currentIdx) {
      const newlyCompleted = stageOrder.slice(0, newIdx)
      setCompletedStages(prev => [...new Set([...prev, ...newlyCompleted])])
    }
  }

  // Track stage changes
  const effectiveCompletedStages = [...completedStages]
  if (currentStage !== 'safety' && !effectiveCompletedStages.includes('safety')) {
    effectiveCompletedStages.push('safety')
  }
  if ((currentStage === 'motor' || currentStage === 'analysis') && !effectiveCompletedStages.includes('panel')) {
    effectiveCompletedStages.push('panel')
  }
  if (currentStage === 'analysis' && !effectiveCompletedStages.includes('motor')) {
    effectiveCompletedStages.push('motor')
  }

  const renderStageContent = () => {
    switch (currentStage) {
      case 'safety': return <SafetyStage />
      case 'panel': return <PanelCheckStage />
      case 'motor': return <MotorCheckStage />
      case 'analysis': return <AnalysisStage />
      default: return <SafetyStage />
    }
  }

  // For the analysis stage, we show the documents tab as well
  const showDocuments = currentStage === 'analysis' && isSafetyComplete

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Branding + Session Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm font-bold text-slate-100 hidden sm:inline">
                ADL <span className="text-amber-500">Técnico</span>
              </span>
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-800" />

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-amber-400 border-amber-500/50">
                {currentSession?.code || '------'}
              </Badge>
            </div>
          </div>

          {/* Center: Stage indicator + Demo Mode */}
          <div className="hidden md:flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {STAGE_LABELS[currentStage]}
            </Badge>
            {demoMode && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Zap className="w-3 h-3 mr-1" /> DEMO
              </Badge>
            )}
          </div>

          {/* Right: User info + Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isTecnico ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-xs text-slate-300 hidden sm:inline">{user?.name}</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                  isTecnico ? 'border-amber-500/50 text-amber-400' : 'border-emerald-500/50 text-emerald-400'
                }`}>
                  {isTecnico ? 'Téc' : 'Aud'}
                </Badge>
              </div>
            </div>

            {/* Mobile chat toggle */}
            <button
              onClick={() => setChatCollapsed(!chatCollapsed)}
              className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" /> Salir
            </Button>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="px-4 pb-2">
          <StageProgress currentStage={currentStage} completedStages={effectiveCompletedStages} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stage Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStageContent()}
              </motion.div>
            </AnimatePresence>

            {/* Documents section (shown in analysis stage) */}
            {showDocuments && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <DocumentsStage />
              </motion.div>
            )}
          </div>
        </main>

        {/* Chat Panel - Desktop */}
        <div className="hidden md:block">
          <ChatPanel isCollapsed={chatCollapsed} onToggle={() => setChatCollapsed(!chatCollapsed)} />
        </div>
      </div>

      {/* Mobile Chat Overlay */}
      {chatCollapsed && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setChatCollapsed(false)} />
          <div className="w-80">
            <ChatPanel isCollapsed={false} onToggle={() => setChatCollapsed(false)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-2 px-4 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>AEA 90364 · IRAM · EDESA</span>
          <span>ADL Técnico v1.0</span>
        </div>
      </footer>
    </div>
  )
}
