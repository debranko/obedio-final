import { VirtualDevice, VirtualDeviceConfig } from './base';

export interface ButtonPressOptions {
  voiceMessage?: string;
  emergency?: boolean;
  longPress?: boolean;
}

export class VirtualSmartButton extends VirtualDevice {
  private pressCount: number = 0;
  private lastPressTime: number = 0;

  constructor(config: Omit<VirtualDeviceConfig, 'type'>) {
    super({ ...config, type: 'BUTTON' });
  }

  /**
   * Simulate a button press
   */
  press(options?: ButtonPressOptions): void {
    if (!this.isOnline || !this.mqttClient?.connected) {
      console.warn(`Virtual button ${this.config.uid} is offline, cannot press`);
      return;
    }

    this.pressCount++;
    this.lastPressTime = Date.now();

    const topic = `obedio/device/${this.config.uid}/press`;
    const payload = {
      pressType: options?.longPress ? 'long' : 'short',
      emergency: options?.emergency || false,
      voiceMessage: options?.voiceMessage,
      pressCount: this.pressCount,
      timestamp: new Date().toISOString(),
      isVirtual: true,
      room: this.config.room,
      deviceName: this.config.name
    };

    this.publish(topic, payload);
    this.eventRecorder.record('button_press', payload);
    this.emit('press', payload);

    // Simulate battery drain from button press
    this.batteryLevel = Math.max(0, this.batteryLevel - 0.5);
    this.publishStatus();

    // If voice message, simulate voice recording
    if (options?.voiceMessage) {
      this.simulateVoiceRecording(options.voiceMessage);
    }
  }

  /**
   * Simulate voice recording and transcription
   */
  private simulateVoiceRecording(transcript: string): void {
    // Simulate a delay for voice processing
    setTimeout(() => {
      const voiceTopic = `obedio/device/${this.config.uid}/voice`;
      const voicePayload = {
        transcript,
        duration: Math.max(1, transcript.length * 0.1), // Rough estimate
        timestamp: new Date().toISOString(),
        isVirtual: true,
        quality: 'high',
        language: 'en'
      };

      this.publish(voiceTopic, voicePayload);
      this.eventRecorder.record('voice_recording', voicePayload);
      this.emit('voice', voicePayload);
    }, 500); // 500ms delay to simulate processing
  }

  /**
   * Simulate multiple rapid presses (stress test)
   */
  rapidPress(count: number, intervalMs: number = 100): void {
    let pressedCount = 0;
    const interval = setInterval(() => {
      if (pressedCount >= count) {
        clearInterval(interval);
        return;
      }
      this.press();
      pressedCount++;
    }, intervalMs);
  }

  /**
   * Simulate emergency button press
   */
  emergencyPress(message?: string): void {
    this.press({
      emergency: true,
      longPress: true,
      voiceMessage: message || 'Emergency! Need immediate assistance!'
    });
  }

  /**
   * Get button-specific status
   */
  getStatus(): any {
    const baseStatus = super.getStatus();
    return {
      ...baseStatus,
      pressCount: this.pressCount,
      lastPressTime: this.lastPressTime ? new Date(this.lastPressTime).toISOString() : null
    };
  }

  /**
   * Simulate button malfunction
   */
  simulateMalfunction(type: 'stuck' | 'unresponsive'): void {
    this.eventRecorder.record('malfunction', { type });

    switch (type) {
      case 'stuck':
        // Simulate stuck button - rapid repeated presses
        this.rapidPress(10, 50);
        break;
      case 'unresponsive':
        // Override press method to do nothing
        const originalPress = this.press.bind(this);
        this.press = () => {
          console.log(`Button ${this.config.uid} is unresponsive`);
          this.eventRecorder.record('press_failed', { reason: 'unresponsive' });
        };
        // Restore after 30 seconds
        setTimeout(() => {
          this.press = originalPress;
          this.eventRecorder.record('malfunction_resolved', { type });
        }, 30000);
        break;
    }
  }
}