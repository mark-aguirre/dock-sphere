import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  ws: WebSocket;
  subscriptions: Set<string>;
}

/**
 * WebSocket Manager for handling real-time communication
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Client>;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = new Map();
    
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      this.registerConnection(ws, clientId);
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });
      
      ws.on('close', () => {
        this.unregisterConnection(clientId);
      });
      
      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  registerConnection(ws: WebSocket, clientId: string): void {
    this.clients.set(clientId, {
      ws,
      subscriptions: new Set()
    });
    
    this.sendToClient(clientId, 'connected', { clientId });
    console.log(`WebSocket client connected: ${clientId}`);
  }

  unregisterConnection(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);
  }

  broadcast(event: string, data: any): void {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  sendToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
      client.ws.send(message);
    }
  }

  handleMessage(clientId: string, data: any): void {
    const { type, payload } = data;
    
    switch (type) {
      case 'subscribe':
        this.subscribe(clientId, payload.channel);
        break;
      case 'unsubscribe':
        this.unsubscribe(clientId, payload.channel);
        break;
      case 'ping':
        this.sendToClient(clientId, 'pong', { timestamp: Date.now() });
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(channel);
      this.sendToClient(clientId, 'subscribed', { channel });
    }
  }

  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(channel);
      this.sendToClient(clientId, 'unsubscribed', { channel });
    }
  }

  broadcastToChannel(channel: string, event: string, data: any): void {
    const message = JSON.stringify({ event, data, channel, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
