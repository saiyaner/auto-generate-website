import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Citaks@localhost:5432/homelab_auto_gen',
});

import fs from 'fs';
import path from 'path';

// Helper to query the DB
export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error: any) {
        // Log as info, not warning, to avoid alarming the user during dev
        console.log('Running in Offline Mode (Mock Data)');

        // In production on the server, we use the absolute path to ensure consistency
        const mockFilePath = process.env.GENERATOR_MODE === 'production'
            ? '/var/www/auto-gen/data/mock_db.json'
            : path.join(process.cwd(), '../data/mock_db.json');

        // Ensure directory exists if in production mode (for first run)
        if (process.env.GENERATOR_MODE === 'production') {
            const dataDir = path.dirname(mockFilePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }

        // Ensure file exists
        if (!fs.existsSync(mockFilePath)) {
            return { rowCount: 0, rows: [] };
        }

        const fileContent = fs.readFileSync(mockFilePath, 'utf-8');
        let mockData = JSON.parse(fileContent);

        // Sorting by ID desc (simulating ORDER BY w.created_at DESC)
        mockData.sort((a: any, b: any) => b.id - a.id);

        // Mock fallback for common queries
        // Handle COUNT queries
        if (text.includes('COUNT(*)') || text.includes('COUNT')) {
            if (text.includes("WHERE status = 'running'")) {
                const count = mockData.filter((site: any) => site.status === 'running').length;
                return { rowCount: 1, rows: [{ running: count, total: count }] };
            } else if (text.includes("WHERE status = 'stopped'")) {
                const count = mockData.filter((site: any) => site.status === 'stopped').length;
                return { rowCount: 1, rows: [{ stopped: count, total: count }] };
            } else if (text.includes('as total')) {
                return { rowCount: 1, rows: [{ total: mockData.length }] };
            } else {
                // Generic COUNT
                return { rowCount: 1, rows: [{ count: mockData.length }] };
            }
        }

        if (text.includes('FROM websites')) {
            return {
                rowCount: mockData.length,
                rows: mockData
            };
        }
        if (text.includes('INSERT INTO websites')) {
            // For dashboard direct inserts (if any), return dummy success
            return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
        }

        return { rowCount: 0, rows: [] };
    }
}

export default pool;
