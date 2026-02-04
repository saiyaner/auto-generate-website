const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { updateProxyMap, getNginxReloadCommand } = require('./nginx-updater');

// Ensure log directory exists
const LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Configuration
const IS_DRY_RUN = process.env.DRY_RUN === 'true' || process.platform === 'win32';
const BASE_CONTAINER_DIR = process.env.CONTAINER_DIR || path.join(__dirname, '..', 'containers');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:Citaks@localhost:5432/homelab_auto_gen';

// Usage: node scripts/generator.js <action> <payload>
const action = process.argv[2];
const payloadStr = process.argv[3];
const payload = payloadStr ? JSON.parse(payloadStr) : {};

const client = new Client({ connectionString: DATABASE_URL });
let dbConnected = false;

// Log redirection helper
const subdomainForLog = payload.name ? slugify(payload.name) : 'unknown';
const logFile = path.join(LOG_DIR, `${subdomainForLog}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(msg) {
    const time = new Date().toISOString();
    const formatted = `[${time}] ${msg}\n`;
    process.stdout.write(formatted);
    logStream.write(formatted);
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function runCommand(command, cwd = process.cwd()) {
    log(`[CMD] ${command}`);
    if (IS_DRY_RUN) return { stdout: 'Mock Success', stderr: '' };

    try {
        const { stdout, stderr } = await execPromise(command, { cwd });
        if (stdout) log(`[STDOUT] ${stdout.trim()}`);
        if (stderr) log(`[STDERR] ${stderr.trim()}`);
        return { stdout, stderr };
    } catch (error) {
        log(`[CMD Failed] ${command}: ${error.message}`);
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

    const workspaceId = slugify(data.name);
    const workspaceDir = path.join(BASE_CONTAINER_DIR, workspaceId);
    const containerName = `website-${workspaceId}`;

    // 1. Setup Workspace
    if (!fs.existsSync(workspaceDir)) {
        if (!IS_DRY_RUN) fs.mkdirSync(workspaceDir, { recursive: true });
    }

    // 1. Setup Workspace
    if (!fs.existsSync(workspaceDir)) {
        if (!IS_DRY_RUN) fs.mkdirSync(workspaceDir, { recursive: true });
    }

    // 2. Handle Source (Git / ZIP)
    if (data.sourceType === 'git' && data.repoUrl) {
        log(`[RealGenerator] Cloning repository: ${data.repoUrl}`);
        await runCommand(`git clone ${data.repoUrl} .`, workspaceDir);
    } else if (data.sourceType === 'zip' && data.zipPath) {
        log(`[RealGenerator] Extracting ZIP: ${data.zipPath}`);
        await runCommand(`unzip -o "${data.zipPath}" -d .`, workspaceDir);
        // Clean up temp zip
        if (!IS_DRY_RUN) await fs.promises.unlink(data.zipPath).catch(() => { });
    }

    // 3. Auto-Detect Stack
    let stack = data.template;
    if (stack === 'auto' || !stack) {
        log('[RealGenerator] Auto-detecting technology...');
        if (fs.existsSync(path.join(workspaceDir, 'package.json'))) {
            stack = 'node';
        } else if (fs.existsSync(path.join(workspaceDir, 'composer.json')) || fs.readdirSync(workspaceDir).some(f => f.endsWith('.php'))) {
            stack = 'php';
        } else if (fs.existsSync(path.join(workspaceDir, 'requirements.txt'))) {
            stack = 'python';
        } else {
            stack = 'html';
        }
        log(`[RealGenerator] Detected stack: ${stack.toUpperCase()}`);
    }

    // 4. Generate Dockerfile
    let dockerfile = '';
    if (stack === 'php') {
        dockerfile = `FROM php:8.2-apache\nCOPY . /var/www/html/\nEXPOSE 80`;
    } else if (stack === 'node') {
        dockerfile = `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`;
    } else if (stack === 'python') {
        dockerfile = `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 5000\nCMD ["python", "app.py"]`;
    } else {
        dockerfile = `FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80`;
    }

    if (!IS_DRY_RUN) {
        fs.writeFileSync(path.join(workspaceDir, 'Dockerfile'), dockerfile);
    }
    log(`[RealGenerator] Generated Dockerfile for ${stack.toUpperCase()}`);

    // 5. Build & Run
    const portInContainer = stack === 'node' ? 3000 : (stack === 'python' ? 5000 : 80);
    await runCommand(`podman build -t ${containerName} .`, workspaceDir);
    await runCommand(`podman rm -f ${containerName} || true`);
    await runCommand(`podman run -d -p ${data.port}:${portInContainer} --name ${containerName} --restart always ${containerName}`);

    log(`[RealGenerator] SUCCESS: Container running on port ${data.port}`);

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
    const subdomain = slugify(data.name);
    const containerName = `website-${subdomain}`;
    await runCommand(`podman start ${containerName}`);
    console.log(`[RealGenerator] Started container: ${containerName}`);

    if (dbConnected) {
        await client.query("UPDATE websites SET status = 'running' WHERE subdomain = $1", [subdomain]);
        console.log('[RealGenerator] Database updated (status: running).');
    }
    updateMockStatus(subdomain, 'running');
}

async function stopWebsite(data) {
    const subdomain = slugify(data.name);
    const containerName = `website-${subdomain}`;
    await runCommand(`podman stop ${containerName}`);
    console.log(`[RealGenerator] Stopped container: ${containerName}`);

    if (dbConnected) {
        await client.query("UPDATE websites SET status = 'stopped' WHERE subdomain = $1", [subdomain]);
        console.log('[RealGenerator] Database updated (status: stopped).');
    }
    updateMockStatus(subdomain, 'stopped');
}

async function deleteWebsite(data) {
    const workspaceId = slugify(data.name);
    const workspaceDir = path.join(BASE_CONTAINER_DIR, workspaceId);
    const containerName = `website-${workspaceId}`;

    await runCommand(`podman rm -f ${containerName} || true`);
    await runCommand(`podman rmi ${containerName} || true`);
    console.log(`[RealGenerator] Deleted container and image: ${containerName}`);

    // Clean up volume/directory if not on windows
    if (!IS_DRY_RUN && process.platform !== 'win32') {
        await runCommand(`rm -rf ${workspaceDir}`);
        console.log(`[RealGenerator] Deleted workspace directory: ${workspaceDir}`);
    }

    if (dbConnected) {
        await client.query("DELETE FROM websites WHERE subdomain = $1", [workspaceId]);
        console.log('[RealGenerator] Database record deleted.');
    }

    // Update JSON
    const mockFilePath = path.join(__dirname, '../data/mock_db.json');
    if (fs.existsSync(mockFilePath)) {
        let mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
        mockData = mockData.filter(s => s.subdomain !== workspaceId);
        fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
        console.log('[RealGenerator] Local data persistence updated (record removed).');
    }

    // Update Nginx Proxy Map
    try {
        const mockFilePath = path.join(__dirname, '../data/mock_db.json');
        if (fs.existsSync(mockFilePath)) {
            const mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
            updateProxyMap(mockData.map(site => ({
                subdomain: site.subdomain.toLowerCase(),
                port: site.port
            })));

            if (!IS_DRY_RUN && process.platform !== 'win32') {
                await runCommand(getNginxReloadCommand());
            }
        }
    } catch (err) {
        console.warn('[RealGenerator] Nginx update failed during delete:', err.message);
    }
}

function updateMockStatus(subdomain, status) {
    const mockFilePath = path.join(__dirname, '../data/mock_db.json');
    if (fs.existsSync(mockFilePath)) {
        try {
            const mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf-8'));
            const site = mockData.find(s => s.subdomain === subdomain);
            if (site) {
                site.status = status;
                fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
                console.log(`[RealGenerator] Local mock_db updated status to: ${status}`);
            }
        } catch (e) {
            console.error('Error updating mock status:', e.message);
        }
    }
}

main().catch(console.error);
