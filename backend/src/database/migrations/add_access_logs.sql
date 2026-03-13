CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- 'login' o 'logout'
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
