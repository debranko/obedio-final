import { VirtualDevice, VirtualDeviceConfig } from './base';

export interface Location {
  lat: number;
  lng: number;
}

export type CrewStatus = 'available' | 'busy' | 'break' | 'offline';

export class VirtualSmartwatch extends VirtualDevice {
  private assignedCrewId?: number;
  private currentLocation: Location;
  private crewStatus: CrewStatus = 'available';
  private activeRequests: number[] = [];
  private lastActivityTime: number = Date.now();

  constructor(config: Omit<VirtualDeviceConfig, 'type'> & {
    assignedCrewId?: number;
    initialLocation?: Location;
  }) {
    super({ ...config, type: 'SMART_WATCH' });
    this.assignedCrewId = config.assignedCrewId;
    this.currentLocation = config.initialLocation || { lat: 0, lng: 0 };
  }

  /**
   * Assign smartwatch to a crew member
   */
  assignToCrew(crewId: number): void {
    this.assignedCrewId = crewId;
    const topic = `obedio/device/${this.config.uid}/assign`;
    const payload = {
      crewId,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('crew_assignment', payload);
    this.emit('assigned', payload);
    this.publishStatus();
  }

  /**
   * Update crew member status
   */
  updateCrewStatus(status: CrewStatus): void {
    const previousStatus = this.crewStatus;
    this.crewStatus = status;
    
    const topic = `obedio/device/${this.config.uid}/crew/status`;
    const payload = {
      crewId: this.assignedCrewId,
      status,
      previousStatus,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('status_change', payload);
    this.emit('status_change', payload);

    // Update activity time
    this.lastActivityTime = Date.now();
  }

  /**
   * Update crew member location
   */
  updateLocation(location: Location): void {
    const previousLocation = { ...this.currentLocation };
    this.currentLocation = location;
    
    const topic = `obedio/device/${this.config.uid}/location`;
    const payload = {
      ...location,
      crewId: this.assignedCrewId,
      previousLocation,
      timestamp: new Date().toISOString(),
      isVirtual: true,
      speed: this.calculateSpeed(previousLocation, location),
      heading: this.calculateHeading(previousLocation, location)
    };

    this.publish(topic, payload);
    this.eventRecorder.record('location_update', payload);
    this.emit('location', payload);
  }

  /**
   * Receive service request notification
   */
  receiveServiceRequest(requestId: number, requestDetails?: any): void {
    if (this.crewStatus === 'offline') {
      console.warn(`Crew member ${this.assignedCrewId} is offline, cannot receive request`);
      return;
    }

    this.activeRequests.push(requestId);
    
    const topic = `obedio/device/${this.config.uid}/notification`;
    const payload = {
      type: 'service_request',
      requestId,
      requestDetails,
      crewId: this.assignedCrewId,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('request_received', payload);
    this.emit('request_received', payload);

    // Simulate vibration/alert
    this.simulateAlert();

    // Auto-accept after delay if available
    if (this.crewStatus === 'available') {
      setTimeout(() => {
        if (this.activeRequests.includes(requestId)) {
          this.acceptRequest(requestId);
        }
      }, 3000);
    }
  }

  /**
   * Accept a service request
   */
  acceptRequest(requestId: number): void {
    if (!this.activeRequests.includes(requestId)) {
      console.warn(`Request ${requestId} not found in active requests`);
      return;
    }

    const topic = `obedio/device/${this.config.uid}/request/accept`;
    const payload = {
      requestId,
      crewId: this.assignedCrewId,
      location: this.currentLocation,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('request_accepted', payload);
    this.emit('request_accepted', payload);
    
    // Update status to busy
    this.updateCrewStatus('busy');
    this.lastActivityTime = Date.now();
  }

  /**
   * Decline a service request
   */
  declineRequest(requestId: number, reason?: string): void {
    const topic = `obedio/device/${this.config.uid}/request/decline`;
    const payload = {
      requestId,
      crewId: this.assignedCrewId,
      reason,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('request_declined', payload);
    this.emit('request_declined', payload);
    
    // Remove from active requests
    this.activeRequests = this.activeRequests.filter(id => id !== requestId);
  }

  /**
   * Complete a service request
   */
  completeRequest(requestId: number, notes?: string): void {
    if (!this.activeRequests.includes(requestId)) {
      console.warn(`Request ${requestId} not found in active requests`);
      return;
    }

    const topic = `obedio/device/${this.config.uid}/request/complete`;
    const payload = {
      requestId,
      crewId: this.assignedCrewId,
      completionNotes: notes,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('request_completed', payload);
    this.emit('request_completed', payload);
    
    // Remove from active requests
    this.activeRequests = this.activeRequests.filter(id => id !== requestId);
    
    // Update status to available if no more active requests
    if (this.activeRequests.length === 0) {
      this.updateCrewStatus('available');
    }
    
    this.lastActivityTime = Date.now();
  }

  /**
   * Send SOS/Emergency signal
   */
  sendSOS(message?: string): void {
    const topic = `obedio/device/${this.config.uid}/sos`;
    const payload = {
      crewId: this.assignedCrewId,
      location: this.currentLocation,
      message,
      battery: this.batteryLevel,
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('sos_sent', payload);
    this.emit('sos', payload);
    
    // Drain battery faster during SOS
    this.batteryLevel = Math.max(0, this.batteryLevel - 5);
    this.publishStatus();
  }

  /**
   * Simulate alert (vibration/sound)
   */
  private simulateAlert(): void {
    this.eventRecorder.record('alert', {
      type: 'vibration',
      duration: 500,
      pattern: [100, 50, 100]
    });
    this.emit('alert');
  }

  /**
   * Calculate speed between two locations
   */
  private calculateSpeed(from: Location, to: Location): number {
    const distance = this.calculateDistance(from, to);
    const timeElapsed = 5; // Assuming 5 seconds between updates
    return (distance / timeElapsed) * 3.6; // Convert m/s to km/h
  }

  /**
   * Calculate heading between two locations
   */
  private calculateHeading(from: Location, to: Location): number {
    const dLon = to.lng - from.lng;
    const y = Math.sin(dLon) * Math.cos(to.lat);
    const x = Math.cos(from.lat) * Math.sin(to.lat) -
              Math.sin(from.lat) * Math.cos(to.lat) * Math.cos(dLon);
    const heading = Math.atan2(y, x);
    return (heading * 180 / Math.PI + 360) % 360;
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(from: Location, to: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δφ = (to.lat - from.lat) * Math.PI / 180;
    const Δλ = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Simulate movement pattern
   */
  simulateMovement(pattern: 'patrol' | 'random' | 'stationary', duration: number): void {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > duration) {
        clearInterval(interval);
        return;
      }

      let newLocation: Location;
      switch (pattern) {
        case 'patrol':
          // Move in a square pattern
          const phase = Math.floor((Date.now() - startTime) / 5000) % 4;
          const delta = 0.0001;
          switch (phase) {
            case 0: newLocation = { lat: this.currentLocation.lat + delta, lng: this.currentLocation.lng }; break;
            case 1: newLocation = { lat: this.currentLocation.lat, lng: this.currentLocation.lng + delta }; break;
            case 2: newLocation = { lat: this.currentLocation.lat - delta, lng: this.currentLocation.lng }; break;
            case 3: newLocation = { lat: this.currentLocation.lat, lng: this.currentLocation.lng - delta }; break;
            default: newLocation = this.currentLocation;
          }
          break;
        case 'random':
          // Random walk
          newLocation = {
            lat: this.currentLocation.lat + (Math.random() - 0.5) * 0.0002,
            lng: this.currentLocation.lng + (Math.random() - 0.5) * 0.0002
          };
          break;
        case 'stationary':
        default:
          newLocation = this.currentLocation;
      }

      this.updateLocation(newLocation);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get smartwatch-specific status
   */
  getStatus(): any {
    const baseStatus = super.getStatus();
    return {
      ...baseStatus,
      assignedCrewId: this.assignedCrewId,
      crewStatus: this.crewStatus,
      location: this.currentLocation,
      activeRequests: this.activeRequests,
      lastActivityTime: new Date(this.lastActivityTime).toISOString()
    };
  }

  /**
   * Simulate fall detection
   */
  simulateFall(): void {
    const topic = `obedio/device/${this.config.uid}/fall`;
    const payload = {
      crewId: this.assignedCrewId,
      location: this.currentLocation,
      severity: 'high',
      timestamp: new Date().toISOString(),
      isVirtual: true
    };

    this.publish(topic, payload);
    this.eventRecorder.record('fall_detected', payload);
    this.emit('fall_detected', payload);
    
    // Automatically send SOS after fall
    setTimeout(() => {
      this.sendSOS('Fall detected - crew member may need assistance');
    }, 2000);
  }
}