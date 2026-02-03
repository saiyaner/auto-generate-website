const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { updateProxyMap, getNginxReloadCommand } = require('./nginx-updater');

// Configuration
const IS_DRY_RUN = process.env.DRY_RUN === 'true' || process.platform === 'win32';
const BASE_CONTAINER_DIR = process.env.CONTAINER_DIR || path.join(__dirname, '..', 'containers');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:password123@localhost:5432/homelab_auto_gen';

// Usage: node scripts/generator.js <action> <payload>
const action = process.argv[2];
const payloadStr = process.argv[3];
const payload = payloadStr ? JSON.parse(payloadStr) : {};

const client = new Client({ connectionString: DATABASE_URL });
let dbConnected = false;

async function runCommand(command, cwd = process.cwd()) {
    console.log(`[CMD] ${command}`);
    if (IS_DRY_RUN) return { stdout: 'Mock Success', stderr: '' };

    try {
        const { stdout, stderr } = await execPromise(command, { cwd });
        return { stdout, stderr };
    } catch (error) {
        console.error(`[CMD Failed] ${command}`, error.message);
        throw error;
    }
}

async function main() {
    console.log(`[RealGenerator] Starting action: ${action}`);
    if (IS_DRY_RUN) console.log('[RealGenerator] Mode: DRY RUN');

    try {
        // Attempt database connection with a 2-second timeout
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database connection timeout')), 2000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
        dbConnected = true;
        console.log('[RealGenerator] Database connected.');
    } catch (err) {
        console.log(`[RealGenerator] Warning: ${err.message}. Running in offline mode (JSON fallback).`);
    }

    try {
        switch (action) {
            case 'create':
                await createWebsite(payload);
                break;
            case 'start':
                await startWebsite(payload);
                break;
            case 'stop':
                await stopWebsite(payload);
                break;
            case 'delete':
                await deleteWebsite(payload);
                break;
            default:
                console.log(`[RealGenerator] Unknown action: ${action}`);
        }
    } catch (err) {
        console.error('[RealGenerator] Critical Error:', err.message);
    } finally {
        if (dbConnected) {
            await client.end();
            console.log('[RealGenerator] Database connection closed.');
        }
    }
}

async function createWebsite(data) {
    console.log(`[RealGenerator] Creating website: ${data.name} (${data.template})`);

    // 1. Validate inputs
    if (!data.name || !data.template) {
        console.error('[RealGenerator] Error: Missing name or template');
        throw new Error('Missing inputs');
    }

    const workspaceId = data.name.toLowerCase();
    const workspaceDir = path.join(BASE_CONTAINER_DIR, workspaceId);
    const containerName = `website-${workspaceId}`;

    // 1. Setup Workspace
    if (!fs.existsSync(workspaceDir)) {
        if (!IS_DRY_RUN) fs.mkdirSync(workspaceDir, { recursive: true });
    }

    // 2. Generate Dockerfile & Assets
    let dockerfile = `FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80`;
    if (data.template === 'php') {
        dockerfile = `FROM php:8.2-apache\nCOPY . /var/www/html/\nEXPOSE 80`;
    }

    if (!IS_DRY_RUN) {
        fs.writeFileSync(path.join(workspaceDir, 'Dockerfile'), dockerfile);
        if (!fs.existsSync(path.join(workspaceDir, 'index.html'))) {
            fs.writeFileSync(path.join(workspaceDir, 'index.html'), `
<!DOCTYPE html>
<html>
<head><title>${data.name}</title></head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
    <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h1 style="color: #1e293b;">Hello from ${data.name}!</h1>
        <p style="color: #64748b;">Generated beautifully by Citaks Homelab.</p>
    </div>
</body>
</html>`);
        }
    }
    console.log(`[RealGenerator] Dockerfile and assets prepared.`);

    // 3. Build & Run
    await runCommand(`podman build -t ${containerName} .`, workspaceDir);
    await runCommand(`podman rm -f ${containerName} || true`);
    await runCommand(`podman run -d -p ${data.port}:80 --name ${containerName} --restart always ${containerName}`);

    console.log(`[RealGenerator] SUCCESS: Container running on port ${data.port}`);

    // 4. Persistence
    let mockData = [];
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        if (!IS_DRY_RUN) fs.mkdirSync(dataDir, { recursive: true });
    }

    const mockFilePath = path.join(dataDir, 'mock_db.json');
    if (fs.existsSync(mockFilePath)) {
        try {
            mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
        } catch (e) {
            mockData = [];
        }
    }

    const websiteRecord = {
        id: Math.floor(Math.random() * 100000),
        name: data.name,
        subdomain: data.name.toLowerCase(),
        status: 'running',
        port: data.port,
        type: data.template.toUpperCase(),
        created_at: new Date().toISOString()
    };

    // Update in DB if connected
    if (dbConnected) {
        try {
            await client.query(
                `INSERT INTO websites (name, subdomain, status, port, type) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (subdomain) DO UPDATE SET status = 'running', port = $4;`,
                [websiteRecord.name, websiteRecord.subdomain, websiteRecord.status, websiteRecord.port, websiteRecord.type]
            );
            console.log('[RealGenerator] Database updated.');
        } catch (dbErr) {
            console.error('[RealGenerator] DB Insert failed:', dbErr.message);
        }
    }

    // Always update JSON for local fallback and dashboard visibility
    const existingIdx = mockData.findIndex(s => s.subdomain === websiteRecord.subdomain);
    if (existingIdx > -1) {
        mockData[existingIdx] = websiteRecord;
    } else {
        mockData.push(websiteRecord);
    }

    if (!IS_DRY_RUN) {
        fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
        console.log('[RealGenerator] Local data persistence updated.');
    }

    // 5. Update Nginx Proxy Map
    try {
        updateProxyMap(mockData.map(site => ({
            subdomain: site.subdomain.toLowerCase(),
            port: site.port
        })));

        if (!IS_DRY_RUN && process.platform !== 'win32') {
            await runCommand(getNginxReloadCommand());
            console.log('[RealGenerator] Nginx reloaded successfully.');
        } else if (IS_DRY_RUN) {
            console.log(`[RealGenerator] Skipping Nginx reload in DRY RUN. Command: ${getNginxReloadCommand()}`);
        } else { // On Windows
            console.log(`[RealGenerator] Skipping Nginx reload on Windows. Run on server: ${getNginxReloadCommand()}`);
        }
    } catch (err) {
        console.warn('[RealGenerator] Nginx update failed (non-critical):', err.message);
    }
}

async function startWebsite(data) {
    const containerName = `website-${data.name.toLowerCase()}`;
    await runCommand(`podman start ${containerName}`);
    console.log(`[RealGenerator] Started container: ${containerName}`);
}

async function stopWebsite(data) {
    const containerName = `website-${data.name.toLowerCase()}`;
    await runCommand(`podman stop ${containerName}`);
    console.log(`[RealGenerator] Stopped container: ${containerName}`);
}

async function deleteWebsite(data) {
    const containerName = `website-${data.name.toLowerCase()}`;
    await runCommand(`podman rm -f ${containerName}`);
    console.log(`[RealGenerator] Deleted container: ${containerName}`);
    // Optional: podman rmi ...
}

main().catch(console.error);
