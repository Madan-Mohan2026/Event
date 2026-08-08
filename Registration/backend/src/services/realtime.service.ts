import { Request, Response } from 'express';

interface ClientConnection {
  id: string;
  res: Response;
}

let clients: ClientConnection[] = [];

/**
 * Server-Sent Events (SSE) Stream handler for real-time dashboard updates.
 */
export const realtimeStreamHandler = (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (!res.getHeader('Access-Control-Allow-Origin')) {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  if (res.flushHeaders) {
    res.flushHeaders();
  }

  const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newClient: ClientConnection = { id: clientId, res };

  clients.push(newClient);

  // Send immediate connection ACK event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: Date.now() })}\n\n`);

  // Heartbeat ping every 25 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      // Ignore error
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients = clients.filter(c => c.id !== clientId);
  });
};

/**
 * Broadcast real-time event to all connected dashboard clients.
 */
export const broadcastRealtimeEvent = (type: string, payload: Record<string, any> = {}): void => {
  const eventData = JSON.stringify({
    type,
    payload,
    timestamp: Date.now()
  });

  clients.forEach(client => {
    try {
      client.res.write(`data: ${eventData}\n\n`);
    } catch (err) {
      // Ignore write errors for disconnected clients
    }
  });
};
