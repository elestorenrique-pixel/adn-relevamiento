'use client'

import { Check, Shield, Zap, Cog, FileText } from 'lucide-react'
import type { SessionStage } from '@/lib/types'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const STAGES: Array<{ id: SessionStage; label: string; icon: React.ReactNode }> = [
  { id: 'safety', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'panel', label: 'Tablero', icon: <Zap className="w-4 h-4" /> },
  { id: 'motor', label: 'Motor', icon: <Cog className="w-4 h-4" /> },
  { id: 'analysis', label: 'Análisis', icon: <FileText className="w-4 h-4" /> },
]

interface StageProgressProps {
  currentStage: SessionStage
  completedStages: SessionStage[]
}

export default function StageProgress({ currentStage, completedStages }: StageProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage)

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {STAGES.map((stage, idx) => {
        const isCompleted = completedStages.includes(stage.id)
        const isCurrent = stage.id === currentStage
        const isFuture = idx > currentIndex

        return (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage node */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stage.icon}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 font-medium whitespace-nowrap',
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-amber-400'
                    : 'text-slate-600'
                )}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STAGES.length - 1 && (
              <div className="flex-1 mx-2 mt-[-20px]">
                <div
                  className={cn(
                    'h-0.5 rounded-full transition-all duration-500',
                    idx < currentIndex
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-gradient-to-r from-amber-500 to-slate-700'
                      : 'bg-slate-700'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
