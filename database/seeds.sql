-- Dummy Data Seeds

-- Users (password: password123)
-- In a real app, passwords should be hashed. This is just for schema testing or if using a simple mocked auth.
INSERT INTO users (username, password_hash, email) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'admin@citaks.my.id'),
('demo_user', '$2b$10$YourHashedPasswordHere', 'user@example.com');

-- Templates
INSERT INTO templates (name, type, default_port) VALUES
('Static HTML', 'html', 80),
('PHP 8.2', 'php', 80),
('Node.js 18', 'node', 3000),
('Python Flask', 'python', 5000);

-- Websites
INSERT INTO websites (user_id, name, subdomain, template_id, status, port) VALUES
(1, 'Personal Portfolio', 'portfolio', 1, 'running', 10001),
(1, 'Blog Project', 'blog', 2, 'stopped', 10002),
(2, 'Test App', 'test-app', 3, 'building', 10003);

-- Containers
INSERT INTO containers (website_id, container_name, image_name) VALUES
(1, 'website-portfolio-1', 'website-portfolio:latest'),
(2, 'website-blog-2', 'website-blog:latest'),
(3, 'website-test-app-3', 'website-test-app:latest');

-- Logs
INSERT INTO logs (website_id, level, message) VALUES
(1, 'info', 'Container started successfully'),
(2, 'info', 'Container stopped by user'),
(3, 'info', 'Build process started');
