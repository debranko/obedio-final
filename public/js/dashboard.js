/**
 * OBEDIO IoT Server Dashboard JavaScript
 */

// Initialize Socket.IO connection
const socket = io();

// UI References
const companyNameElement = document.getElementById('companyName');
const serverStatusElement = document.getElementById('serverStatus');
const serverVersionElement = document.getElementById('serverVersion');
const uptimeElement = document.getElementById('uptime');
const repeatersCountElement = document.getElementById('repeatersCount');
const buttonsCountElement = document.getElementById('buttonsCount');
const smartwatchesCountElement = document.getElementById('smartwatchesCount');
const totalDevicesElement = document.getElementById('totalDevices');
const totalMessagesElement = document.getElementById('totalMessages');
const activeAlertsElement = document.getElementById('activeAlerts');
const messagesPerHourContainer = document.getElementById('messagesPerHourContainer');
const activeDevicesContainer = document.getElementById('activeDevices');
const devicesTableBody = document.getElementById('devicesTableBody');
const messagesList = document.getElementById('messagesList');
const footerVersionElement = document.getElementById('footerVersion');

// Form elements
const settingsForm = document.getElementById('settingsForm');
const mqttBrokerInput = document.getElementById('mqttBroker');
const mqttTopicInput = document.getElementById('mqttTopic');
const refreshIntervalInput = document.getElementById('refreshInterval');
const themeSelect = document.getElementById('theme');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Filters
const deviceSearchInput = document.getElementById('deviceSearchInput');
const deviceTypeFilter = document.getElementById('deviceTypeFilter');
const deviceStatusFilter = document.getElementById('deviceStatusFilter');
const messageSearchInput = document.getElementById('messageSearchInput');
const messageTypeFilter = document.getElementById('messageTypeFilter');

// Modal elements
const deviceDetailModal = document.getElementById('deviceDetailModal');
const closeModalBtn = document.querySelector('.close-modal');
const modalDeviceName = document.getElementById('modalDeviceName');
const deviceDetailContent = document.getElementById('deviceDetailContent');
const deviceMessages = document.getElementById('deviceMessages');

// Global state
let devices = [];
let messages = [];
let stats = {};
let settings = {
  refreshInterval: 5000,
  theme: 'light'
};

// Initialize dashboard
function initDashboard() {
  // Load saved settings
  loadSettings();
  
  // Apply theme
  applyTheme(settings.theme);
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up navigation
  setupNavigation();
}

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('obedioSettings');
  if (savedSettings) {
    settings = { ...settings, ...JSON.parse(savedSettings) };
  }
  
  // Apply to form
  refreshIntervalInput.value = settings.refreshInterval;
  themeSelect.value = settings.theme;
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem('obedioSettings', JSON.stringify(settings));
}

// Apply theme to document
function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Settings form
  settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    settings.refreshInterval = parseInt(refreshIntervalInput.value);
    settings.theme = themeSelect.value;
    saveSettings();
    applyTheme(settings.theme);
  });
  
  resetSettingsBtn.addEventListener('click', function() {
    settings = {
      refreshInterval: 5000,
      theme: 'light'
    };
    saveSettings();
    loadSettings();
    applyTheme(settings.theme);
  });
  
  // Filters
  deviceSearchInput.addEventListener('input', filterDevices);
  deviceTypeFilter.addEventListener('change', filterDevices);
  deviceStatusFilter.addEventListener('change', filterDevices);
  
  messageSearchInput.addEventListener('input', filterMessages);
  messageTypeFilter.addEventListener('change', filterMessages);
  
  // Modal
  closeModalBtn.addEventListener('click', closeModal);
  window.addEventListener('click', function(e) {
    if (e.target === deviceDetailModal) {
      closeModal();
    }
  });
}

// Set up navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('main section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const target = this.getAttribute('href').substring(1);
      
      // Remove active class from all links and sections
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active-section'));
      
      // Add active class to clicked link and corresponding section
      this.classList.add('active');
      document.getElementById(target).classList.add('active-section');
    });
  });
}

// Update dashboard with data
function updateDashboard(data) {
  if (data.devices) devices = data.devices;
  if (data.recentMessages) messages = data.recentMessages;
  if (data.stats) stats = data.stats;
  
  updateStats();
  updateDevicesList();
  updateMessagesList();
}

// Update statistics display
function updateStats() {
  // Update device counts
  repeatersCountElement.textContent = stats.deviceCounts?.repeaters || 0;
  buttonsCountElement.textContent = stats.deviceCounts?.buttons || 0;
  smartwatchesCountElement.textContent = stats.deviceCounts?.smartwatches || 0;
  totalDevicesElement.textContent = 
    (stats.deviceCounts?.repeaters || 0) + 
    (stats.deviceCounts?.buttons || 0) + 
    (stats.deviceCounts?.smartwatches || 0);
  
  // Update message stats
  totalMessagesElement.textContent = stats.totalMessages || 0;
  activeAlertsElement.textContent = stats.activeAlerts || 0;
  
  // Update uptime
  const uptime = stats.uptime || 0;
  let uptimeText = '';
  
  if (uptime < 60) {
    uptimeText = `${Math.floor(uptime)} seconds`;
  } else if (uptime < 3600) {
    uptimeText = `${Math.floor(uptime / 60)} minutes`;
  } else if (uptime < 86400) {
    uptimeText = `${Math.floor(uptime / 3600)} hours`;
  } else {
    uptimeText = `${Math.floor(uptime / 86400)} days`;
  }
  
  uptimeElement.textContent = `Uptime: ${uptimeText}`;
  
  // Update messages per hour chart
  updateMessagesChart();
}

// Update messages per hour chart
function updateMessagesChart() {
  if (!stats.messagesPerHour) return;
  
  messagesPerHourContainer.innerHTML = '';
  
  const barContainer = document.createElement('div');
  barContainer.className = 'bar-container';
  
  // Find max value for scaling
  const maxValue = Math.max(...stats.messagesPerHour);
  
  // Create bars
  stats.messagesPerHour.forEach((count, index) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    
    // Scale height based on maximum value (minimum 1px if there are messages)
    const height = maxValue > 0 ? (count / maxValue) * 100 : 0;
    bar.style.height = `${height}%`;
    
    // Add tooltip
    bar.title = `${index}:00 - ${count} messages`;
    
    barContainer.appendChild(bar);
  });
  
  messagesPerHourContainer.appendChild(barContainer);
}

// Update devices list and table
function updateDevicesList() {
  // Filter devices
  const filteredDevices = filterDevicesArray();
  
  // Update active devices grid (limited to online devices)
  const onlineDevices = filteredDevices.filter(device => device.status === 'online');
  renderActiveDevicesGrid(onlineDevices);
  
  // Update devices table
  renderDevicesTable(filteredDevices);
}

// Render active devices grid
function renderActiveDevicesGrid(onlineDevices) {
  activeDevicesContainer.innerHTML = '';
  
  if (onlineDevices.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No online devices';
    activeDevicesContainer.appendChild(emptyMessage);
    return;
  }
  
  onlineDevices.forEach(device => {
    const deviceCard = document.createElement('div');
    deviceCard.className = 'device-card';
    deviceCard.dataset.id = device.id;
    deviceCard.onclick = () => showDeviceDetails(device);
    
    deviceCard.innerHTML = `
      <div class="device-header">
        <h4>${device.name || device.id}</h4>
        <span class="device-status ${device.status}"></span>
      </div>
      <div class="device-type">${device.type}</div>
      <div>${formatTimeAgo(device.lastSeen)}</div>
    `;
    
    activeDevicesContainer.appendChild(deviceCard);
  });
}

// Render devices table
function renderDevicesTable(devices) {
  devicesTableBody.innerHTML = '';
  
  if (devices.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="6" class="empty-message">No devices found</td>`;
    devicesTableBody.appendChild(emptyRow);
    return;
  }
  
  devices.forEach(device => {
    const row = document.createElement('tr');
    row.dataset.id = device.id;
    
    row.innerHTML = `
      <td>${device.id}</td>
      <td>${device.name || device.id}</td>
      <td>${device.type}</td>
      <td><span class="badge ${device.status}">${device.status}</span></td>
      <td>${formatTimeAgo(device.lastSeen)}</td>
      <td>
        <button type="button" class="view-device-btn">View</button>
      </td>
    `;
    
    // Add event listener for view button
    row.querySelector('.view-device-btn').addEventListener('click', () => {
      showDeviceDetails(device);
    });
    
    devicesTableBody.appendChild(row);
  });
}

// Update messages list
function updateMessagesList() {
  // Filter messages
  const filteredMessages = filterMessagesArray();
  
  messagesList.innerHTML = '';
  
  if (filteredMessages.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No messages found';
    messagesList.appendChild(emptyMessage);
    return;
  }
  
  filteredMessages.forEach(message => {
    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    
    messageItem.innerHTML = `
      <div class="message-header">
        <span class="message-topic">${message.topic}</span>
        <span class="message-time">${formatTimeAgo(message.timestamp)}</span>
      </div>
      <pre class="message-payload">${JSON.stringify(message.payload, null, 2)}</pre>
    `;
    
    messagesList.appendChild(messageItem);
  });
}

// Filter devices based on search and filters
function filterDevices() {
  updateDevicesList();
}

// Filter the devices array based on current filter settings
function filterDevicesArray() {
  const searchValue = deviceSearchInput.value.toLowerCase();
  const typeValue = deviceTypeFilter.value;
  const statusValue = deviceStatusFilter.value;
  
  return devices.filter(device => {
    // Check search term
    const matchesSearch = 
      device.id.toLowerCase().includes(searchValue) ||
      (device.name && device.name.toLowerCase().includes(searchValue));
    
    // Check device type
    const matchesType = typeValue === 'all' || device.type === typeValue;
    
    // Check status
    const matchesStatus = statusValue === 'all' || device.status === statusValue;
    
    return matchesSearch && matchesType && matchesStatus;
  });
}

// Filter messages based on search and filters
function filterMessages() {
  updateMessagesList();
}

// Filter the messages array based on current filter settings
function filterMessagesArray() {
  const searchValue = messageSearchInput.value.toLowerCase();
  const typeValue = messageTypeFilter.value;
  
  return messages.filter(message => {
    // Check search term
    const matchesSearch = 
      message.topic.toLowerCase().includes(searchValue) ||
      JSON.stringify(message.payload).toLowerCase().includes(searchValue);
    
    // Check message type
    let messageType = 'unknown';
    
    if (message.topic.includes('/status/')) {
      messageType = 'status';
    } else if (message.topic.includes('/relay/')) {
      messageType = 'relay';
    } else if (message.topic.includes('/command/')) {
      messageType = 'command';
    }
    
    const matchesType = typeValue === 'all' || messageType === typeValue;
    
    return matchesSearch && matchesType;
  });
}

// Show device details in modal
function showDeviceDetails(device) {
  modalDeviceName.textContent = device.name || device.id;
  
  // Device details
  let detailsHTML = `
    <div class="device-info">
      <p><strong>ID:</strong> ${device.id}</p>
      <p><strong>Type:</strong> ${device.type}</p>
      <p><strong>Status:</strong> <span class="badge ${device.status}">${device.status}</span></p>
      <p><strong>First Seen:</strong> ${formatDate(device.firstSeen)}</p>
      <p><strong>Last Seen:</strong> ${formatDate(device.lastSeen)}</p>
  `;
  
  // Add firmware version if available
  if (device.firmware) {
    detailsHTML += `<p><strong>Firmware:</strong> ${device.firmware}</p>`;
  }
  
  // Add additional details if available
  if (device.details) {
    const details = device.details;
    
    detailsHTML += `<h4>Additional Information</h4><ul>`;
    
    for (const [key, value] of Object.entries(details)) {
      if (key !== 'type' && key !== 'name') {
        detailsHTML += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
      }
    }
    
    detailsHTML += `</ul>`;
  }
  
  detailsHTML += `</div>`;
  deviceDetailContent.innerHTML = detailsHTML;
  
  // Device messages
  deviceMessages.innerHTML = '<h4>Recent Messages</h4>';
  
  if (!device.messages || device.messages.length === 0) {
    deviceMessages.innerHTML += '<p>No messages available</p>';
  } else {
    const messagesList = document.createElement('div');
    messagesList.className = 'messages-list';
    
    device.messages.forEach(message => {
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item';
      
      let messageHeader = '';
      
      if (message.type === 'status') {
        messageHeader = `Status Update`;
      } else if (message.type === 'message') {
        if (message.direction === 'outgoing') {
          messageHeader = `Message to ${message.target}`;
        } else {
          messageHeader = `Message from ${message.source}`;
        }
      } else if (message.type === 'relay') {
        messageHeader = `Relay: ${message.source} → ${message.target}`;
      }
      
      messageItem.innerHTML = `
        <div class="message-header">
          <span class="message-topic">${messageHeader}</span>
          <span class="message-time">${formatTimeAgo(message.timestamp)}</span>
        </div>
        <pre class="message-payload">${JSON.stringify(message.payload, null, 2)}</pre>
      `;
      
      messagesList.appendChild(messageItem);
    });
    
    deviceMessages.appendChild(messagesList);
  }
  
  // Show modal
  deviceDetailModal.style.display = 'block';
}

// Close modal
function closeModal() {
  deviceDetailModal.style.display = 'none';
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return `${diffSec} sec ago`;
  } else if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)} min ago`;
  } else if (diffSec < 86400) {
    return `${Math.floor(diffSec / 3600)} hrs ago`;
  } else {
    return `${Math.floor(diffSec / 86400)} days ago`;
  }
}

// Socket.IO event listeners
socket.on('connect', () => {
  serverStatusElement.className = 'badge online';
  serverStatusElement.textContent = 'Online';
});

socket.on('disconnect', () => {
  serverStatusElement.className = 'badge offline';
  serverStatusElement.textContent = 'Offline';
});

socket.on('init', (data) => {
  // Update company name
  if (data.config && data.config.ui && data.config.ui.companyName) {
    companyNameElement.textContent = data.config.ui.companyName;
  }
  
  // Update version
  if (data.config && data.config.version) {
    serverVersionElement.textContent = `v${data.config.version}`;
    footerVersionElement.textContent = data.config.version;
  }
  
  // Update broker info
  if (data.config && data.config.mqtt) {
    mqttBrokerInput.value = data.config.mqtt.broker;
    mqttTopicInput.value = data.config.mqtt.baseTopic;
  }
  
  // Update dashboard
  updateDashboard(data);
});

socket.on('device-update', (data) => {
  const updatedDevice = data.device;
  
  // Update in devices array
  const index = devices.findIndex(device => device.id === updatedDevice.id);
  
  if (index !== -1) {
    devices[index] = updatedDevice;
  } else {
    devices.push(updatedDevice);
  }
  
  // Update display
  updateDevicesList();
  
  // Update stats if needed
  // This assumes server will send full stats update periodically
  // but we could increment counts here as devices are added
});

socket.on('mqtt-message', (message) => {
  // Add to top of messages list
  messages.unshift(message);
  
  // Keep list at reasonable size
  if (messages.length > 100) {
    messages.pop();
  }
  
  // Update messages display
  updateMessagesList();
});

socket.on('new-alert', (alert) => {
  // Could show a notification or highlight something
  console.log('New alert received:', alert);
  
  // Increment active alerts counter
  if (stats.activeAlerts !== undefined) {
    stats.activeAlerts++;
    activeAlertsElement.textContent = stats.activeAlerts;
  }
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);