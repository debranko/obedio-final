-- =================================================================
-- Obedio MQTT Database Schema
-- PostgreSQL Initialization Script
-- =================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =================================================================
-- MQTT Device Management Tables
-- =================================================================

-- MQTT Security Profiles
CREATE TABLE IF NOT EXISTS mqtt_security_profiles (
    id SERIAL PRIMARY KEY,
    profile_name VARCHAR(100) UNIQUE NOT NULL,
    acl_pattern TEXT NOT NULL,
    max_qos INTEGER DEFAULT 1 CHECK (max_qos IN (0, 1, 2)),
    max_connections INTEGER DEFAULT 1,
    client_cert_required BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MQTT Devices Table (extends existing Device functionality)
CREATE TABLE IF NOT EXISTS mqtt_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    site VARCHAR(50) NOT NULL,
    room VARCHAR(100) NOT NULL,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('button', 'watch', 'repeater', 'sensor')),
    mqtt_client_id VARCHAR(100) UNIQUE,
    last_will_topic VARCHAR(255),
    last_will_message TEXT,
    security_profile_id INTEGER REFERENCES mqtt_security_profiles(id),
    mqtt_username VARCHAR(100),
    mqtt_password_hash VARCHAR(255),
    client_certificate_id VARCHAR(100),
    is_online BOOLEAN DEFAULT false,
    last_mqtt_activity TIMESTAMP,
    mqtt_subscriptions JSONB DEFAULT '[]',
    device_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Link to existing Device table
    legacy_device_id INTEGER,
    
    -- Constraints
    UNIQUE(site, room, device_type, device_id),
    CHECK (device_id ~ '^[a-zA-Z0-9_-]+$')
);

-- MQTT Traffic Log for monitoring and analytics
CREATE TABLE IF NOT EXISTS mqtt_traffic_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    qos INTEGER CHECK (qos IN (0, 1, 2)),
    payload_size INTEGER DEFAULT 0,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(20) DEFAULT 'data',
    client_ip INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Partitioning hint
    CONSTRAINT mqtt_traffic_logs_timestamp_check CHECK (timestamp >= '2024-01-01')
);

-- MQTT Sessions for tracking device connections
CREATE TABLE IF NOT EXISTS mqtt_sessions (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(100) UNIQUE NOT NULL,
    device_id VARCHAR(50) REFERENCES mqtt_devices(device_id),
    client_ip INET,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    clean_session BOOLEAN DEFAULT true,
    keep_alive INTEGER DEFAULT 60,
    protocol_version INTEGER DEFAULT 4,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_data JSONB DEFAULT '{}'
);

-- MQTT Certificates for device authentication
CREATE TABLE IF NOT EXISTS mqtt_certificates (
    id SERIAL PRIMARY KEY,
    certificate_id VARCHAR(100) UNIQUE NOT NULL,
    device_id VARCHAR(50) REFERENCES mqtt_devices(device_id),
    common_name VARCHAR(255) NOT NULL,
    certificate_pem TEXT NOT NULL,
    private_key_pem TEXT,
    ca_certificate_pem TEXT,
    serial_number VARCHAR(100),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Check certificate is not expired
    CONSTRAINT cert_validity_check CHECK (valid_to > valid_from)
);

-- =================================================================
-- Enhanced Existing Tables for MQTT Integration
-- =================================================================

-- Add MQTT-specific columns to existing Device table if it exists
DO $$ 
BEGIN
    -- Add columns to existing Device table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Device') THEN
        BEGIN
            ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS mqtt_device_id VARCHAR(50);
            ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS last_mqtt_activity TIMESTAMP;
            ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS mqtt_subscriptions TEXT;
            ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS security_profile_id INTEGER;
            
            -- Create index on mqtt_device_id
            CREATE INDEX IF NOT EXISTS idx_device_mqtt_device_id ON "Device"(mqtt_device_id);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not modify Device table: %', SQLERRM;
        END;
    END IF;
END $$;

-- =================================================================
-- Indexes for Performance
-- =================================================================

-- MQTT Devices indexes
CREATE INDEX IF NOT EXISTS idx_mqtt_devices_site_room ON mqtt_devices(site, room);
CREATE INDEX IF NOT EXISTS idx_mqtt_devices_type ON mqtt_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_mqtt_devices_online ON mqtt_devices(is_online);
CREATE INDEX IF NOT EXISTS idx_mqtt_devices_last_activity ON mqtt_devices(last_mqtt_activity);
CREATE INDEX IF NOT EXISTS idx_mqtt_devices_client_id ON mqtt_devices(mqtt_client_id);

-- Traffic logs indexes (for analytics)
CREATE INDEX IF NOT EXISTS idx_mqtt_traffic_device_timestamp ON mqtt_traffic_logs(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_traffic_topic_timestamp ON mqtt_traffic_logs(topic, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_traffic_direction ON mqtt_traffic_logs(direction);
CREATE INDEX IF NOT EXISTS idx_mqtt_traffic_timestamp ON mqtt_traffic_logs(timestamp DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_mqtt_sessions_device_id ON mqtt_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_sessions_connected_at ON mqtt_sessions(connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_sessions_active ON mqtt_sessions(disconnected_at) WHERE disconnected_at IS NULL;

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_mqtt_certificates_device_id ON mqtt_certificates(device_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_certificates_valid_to ON mqtt_certificates(valid_to);
CREATE INDEX IF NOT EXISTS idx_mqtt_certificates_not_revoked ON mqtt_certificates(is_revoked) WHERE is_revoked = false;

-- =================================================================
-- Triggers for Updated Timestamps
-- =================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_mqtt_security_profiles_updated_at 
    BEFORE UPDATE ON mqtt_security_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mqtt_devices_updated_at 
    BEFORE UPDATE ON mqtt_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- Default Security Profiles
-- =================================================================

INSERT INTO mqtt_security_profiles (profile_name, acl_pattern, max_qos, max_connections, client_cert_required, description)
VALUES 
    ('button_device', 'obedio/${site}/${room}/button/${device_id}/#', 1, 1, false, 'Standard button device profile'),
    ('watch_device', 'obedio/${site}/${room}/watch/${device_id}/#', 1, 1, false, 'Smart watch device profile'),
    ('repeater_device', 'obedio/${site}/${room}/repeater/${device_id}/#', 2, 2, false, 'Mesh repeater device profile'),
    ('admin_service', 'obedio/#', 2, 5, true, 'Administrative service profile'),
    ('provisioning_service', 'obedio/system/provision/#', 1, 3, false, 'Device provisioning service profile')
ON CONFLICT (profile_name) DO NOTHING;

-- =================================================================
-- Views for Common Queries
-- =================================================================

-- View for active MQTT devices with last activity
CREATE OR REPLACE VIEW mqtt_devices_status AS
SELECT 
    md.device_id,
    md.site,
    md.room,
    md.device_type,
    md.mqtt_client_id,
    md.is_online,
    md.last_mqtt_activity,
    sp.profile_name as security_profile,
    CASE 
        WHEN md.last_mqtt_activity > (CURRENT_TIMESTAMP - INTERVAL '5 minutes') THEN 'online'
        WHEN md.last_mqtt_activity > (CURRENT_TIMESTAMP - INTERVAL '1 hour') THEN 'recently_active'
        ELSE 'offline'
    END as connection_status,
    md.created_at,
    md.updated_at
FROM mqtt_devices md
LEFT JOIN mqtt_security_profiles sp ON md.security_profile_id = sp.id;

-- View for traffic analytics
CREATE OR REPLACE VIEW mqtt_traffic_summary AS
SELECT 
    device_id,
    DATE_TRUNC('hour', timestamp) as hour,
    direction,
    COUNT(*) as message_count,
    SUM(payload_size) as total_payload_size,
    AVG(payload_size) as avg_payload_size
FROM mqtt_traffic_logs
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY device_id, DATE_TRUNC('hour', timestamp), direction
ORDER BY hour DESC;

-- =================================================================
-- Functions for Device Management
-- =================================================================

-- Function to register a new MQTT device
CREATE OR REPLACE FUNCTION register_mqtt_device(
    p_device_id VARCHAR(50),
    p_site VARCHAR(50),
    p_room VARCHAR(100),
    p_device_type VARCHAR(20),
    p_security_profile_name VARCHAR(100) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_security_profile_id INTEGER;
    v_mqtt_device_id INTEGER;
BEGIN
    -- Get security profile ID
    IF p_security_profile_name IS NOT NULL THEN
        SELECT id INTO v_security_profile_id 
        FROM mqtt_security_profiles 
        WHERE profile_name = p_security_profile_name;
    ELSE
        -- Use default profile based on device type
        SELECT id INTO v_security_profile_id 
        FROM mqtt_security_profiles 
        WHERE profile_name = p_device_type || '_device';
    END IF;
    
    -- Insert device
    INSERT INTO mqtt_devices (
        device_id, site, room, device_type, 
        mqtt_client_id, security_profile_id
    ) VALUES (
        p_device_id, p_site, p_room, p_device_type,
        p_site || '-' || p_room || '-' || p_device_type || '-' || p_device_id,
        v_security_profile_id
    ) RETURNING id INTO v_mqtt_device_id;
    
    RETURN v_mqtt_device_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log MQTT traffic
CREATE OR REPLACE FUNCTION log_mqtt_traffic(
    p_device_id VARCHAR(50),
    p_topic VARCHAR(255),
    p_qos INTEGER,
    p_payload_size INTEGER,
    p_direction VARCHAR(10),
    p_client_ip INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mqtt_traffic_logs (
        device_id, topic, qos, payload_size, direction, client_ip
    ) VALUES (
        p_device_id, p_topic, p_qos, p_payload_size, p_direction, p_client_ip
    );
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Table Partitioning Setup (for traffic logs)
-- =================================================================

-- Enable partitioning for traffic logs by month
-- This will be created manually as needed for production
COMMENT ON TABLE mqtt_traffic_logs IS 'Consider partitioning by timestamp for large datasets';

-- =================================================================
-- Grants and Permissions
-- =================================================================

-- Grant permissions to application user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'obedio_user') THEN
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO obedio_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO obedio_user;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO obedio_user;
    END IF;
END $$;

-- =================================================================
-- Final Comments and Documentation
-- =================================================================

COMMENT ON TABLE mqtt_devices IS 'MQTT device registry with security profiles and connection metadata';
COMMENT ON TABLE mqtt_security_profiles IS 'Security profiles defining ACL patterns and connection limits';
COMMENT ON TABLE mqtt_traffic_logs IS 'MQTT message traffic logs for monitoring and analytics';
COMMENT ON TABLE mqtt_sessions IS 'Active and historical MQTT client sessions';
COMMENT ON TABLE mqtt_certificates IS 'X.509 certificates for device authentication';

COMMENT ON FUNCTION register_mqtt_device IS 'Register a new MQTT device with appropriate security profile';
COMMENT ON FUNCTION log_mqtt_traffic IS 'Log MQTT message traffic for monitoring';

-- Success message
SELECT 'MQTT database schema initialized successfully' as result;