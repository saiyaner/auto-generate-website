const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Database Config
const client = new Client({
    connectionString: 'postgres://postgres:Citaks@localhost:5432/homelab_auto_gen'
});

// Mock Generator Script
// Usage: node scripts/mock_generator.js <action> <payload>
// Actions: create, start, stop, delete

const action = process.argv[2];
const payloadStr = process.argv[3];
const payload = payloadStr ? JSON.parse(payloadStr) : {};

console.log(`[Generator] Starting action: ${action}`);

async function main() {
    let dbConnected = false;
    try {
        await client.connect();
        dbConnected = true;
    } catch (err) {
        console.log('[Generator] Running in Offline Mode (Database disconnected).');
    }

    try {
        switch (action) {
            case 'create':
                await createWebsite(payload, dbConnected);
                break;
            case 'start':
                await startWebsite(payload, dbConnected);
                break;
            case 'stop':
                console.log(`[Generator] Stopping container for ${payload.id}...`);
                await new Promise(r => setTimeout(r, 500));
                console.log(`[Generator] Container ${payload.name} stopped.`);
                break;
            default:
                console.log('Unknown action');
        }
    } catch (err) {
        console.error('[Generator] Critical Error:', err);
    } finally {
        if (dbConnected) {
            await client.end();
        }
    }
}

async function createWebsite(data, dbConnected) {
    console.log(`[Generator] Creating website: ${data.name} (${data.template})`);

    // 1. Validate inputs
    if (!data.name || !data.template) {
        console.error('[Generator] Error: Missing name or template');
        return;
    }

    // 2. Mock Source Processing
    const workspaceDir = path.join(__dirname, '..', 'containers', data.name);
    if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
        console.log(`[Generator] Created workspace: ${workspaceDir}`);
    }

    // 3. Create Dockerfile (Mock)
    let dockerfileContent = '';
    if (data.template === 'html') {
        dockerfileContent = 'FROM nginx:alpine\nCOPY . /usr/share/nginx/html';
    } else if (data.template === 'node') {
        dockerfileContent = 'FROM node:18\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD ["npm", "start"]';
    }

    fs.writeFileSync(path.join(workspaceDir, 'Dockerfile'), dockerfileContent);
    console.log(`[Generator] Dockerfile created.`);

    // 4. Mock Build
    console.log('[Generator] Building container image (mock)...');
    await new Promise(r => setTimeout(r, 2000));
    console.log(`[Generator] Image website-${data.name} built successfully.`);

    // 5. Mock Run
    console.log(`[Generator] Running container on port ${data.port}...`);
    console.log(`[Generator] SUCCESS: Website available at localhost:${data.port}`);

    // 6. DB Update
    try {
        console.log('[Generator] Updating database...');
        if (!dbConnected) throw new Error('Database not connected - skipping to fallback');

        // Check if template exists or use a default
        // Simple logic: lookup or default to 1 (HTML)
        const templateRes = await client.query('SELECT id FROM templates WHERE type = $1 LIMIT 1', [data.template]);
        const templateId = templateRes.rows.length > 0 ? templateRes.rows[0].id : 1;

        // Insert into websites
        const insertRes = await client.query(
            `INSERT INTO websites (user_id, name, subdomain, template_id, status, port) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id`,
            [1, data.name, data.name, templateId, 'running', data.port]
        );
        const newWebsiteId = insertRes.rows[0].id;

        // Insert into containers
        await client.query(
            `INSERT INTO containers (website_id, container_name, image_name)
             VALUES ($1, $2, $3)`,
            [newWebsiteId, `website-${data.name}`, `website-${data.name}:latest`]
        );

        console.log('[Generator] Database updated successfully.');
    } catch (err) {
        console.error('[Generator] Database Update Failed:', err.message);

        // Fallback: Write to JSON file
        try {
            const mockFilePath = path.join(__dirname, '../data/mock_db.json');
            let mockData = [];
            if (fs.existsSync(mockFilePath)) {
                mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
            }

            // Check for duplicates
            const exists = mockData.some(site => site.name.toLowerCase() === data.name.toLowerCase());
            if (exists) {
                console.log(`[Generator] Error: Website "${data.name}" already exists!`);
                return; // Stop execution
            }

            const newSite = {
                id: Math.floor(Math.random() * 10000),
                name: data.name,
                subdomain: data.name,
                status: 'running',
                port: data.port,
                type: data.template.toUpperCase()
            };

            mockData.push(newSite);
            fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
            console.log('[Generator] Fallback: Wrote to mock_db.json');
        } catch (fileErr) {
            console.error('[Generator] Fallback Failed:', fileErr.message);
        }
    }
}

async function startWebsite(data) {
    // Basic mock start logic
    console.log(`[Generator] Starting container for ${data.id}...`);
    await new Promise(r => setTimeout(r, 1000));
    // Update DB status
    await client.query('UPDATE websites SET status = $1 WHERE id = $2', ['running', data.id]);
    console.log(`[Generator] Container ${data.name} started.`);
}

main().catch(err => console.error(err));
