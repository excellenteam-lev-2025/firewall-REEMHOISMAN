CREATE TABLE IF NOT EXISTS firewall_rules (
    id SERIAL PRIMARY KEY,
    mode VARCHAR(10),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip (
    id SERIAL PRIMARY KEY,
    firewall_rules_id INT REFERENCES firewall_rules(id),
    address VARCHAR(45) UNIQUE
);