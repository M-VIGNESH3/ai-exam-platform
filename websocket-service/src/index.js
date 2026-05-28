import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 6001;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Standalone WS] Client connected. Total sessions: ${clients.size}`);

  ws.on('message', (message) => {
    try {
      const dataStr = message.toString();
      console.log('[Standalone WS] Message received:', dataStr);

      // Broadcast to all other connected clients
      clients.forEach(client => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(dataStr);
        }
      });
    } catch (err) {
      console.error('[Standalone WS] Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Standalone WS] Client disconnected. Active sessions: ${clients.size}`);
  });
});

console.log(`===============================================`);
console.log(`  OmniProctor Dedicated WebSocket Server active `);
console.log(`  Running on ws://localhost:${PORT}             `);
console.log(`===============================================`);
