'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Send, Wifi, WifiOff, MessageSquare, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { ChatMessageData, UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ChatPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function ChatPanel({ isCollapsed, onToggle }: ChatPanelProps) {
  const {
    user, currentSession, chatMessages, isChatConnected, typingUser,
    addChatMessage, setChatConnected, setTypingUser,
  } = useStore()

  const [message, setMessage] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Connect to Socket.io
  useEffect(() => {
    if (!currentSession || !user) return

    // Use Caddy proxy path when available, otherwise direct connection to chat service
    const socketUrl = typeof window !== 'undefined' && window.location.port === '81'
      ? '/?XTransformPort=3003'
      : 'http://localhost:3003'

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      setChatConnected(true)
      newSocket.emit('join-session', {
        sessionId: currentSession.id,
        userId: user.id,
        role: user.role,
        userName: user.name,
      })
    })

    newSocket.on('disconnect', () => {
      setChatConnected(false)
    })

    newSocket.on('chat-message', (msg: ChatMessageData) => {
      addChatMessage(msg)
    })

    newSocket.on('typing', (data: { userName: string }) => {
      setTypingUser(data.userName)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000)
    })

    newSocket.on('stage-update', (data: { stage: string; step: string }) => {
      addChatMessage({
        id: `sys-${Date.now()}`,
        sessionId: currentSession.id,
        userId: 'system',
        userName: 'Sistema',
        role: 'system',
        content: `Etapa actualizada: ${data.stage} - ${data.step}`,
        timestamp: new Date().toISOString(),
      })
    })

    newSocket.on('step-completed', (data: { category: string; step: string }) => {
      addChatMessage({
        id: `sys-${Date.now()}`,
        sessionId: currentSession.id,
        userId: 'system',
        userName: 'Sistema',
        role: 'system',
        content: `Paso completado: ${data.category}/${data.step}`,
        timestamp: new Date().toISOString(),
      })
    })

    newSocket.on('auditor-validation', (data: { category: string; step: string; passed: boolean }) => {
      addChatMessage({
        id: `sys-${Date.now()}`,
        sessionId: currentSession.id,
        userId: 'system',
        userName: 'Sistema',
        role: 'system',
        content: `Auditor ${data.passed ? 'validó' : 'rechazó'}: ${data.category}/${data.step}`,
        timestamp: new Date().toISOString(),
      })
    })

    // Use ref for socket to avoid setState in effect
    socketRef.current = newSocket

    return () => {
      newSocket.emit('leave-session', {
        sessionId: currentSession.id,
        userId: user.id,
        role: user.role,
        userName: user.name,
      })
      newSocket.disconnect()
      setChatConnected(false)
    }
  }, [currentSession?.id, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSend = useCallback(() => {
    if (!message.trim() || !socketRef.current || !user || !currentSession) return

    const msgData = {
      sessionId: currentSession.id,
      userId: user.id,
      userName: user.name,
      role: user.role,
      content: message.trim(),
    }

    socketRef.current.emit('chat-message', msgData)
    setMessage('')
  }, [message, user, currentSession])

  const handleTyping = useCallback(() => {
    if (socketRef.current && currentSession && user) {
      socketRef.current.emit('typing', {
        sessionId: currentSession.id,
        userId: user.id,
        userName: user.name,
      })
    }
  }, [currentSession, user])

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const getRoleColor = (role: UserRole | 'system') => {
    if (role === 'system') return 'text-slate-400'
    if (role === 'tecnico') return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getRoleBadge = (role: UserRole | 'system') => {
    if (role === 'system') return null
    return (
      <Badge variant="outline" className={`text-[9px] px-1 py-0 ml-1 ${
        role === 'tecnico'
          ? 'border-amber-500/50 text-amber-400'
          : 'border-emerald-500/50 text-emerald-400'
      }`}>
        {role === 'tecnico' ? 'Téc' : 'Aud'}
      </Badge>
    )
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 px-2 bg-slate-900 border-l border-slate-800">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors relative"
        >
          <MessageSquare className="w-5 h-5 text-slate-400" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 flex items-center justify-center">
              {chatMessages.length > 9 ? '9+' : chatMessages.length}
            </span>
          )}
        </button>
        <div className={`w-2 h-2 rounded-full ${isChatConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-slate-900 border-l border-slate-800 w-80 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-200">Chat en Vivo</span>
          <div className="flex items-center gap-1 ml-2">
            {isChatConnected ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className="text-[10px] text-slate-500">{isChatConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {chatMessages.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-8">
              No hay mensajes aún. Inicie una conversación.
            </p>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`${
              msg.role === 'system' ? 'text-center' : ''
            }`}>
              {msg.role === 'system' ? (
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400">{msg.content}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{formatTime(msg.timestamp)}</p>
                </div>
              ) : (
                <div className={`flex flex-col ${
                  msg.userId === user?.id ? 'items-end' : 'items-start'
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-xs font-medium ${getRoleColor(msg.role)}`}>
                      {msg.userName}
                    </span>
                    {getRoleBadge(msg.role)}
                    <span className="text-[10px] text-slate-600">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.userId === user?.id
                      ? 'bg-amber-500/10 border border-amber-500/20 text-slate-200'
                      : 'bg-slate-800 border border-slate-700/50 text-slate-300'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {typingUser && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{typingUser} está escribiendo...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping() }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="Escribir mensaje..."
            disabled={!isChatConnected}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 text-sm focus:border-amber-500 focus:ring-amber-500/20"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || !isChatConnected}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
