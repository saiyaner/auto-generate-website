-- Database Schema for Auto-Generate Website System

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'html', 'php', 'node', 'python'
    repository_url VARCHAR(255),
    default_port INTEGER DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS websites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'project1' -> project1.citaks.my.id
    template_id INTEGER REFERENCES templates(id),
    status VARCHAR(20) DEFAULT 'stopped', -- 'running', 'stopped', 'building', 'error'
    port INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS containers (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
    container_name VARCHAR(100) NOT NULL,
    container_id VARCHAR(64),
    image_name VARCHAR(100),
    config_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    ssl_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id) ON DELETE SET NULL,
    level VARCHAR(10) NOT NULL, -- 'info', 'warn', 'error'
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
