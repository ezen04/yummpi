import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../middleware/auth.js'

export function registerMeetingHandlers(io: Server, socket: Socket & { data: SocketData }) {
  const { memberId, meetingId, role } = socket.data

  socket.on('meeting:join', async (payload: { meetingId: string }) => {
    if (payload.meetingId !== meetingId) return

    const room = `meeting:${meetingId}`
    await socket.join(room)

    socket.to(room).emit('member:joined', { meetingId, memberId, role })
    console.log(`[meeting:join] member=${memberId} room=${room}`)
  })

  socket.on('meeting:leave', async (payload: { meetingId: string }) => {
    if (payload.meetingId !== meetingId) return

    const room = `meeting:${meetingId}`
    await socket.leave(room)

    socket.to(room).emit('member:left', { meetingId, memberId })
    console.log(`[meeting:leave] member=${memberId} room=${room}`)
  })

  socket.on('disconnect', async () => {
    const room = `meeting:${meetingId}`
    // socket.leave는 disconnect 시 자동 처리되므로 브로드캐스트만
    socket.to(room).emit('member:left', { meetingId, memberId })
    console.log(`[disconnect] member=${memberId} room=${room}`)
  })
}
