import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> }
) {
    const { subdomain } = await params

    // Strict validation to prevent command injection
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
        return NextResponse.json({ error: 'Invalid subdomain format' }, { status: 400 })
    }

    try {
        const containerName = `website-${subdomain}`
        // Get last 100 lines of logs
        const { stdout, stderr } = await execPromise(`podman logs --tail 100 ${containerName}`)

        return NextResponse.json({
            logs: stdout || 'No logs found.',
            error: stderr
        })
    } catch (error: any) {
        console.error('Failed to fetch logs:', error)
        return NextResponse.json({
            logs: 'Container might be stopped or not found.',
            error: error.message
        }, { status: 500 })
    }
}
