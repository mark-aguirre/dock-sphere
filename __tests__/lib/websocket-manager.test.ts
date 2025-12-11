import { WebSocketManager } from '@/lib/websocket-manager';
import { WebSocket, WebSocketServer } from 'ws';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockWss: any;
  
  beforeEach(() => {
    mockWss = {
      on: jest.fn()
    };
    wsManager = new WebSocketManager(mockWss);
  });

  test('should initialize with empty clients map', () => {
    expect(wsManager.getClientCount()).toBe(0);
  });

  test('should register a new connection', () => {
    const mockWs: any = {
      send: jest.fn(),
      readyState: WebSocket.OPEN,
      on: jest.fn()
    };
    
    wsManager.registerConnection(mockWs, 'test-client-1');
    
    expect(wsManager.getClientCount()).toBe(1);
    expect(mockWs.send).toHaveBeenCalled();
  });

  test('should unregister a connection', () => {
    const mockWs: any = {
      send: jest.fn(),
      readyState: WebSocket.OPEN,
      on: jest.fn()
    };
    
    wsManager.registerConnection(mockWs, 'test-client-1');
    wsManager.unregisterConnection('test-client-1');
    
    expect(wsManager.getClientCount()).toBe(0);
  });

  test('should broadcast to all clients', () => {
    const mockWs1: any = { send: jest.fn(), readyState: WebSocket.OPEN, on: jest.fn() };
    const mockWs2: any = { send: jest.fn(), readyState: WebSocket.OPEN, on: jest.fn() };
    
    wsManager.registerConnection(mockWs1, 'client-1');
    wsManager.registerConnection(mockWs2, 'client-2');
    
    wsManager.broadcast('test-event', { data: 'test' });
    
    expect(mockWs1.send).toHaveBeenCalledTimes(2); // welcome + broadcast
    expect(mockWs2.send).toHaveBeenCalledTimes(2);
  });
});
