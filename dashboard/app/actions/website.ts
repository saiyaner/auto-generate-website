'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'

const execPromise = util.promisify(exec)

import fs from 'fs/promises'
import os from 'os'

export async function createWebsiteAction(formData: FormData) {
    const name = formData.get('name') as string
    const template = formData.get('template') as string
    const sourceType = formData.get('sourceType') as string

    let zipPath = ''
    const repoUrl = formData.get('repoUrl') as string

    // Handle ZIP Upload
    if (sourceType === 'zip') {
        const file = formData.get('file') as File
        if (file) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const tempDir = os.tmpdir()
            zipPath = path.join(tempDir, `${Date.now()}-${file.name}`)
            await fs.writeFile(zipPath, buffer)
        }
    }

    // Assign a random port
    const port = Math.floor(Math.random() * (20000 - 10000) + 10000)

    const payloadObj: any = {
        name,
        template: template || 'auto', // Default to auto-detect if missing
        port,
        sourceType
    }

    if (sourceType === 'git') payloadObj.repoUrl = repoUrl
    if (sourceType === 'zip') payloadObj.zipPath = zipPath

    const escapedPayload = JSON.stringify(payloadObj).replace(/"/g, '\\"');

    try {
        const isProduction = process.env.GENERATOR_MODE === 'production' || process.platform !== 'win32';
        const scriptName = isProduction ? 'generator.js' : 'mock_generator.js';
        const scriptPath = path.resolve('..', 'scripts', scriptName);

        const command = `node "${scriptPath}" create "${escapedPayload}"`
        console.log('Running command:', command)

        const { stdout, stderr } = await execPromise(command, {
            env: {
                ...process.env,
                DATABASE_URL: 'postgres://postgres:Citaks@localhost:5432/homelab_auto_gen'
            }
        })

        console.log('STDOUT:', stdout)
        if (stderr) console.error('STDERR:', stderr)

        if (stdout.includes('Error:')) {
            return { success: false, message: 'Generation failed. Check logs.' };
        }

        revalidatePath('/websites')
        return { success: true, message: 'Website creation started!' }

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

        revalidatePath('/websites');
        return { success: true, message: `Website ${action}ed successfully!` };
    } catch (error: any) {
        console.error(`Failed to ${action} website:`, error);
        return { success: false, message: error.message || `Failed to execute ${action} script` };
    }
}
