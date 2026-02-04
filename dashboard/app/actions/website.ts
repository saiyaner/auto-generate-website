'use server'

import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'

const execPromise = util.promisify(exec)

export async function createWebsiteAction(formData: FormData) {
    const name = formData.get('name') as string
    const template = formData.get('template') as string
    const sourceType = formData.get('sourceType') as string
    const createDb = formData.get('createDb') === 'on'

    // Using Mock Generator Script
    // In real implementation, this would handle Git/Zip inputs too

    // Assign a random port for now (mock logic)
    const port = Math.floor(Math.random() * (20000 - 10000) + 10000)

    // Escape for Windows Command Line:
    // 1. Double quotes in JSON must be escaped as \"
    // 2. The whole JSON string must be wrapped in double quotes
    // 3. Inner quotes are escaped again if needed, but for simple JSON, strict \" usually works in Node's exec
    // However, exec is tricky. Let's try recursive escaping.

    // Simplest reliable way for Windows+Node exec with JSON:
    // Escape all double quotes as \"
    const escapedPayload = JSON.stringify({
        name,
        template: template || 'html', // Default to html if missing
        port
    }).replace(/"/g, '\\"');


    try {
        // Execute the script
        const isProduction = process.env.GENERATOR_MODE === 'production';
        const scriptName = isProduction ? 'generator.js' : 'mock_generator.js';
        const scriptPath = path.resolve('..', 'scripts', scriptName);

        // Wrap payload in double quotes
        const command = `node "${scriptPath}" create "${escapedPayload}"`
        console.log('Running command:', command)

        const { stdout, stderr } = await execPromise(command)
        console.log('STDOUT:', stdout)
        if (stderr) console.error('STDERR:', stderr)

        // Check for specific generator errors in STDOUT (since the script logs them there)
        if (stdout.includes('[Generator] Error:')) {
            const errorMatch = stdout.match(/\[Generator\] Error: (.*)/);
            const errorMessage = errorMatch ? errorMatch[1] : 'Unknown Generator Error';
            return { success: false, message: errorMessage };
        }

        return { success: true, message: 'Website created successfully!' }

    } catch (error: any) {
        console.error('Failed to create website:', error)
        return { success: false, message: error.message || 'Failed to execute creation script' }
    }
}

export async function startWebsiteAction(name: string) {
    return executeGeneratorAction(name, 'start');
}

export async function stopWebsiteAction(name: string) {
    return executeGeneratorAction(name, 'stop');
}

export async function deleteWebsiteAction(name: string) {
    return executeGeneratorAction(name, 'delete');
}

async function executeGeneratorAction(name: string, action: 'start' | 'stop' | 'delete') {
    try {
        const escapedPayload = JSON.stringify({ name }).replace(/"/g, '\\"');
        const isProduction = process.env.GENERATOR_MODE === 'production' || process.platform !== 'win32';
        const scriptName = isProduction ? 'generator.js' : 'mock_generator.js';
        const scriptPath = path.resolve('..', 'scripts', scriptName);

        const command = `node "${scriptPath}" ${action} "${escapedPayload}"`;
        console.log(`Running ${action} command:`, command);

        const { stdout, stderr } = await execPromise(command, {
            env: {
                ...process.env,
                DATABASE_URL: 'postgres://postgres:Citaks@localhost:5432/homelab_auto_gen'
            }
        });
        console.log('STDOUT:', stdout);
        if (stderr) console.error('STDERR:', stderr);

        if (stdout.includes('Error:') || stdout.includes('failed')) {
            return { success: false, message: 'Action failed on server. check logs.' };
        }

        return { success: true, message: `Website ${action}ed successfully!` };
    } catch (error: any) {
        console.error(`Failed to ${action} website:`, error);
        return { success: false, message: error.message || `Failed to execute ${action} script` };
    }
}
