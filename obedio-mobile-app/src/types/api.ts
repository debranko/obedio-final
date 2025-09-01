// API Response Types based on OBEDIO_SYSTEM analysis

export interface User {
  id: number;
  name: string;
  email?: string;
  role: string;
  department?: string;
  team?: string;
  phone?: string;
  cabin?: string;
  status?: string;
  languages?: string[];
  emergency_contact?: any;
  certifications?: string[];
  skills?: string[];
  batteryLevel?: number;
  workloadHours?: number;
  onDuty: boolean;
  onLeave?: boolean;
  activeShift?: {
    id: number;
    startsAt: string;
    endsAt: string;
  };
  currentShift?: {
    startTime: string;
    endTime: string;
    hoursLeft: number;
  };
  assignedSmartwatchUid?: string;
  avatar?: string;
  updatedAt: string;
  hoursThisWeek: number;
  activeRequests: number;
}

export interface Device {
  id: number;
  uid: string;
  name?: string;
  room: string;
  locationId?: number;
  type: 'BUTTON' | 'SMART_WATCH' | 'REPEATER';
  battery: number;
  signal: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: number;
  deviceId: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
  notes?: string;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  device: {
    id: number;
    name?: string;
    room: string;
    type: string;
  };
  assignedUser?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface SystemStatus {
  devices: {
    total: number;
    online: number;
    offline: number;
    lowBattery: number;
    lowSignal: number;
    uptime: number;
  };
  requests: {
    active: number;
    today: {
      new: number;
      completed: number;
    };
    byStatus: Record<string, number>;
    statusCounts: Array<{
      status: string;
      count: number;
    }>;
    averageResponseTime: number;
  };
  topDevices: Array<{
    id: number;
    name: string;
    room: string;
    requestCount: number;
  }>;
  timestamp: string;
}

// API Request/Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Query parameters
export interface RequestsQuery {
  page?: number;
  limit?: number;
  status?: string;
  deviceId?: number;
  assignedTo?: number;
}

export interface DevicesQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
  battery?: string;
}

export interface CrewQuery {
  role?: string;
  search?: string;
  onDuty?: boolean;
}