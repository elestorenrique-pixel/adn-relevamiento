'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import LoginScreen from '@/components/LoginScreen'
import LobbyScreen from '@/components/LobbyScreen'
import SessionScreen from '@/components/SessionScreen'

export default function Home() {
  const { currentScreen, isAuthenticated, notifications, removeNotification } = useStore()

  // Auto-redirect to lobby if authenticated
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'login') {
      useStore.getState().setScreen('lobby')
    }
  }, [isAuthenticated, currentScreen])

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-3 rounded-lg border shadow-lg cursor-pointer ${
                n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-sky-500/10 border-sky-500/30 text-sky-400'
              }`}
              onClick={() => removeNotification(n.id)}
            >
              <p className="text-sm">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Screen Router */}
      <AnimatePresence mode="wait">
        {currentScreen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <LoginScreen />
          </motion.div>
        )}

        {currentScreen === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <LobbyScreen />
          </motion.div>
        )}

        {currentScreen === 'session' && (
          <motion.div
            key="session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <SessionScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
