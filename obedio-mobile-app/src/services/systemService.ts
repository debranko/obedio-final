import { apiService, handleApiCall } from './api';
import { SystemStatus } from '../types/api';

class SystemService {
  // Get system status for dashboard
  async getSystemStatus() {
    return handleApiCall(async () => {
      return await apiService.get<SystemStatus>('/system/status');
    });
  }

  // Get system health
  async getSystemHealth() {
    return handleApiCall(async () => {
      return await apiService.get('/system/health');
    });
  }

  // Get system events stream (for real-time updates)
  async getEventsStream() {
    return handleApiCall(async () => {
      return await apiService.get('/events/stream');
    });
  }

  // Get MQTT health status
  async getMqttHealth() {
    return handleApiCall(async () => {
      return await apiService.get('/mqtt/health');
    });
  }

  // Get MQTT traffic statistics
  async getMqttTraffic() {
    return handleApiCall(async () => {
      return await apiService.get('/mqtt/traffic');
    });
  }

  // Get MQTT devices status
  async getMqttDevices() {
    return handleApiCall(async () => {
      return await apiService.get('/mqtt/devices');
    });
  }

  // Get system statistics summary
  async getSystemSummary() {
    return handleApiCall(async () => {
      const [status, health, mqttHealth] = await Promise.all([
        this.getSystemStatus(),
        this.getSystemHealth(),
        this.getMqttHealth()
      ]);

      return {
        status: status.data,
        health: health.data,
        mqttHealth: mqttHealth.data,
        timestamp: new Date().toISOString()
      };
    });
  }
}

export const systemService = new SystemService();