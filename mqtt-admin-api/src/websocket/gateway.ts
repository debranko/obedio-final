import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { wsLogger, logOperation } from '@/utils/logger';
import { RedisService } from '@/utils/redis';
import { MqttService, MqttMessage, DeviceStatus } from '@/services/mqttService';

export interface WebSocketConnection {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>;
  metadata: {
    userAgent?: string;
    ip?: string;
    connectedAt: Date;
    lastPing?: Date;
  };
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  id?: string;
}

export class WebSocketGateway extends EventEmitter {
  private wss: WebSocketServer;
  private connections = new Map<string, WebSocketConnection>();
  private heartbeatInterval?: NodeJS.Timeout;
  private mqttService: MqttService;

  constructor(server: HttpServer, mqttService: MqttService) {
    super();
    
    this.mqttService = mqttService;
    
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: false,
    });

    this.setupWebSocketServer();
    this.setupMqttListeners();
    this.startHeartbeat();

    wsLogger.info('WebSocket Gateway initialized');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const connectionId = uuidv4();
      const ip = request.socket.remoteAddress || 'unknown';
      const userAgent = request.headers['user-agent'] || 'unknown';

      const connection: WebSocketConnection = {
        id: connectionId,
        ws,
        isAlive: true,
        subscriptions: new Set(),
        metadata: {
          userAgent,
          ip,
          connectedAt: new Date(),
          lastPing: new Date(),
        },
      };

      this.connections.set(connectionId, connection);

      wsLogger.info({
        connectionId,
        ip,
        userAgent,
        totalConnections: this.connections.size,
      }, 'WebSocket client connected');

      // Store connection in Redis
      RedisService.addWebSocketConnection(connectionId, {
        ip,
        userAgent,
        connectedAt: connection.metadata.connectedAt,
      });

      // Send welcome message
      this.sendToConnection(connectionId, {
        type: 'welcome',
        data: {
          connectionId,
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      // Setup message handler
      ws.on('message', (data: Buffer) => {
        this.handleMessage(connectionId, data);
      });

      // Handle connection close
      ws.on('close', (code: number, reason: Buffer) => {
        this.handleDisconnection(connectionId, code, reason.toString());
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        wsLogger.error({
          connectionId,
          error: error.message,
        }, 'WebSocket connection error');
      });

      // Handle pong responses for heartbeat
      ws.on('pong', () => {
        const conn = this.connections.get(connectionId);
        if (conn) {
          conn.isAlive = true;
          conn.metadata.lastPing = new Date();
        }
      });

      // Send initial data
      this.sendInitialData(connectionId);
    });

    this.wss.on('error', (error: Error) => {
      wsLogger.error('WebSocket server error:', error);
    });
  }

  private setupMqttListeners(): void {
    // Forward MQTT messages to WebSocket clients
    this.mqttService.on('message', (message: MqttMessage) => {
      this.broadcastToSubscribers('mqtt:message', message);
    });

    // Forward device status updates
    this.mqttService.on('deviceStatus', (status: DeviceStatus) => {
      this.broadcastToSubscribers('device:status', status);
    });

    // Forward emergency alerts
    this.mqttService.on('emergency', (emergency: any) => {
      this.broadcastToSubscribers('device:emergency', emergency);
    });

    // Forward device data
    this.mqttService.on('deviceData', (data: any) => {
      this.broadcastToSubscribers('device:data', data);
    });
  }

  private async handleMessage(connectionId: string, data: Buffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      wsLogger.debug({
        connectionId,
        messageType: message.type,
      }, 'Received WebSocket message');

      switch (message.type) {
        case 'ping':
          this.sendToConnection(connectionId, {
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'subscribe':
          await this.handleSubscription(connectionId, message.data);
          break;

        case 'unsubscribe':
          await this.handleUnsubscription(connectionId, message.data);
          break;

        case 'mqtt:publish':
          await this.handleMqttPublish(connectionId, message.data);
          break;

        case 'device:command':
          await this.handleDeviceCommand(connectionId, message.data);
          break;

        case 'get:recent_messages':
          await this.handleGetRecentMessages(connectionId, message.data);
          break;

        default:
          wsLogger.warn({
            connectionId,
            messageType: message.type,
          }, 'Unknown WebSocket message type');
      }

    } catch (error) {
      wsLogger.error({
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Error handling WebSocket message');

      this.sendToConnection(connectionId, {
        type: 'error',
        data: {
          message: 'Invalid message format',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleSubscription(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !data?.topic) {
      return;
    }

    connection.subscriptions.add(data.topic);

    wsLogger.debug({
      connectionId,
      topic: data.topic,
      totalSubscriptions: connection.subscriptions.size,
    }, 'Client subscribed to topic');

    this.sendToConnection(connectionId, {
      type: 'subscribed',
      data: {
        topic: data.topic,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleUnsubscription(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !data?.topic) {
      return;
    }

    connection.subscriptions.delete(data.topic);

    wsLogger.debug({
      connectionId,
      topic: data.topic,
      totalSubscriptions: connection.subscriptions.size,
    }, 'Client unsubscribed from topic');

    this.sendToConnection(connectionId, {
      type: 'unsubscribed',
      data: {
        topic: data.topic,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleMqttPublish(connectionId: string, data: any): Promise<void> {
    if (!data?.topic || !data?.payload) {
      return;
    }

    try {
      await this.mqttService.publishMessage(data.topic, data.payload, {
        qos: data.qos || 1,
        retain: data.retain || false,
      });

      this.sendToConnection(connectionId, {
        type: 'mqtt:published',
        data: {
          topic: data.topic,
          success: true,
        },
        timestamp: new Date().toISOString(),
      });

      logOperation('websocket_mqtt_publish', {
        connectionId,
        topic: data.topic,
        payloadSize: JSON.stringify(data.payload).length,
      });

    } catch (error) {
      wsLogger.error({
        connectionId,
        topic: data.topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to publish MQTT message via WebSocket');

      this.sendToConnection(connectionId, {
        type: 'mqtt:publish_error',
        data: {
          topic: data.topic,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleDeviceCommand(connectionId: string, data: any): Promise<void> {
    if (!data?.deviceId || !data?.command) {
      return;
    }

    try {
      await this.mqttService.sendDeviceCommand(data.deviceId, data.command, data.params);

      this.sendToConnection(connectionId, {
        type: 'device:command_sent',
        data: {
          deviceId: data.deviceId,
          command: data.command,
          success: true,
        },
        timestamp: new Date().toISOString(),
      });

      logOperation('websocket_device_command', {
        connectionId,
        deviceId: data.deviceId,
        command: data.command,
      });

    } catch (error) {
      wsLogger.error({
        connectionId,
        deviceId: data.deviceId,
        command: data.command,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send device command via WebSocket');

      this.sendToConnection(connectionId, {
        type: 'device:command_error',
        data: {
          deviceId: data.deviceId,
          command: data.command,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleGetRecentMessages(connectionId: string, data: any): Promise<void> {
    try {
      const topicPattern = data?.topicPattern || 'obedio/#';
      const limit = data?.limit || 50;

      const recentMessages = await this.mqttService.getRecentMessages(topicPattern, limit);

      this.sendToConnection(connectionId, {
        type: 'recent_messages',
        data: {
          topicPattern,
          messages: recentMessages,
          count: recentMessages.length,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      wsLogger.error({
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to get recent messages');
    }
  }

  private handleDisconnection(connectionId: string, code: number, reason: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    wsLogger.info({
      connectionId,
      code,
      reason,
      duration: Date.now() - connection.metadata.connectedAt.getTime(),
      totalConnections: this.connections.size - 1,
    }, 'WebSocket client disconnected');

    // Remove from Redis
    RedisService.removeWebSocketConnection(connectionId);

    // Remove from local connections
    this.connections.delete(connectionId);
  }

  private async sendInitialData(connectionId: string): Promise<void> {
    try {
      // Send MQTT connection status
      const mqttStatus = this.mqttService.getConnectionInfo();
      this.sendToConnection(connectionId, {
        type: 'mqtt:status',
        data: mqttStatus,
        timestamp: new Date().toISOString(),
      });

      // Send recent system messages
      const recentMessages = await this.mqttService.getRecentMessages('obedio/system/#', 10);
      this.sendToConnection(connectionId, {
        type: 'system:recent_messages',
        data: recentMessages,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      wsLogger.error({
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send initial data');
    }
  }

  private sendToConnection(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const messageWithId = {
        ...message,
        id: message.id || uuidv4(),
      };

      connection.ws.send(JSON.stringify(messageWithId));
    } catch (error) {
      wsLogger.error({
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send message to WebSocket client');
    }
  }

  private broadcastToSubscribers(topic: string, data: any): void {
    const message: WebSocketMessage = {
      type: topic,
      data,
      timestamp: new Date().toISOString(),
      id: uuidv4(),
    };

    let sentCount = 0;

    for (const [connectionId, connection] of this.connections) {
      // Check if client is subscribed to this topic or wildcard
      const isSubscribed = connection.subscriptions.has(topic) ||
                          connection.subscriptions.has('*') ||
                          Array.from(connection.subscriptions).some(sub => 
                            sub.includes('*') && topic.startsWith(sub.replace('*', ''))
                          );

      if (isSubscribed && connection.ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(connectionId, message);
        sentCount++;
      }
    }

    if (sentCount > 0) {
      wsLogger.debug({
        topic,
        recipients: sentCount,
        totalConnections: this.connections.size,
      }, 'Broadcasted message to subscribers');
    }
  }

  public broadcast(message: WebSocketMessage): void {
    let sentCount = 0;

    for (const [connectionId, connection] of this.connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(connectionId, message);
        sentCount++;
      }
    }

    wsLogger.debug({
      messageType: message.type,
      recipients: sentCount,
      totalConnections: this.connections.size,
    }, 'Broadcasted message to all clients');
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const deadConnections: string[] = [];

      for (const [connectionId, connection] of this.connections) {
        if (!connection.isAlive) {
          deadConnections.push(connectionId);
          continue;
        }

        connection.isAlive = false;
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.ping();
        }
      }

      // Clean up dead connections
      deadConnections.forEach(connectionId => {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.ws.terminate();
          this.handleDisconnection(connectionId, 1006, 'Heartbeat timeout');
        }
      });

      if (deadConnections.length > 0) {
        wsLogger.info({
          removedConnections: deadConnections.length,
          activeConnections: this.connections.size,
        }, 'Cleaned up dead WebSocket connections');
      }

    }, 30000); // 30 second heartbeat
  }

  public async close(): Promise<void> {
    wsLogger.info('Closing WebSocket Gateway...');

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      connection.ws.close(1001, 'Server shutting down');
      await RedisService.removeWebSocketConnection(connectionId);
    }

    this.connections.clear();

    // Close WebSocket server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        wsLogger.info('WebSocket Gateway closed');
        resolve();
      });
    });
  }

  public getStats() {
    const connections = Array.from(this.connections.values());
    const now = Date.now();

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.ws.readyState === WebSocket.OPEN).length,
      subscriptions: connections.reduce((total, c) => total + c.subscriptions.size, 0),
      averageConnectionTime: connections.length > 0 
        ? connections.reduce((total, c) => total + (now - c.metadata.connectedAt.getTime()), 0) / connections.length 
        : 0,
      connectionsByUserAgent: connections.reduce((acc, c) => {
        const ua = c.metadata.userAgent || 'unknown';
        acc[ua] = (acc[ua] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default WebSocketGateway;