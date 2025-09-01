# Crew Management v2 Implementation

## Overview
The Crew Management v2 page provides a comprehensive interface for managing yacht crew members with enhanced features and improved UI/UX.

## Features Implemented

### 1. Enhanced Crew Cards (CrewCardV2)
- **Rich Information Display**:
  - Avatar with online/offline status indicator
  - Name, role, and department
  - Contact information (phone, email)
  - Cabin assignment
  - Work hours tracking with progress bar
  - Smartwatch battery status
  - Certifications badges (medical, safety)
  - Active requests count
  - Next shift information

- **Quick Actions**:
  - Call crew member (opens phone dialer)
  - Send message (opens email client)
  - Assign shift (TODO: implement modal)

- **Visual Indicators**:
  - Department-based color coding on left border
  - Status badges (On Duty, Available, On Leave)
  - Drag-and-drop support for crew assignment

### 2. Database Schema Updates
Added new fields to User model:
```prisma
phone          String?
cabin          String?
certifications String?   // JSON array of certifications
emergencyContact String? // JSON object with name and phone
status         String?   // on_duty, off_duty, on_leave
```

### 3. API Enhancements
Updated `/api/crew` endpoint to:
- Include active requests count
- Calculate hours worked this week
- Return additional crew member fields
- Support filtering by department and status

### 4. UI/UX Improvements
- **Search and Filters**: Real-time search with department and status filters
- **Responsive Layout**: 30/70 split between crew list and calendar
- **Loading States**: Skeleton loaders for better perceived performance
- **Error Handling**: Toast notifications for actions

## Pending Features

### 1. Shift Assignment Modal
- Create modal for assigning shifts to crew members
- Integration with duty calendar

### 2. Real Battery Status
- Integrate with MQTT for real-time smartwatch battery status
- Currently using mock data

### 3. Work Hours Calculation
- Implement proper calculation based on shift history
- Weekly/monthly reports

### 4. Emergency Contact Management
- UI for adding/editing emergency contacts
- Quick access in emergencies

### 5. Certification Management
- Add/remove certifications
- Expiry date tracking
- Renewal reminders

## Technical Debt
1. Move mock battery data to real MQTT integration
2. Implement proper shift assignment functionality
3. Add unit tests for new components
4. Optimize API queries for better performance

## Usage

### Adding a Crew Member
1. Click "Add Crew" button
2. Fill in required fields (name, password, role)
3. Optional: Add department, phone, cabin, etc.
4. Click "Add Crew Member"

### Managing Crew
1. Use search bar to find specific crew members
2. Filter by department or status
3. Click on crew card to view details
4. Use quick actions for immediate tasks

### Drag and Drop
- Drag crew cards to calendar for shift assignment (pending implementation)
- Visual feedback during drag operation

## API Reference

### GET /api/crew
Returns array of crew members with:
```json
{
  "id": 1,
  "name": "John Doe",
  "role": "Captain",
  "department": "Deck",
  "phone": "+1234567890",
  "cabin": "A12",
  "onDuty": true,
  "onLeave": false,
  "hoursThisWeek": 32,
  "activeRequests": 2,
  "certifications": ["medical", "safety"],
  "assignedSmartwatchUid": "SW001",
  "activeShift": {...},
  "nextShift": {...}
}
```

### POST /api/crew
Create new crew member with required fields:
- name (string)
- password (string)
- role (string)

Optional fields:
- email, department, phone, cabin, certifications, etc.

## Component Structure

```
crew-v2/
├── page.tsx              # Main page component
├── components/
│   ├── crew-card-v2.tsx  # Enhanced crew card
│   ├── duty-calendar-v2.tsx # Calendar component
│   ├── crew-groups-v2.tsx   # Groups management
│   └── crew-settings-v2.tsx # Settings panel
```

## Future Enhancements
1. **Crew Analytics**: Performance metrics, attendance tracking
2. **Mobile App Integration**: Push notifications, location tracking
3. **AI Scheduling**: Automatic shift optimization
4. **Document Management**: Certificates, contracts storage
5. **Training Tracker**: Skills development, course completion