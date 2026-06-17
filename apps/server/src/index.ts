import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT ?? 4000;

io.on('connection', (socket) => {
  console.log(`connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
