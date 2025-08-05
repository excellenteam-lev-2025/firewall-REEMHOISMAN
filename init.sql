CREATE TABLE IF NOT EXISTS firewall_rules (
    id SERIAL PRIMARY KEY,
    "type" VARCHAR(10) NOT NULL CHECK (type IN ('ip', 'url', 'port')),
    "value" VARCHAR(255) NOT NULL,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('blacklist', 'whitelist')),
    created_at TIMESTAMP DEFAULT NOW()
    );
