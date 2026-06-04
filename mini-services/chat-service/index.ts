import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface SessionRoom {
  sessionId: string
  tecnico: string | null
  auditor: string | null
}

const sessionRooms = new Map<string, SessionRoom>()

// Chat message type
interface ChatMessage {
  id: string
  sessionId: string
  userId: string
  userName: string
  role: 'tecnico' | 'auditor' | 'system'
  content: string
  timestamp: string
}

// Stage update type
interface StageUpdate {
  sessionId: string
  stage: string
  step: string
  data: Record<string, unknown>
}

// Validation event type
interface ValidationEvent {
  sessionId: string
  category: string
  step: string
  passed: boolean
  validatorRole: 'tecnico' | 'auditor'
  notes?: string
  errors?: string[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

io.on('connection', (socket: Socket) => {
  console.log(`[ChatService] User connected: ${socket.id}`)

  // Join a session room
  socket.on('join-session', (data: { sessionId: string; userId: string; role: 'tecnico' | 'auditor'; userName: string }) => {
    const { sessionId, userId, role, userName } = data

    // Leave any previous session rooms
    const currentRooms = Array.from(socket.rooms).filter(r => r.startsWith('session-'))
    currentRooms.forEach(room => socket.leave(room))

    // Join the session room
    const roomName = `session-${sessionId}`
    socket.join(roomName)

    // Update room tracking
    let room = sessionRooms.get(sessionId)
    if (!room) {
      room = { sessionId, tecnico: null, auditor: null }
      sessionRooms.set(sessionId, room)
    }
    if (role === 'tecnico') room.tecnico = socket.id
    if (role === 'auditor') room.auditor = socket.id

    // Notify others in the room
    const systemMsg: ChatMessage = {
      id: generateId(),
      sessionId,
      userId: 'system',
      userName: 'Sistema',
      role: 'system',
      content: `${userName} (${role === 'tecnico' ? 'Técnico' : 'Auditor'}) se ha conectado a la sesión.`,
      timestamp: new Date().toISOString()
    }
    io.to(roomName).emit('chat-message', systemMsg)
    io.to(roomName).emit('user-joined', { userId, role, userName })

    console.log(`[ChatService] ${userName} (${role}) joined session ${sessionId}`)
  })

  // Leave a session room
  socket.on('leave-session', (data: { sessionId: string; userId: string; role: string; userName: string }) => {
    const { sessionId, userId, role, userName } = data
    const roomName = `session-${sessionId}`
    socket.leave(roomName)

    const room = sessionRooms.get(sessionId)
    if (room) {
      if (role === 'tecnico') room.tecnico = null
      if (role === 'auditor') room.auditor = null
    }

    const systemMsg: ChatMessage = {
      id: generateId(),
      sessionId,
      userId: 'system',
      userName: 'Sistema',
      role: 'system',
      content: `${userName} ha abandonado la sesión.`,
      timestamp: new Date().toISOString()
    }
    io.to(roomName).emit('chat-message', systemMsg)
    io.to(roomName).emit('user-left', { userId, role })
  })

  // Chat message
  socket.on('chat-message', (data: { sessionId: string; userId: string; userName: string; role: 'tecnico' | 'auditor'; content: string }) => {
    const { sessionId, userId, userName, role, content } = data
    const roomName = `session-${sessionId}`

    const msg: ChatMessage = {
      id: generateId(),
      sessionId,
      userId,
      userName,
      role,
      content,
      timestamp: new Date().toISOString()
    }
    io.to(roomName).emit('chat-message', msg)
  })

  // Stage update - synchronize stage progression between users
  socket.on('stage-update', (data: StageUpdate) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('stage-update', data)
  })

  // Step completion by technician
  socket.on('step-completed', (data: { sessionId: string; category: string; step: string; tecnicoId: string; value?: string; notes?: string }) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('step-completed', data)
  })

  // Auditor validation
  socket.on('auditor-validation', (data: ValidationEvent) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('auditor-validation', data)
  })

  // Safety block/unblock event
  socket.on('safety-status', (data: { sessionId: string; allCompleted: boolean; stepsCompleted: string[] }) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('safety-status', data)
  })

  // Measurement update in real-time
  socket.on('measurement-update', (data: { sessionId: string; category: string; step: string; value: string; unit: string }) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('measurement-update', data)
  })

  // Session complete
  socket.on('session-complete', (data: { sessionId: string }) => {
    const roomName = `session-${data.sessionId}`
    io.to(roomName).emit('session-complete', data)
  })

  // Typing indicator
  socket.on('typing', (data: { sessionId: string; userId: string; userName: string }) => {
    const roomName = `session-${data.sessionId}`
    socket.to(roomName).emit('typing', data)
  })

  socket.on('disconnect', () => {
    // Clean up room tracking
    sessionRooms.forEach((room, sessionId) => {
      if (room.tecnico === socket.id) room.tecnico = null
      if (room.auditor === socket.id) room.auditor = null
    })
    console.log(`[ChatService] User disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(`[ChatService] Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[ChatService] Socket.io server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[ChatService] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[ChatService] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[ChatService] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[ChatService] Server closed')
    process.exit(0)
  })
})
