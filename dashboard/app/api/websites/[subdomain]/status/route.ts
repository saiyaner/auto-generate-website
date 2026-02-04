import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> }
) {
    const { subdomain } = await params

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
        return NextResponse.json({ error: 'Invalid subdomain format' }, { status: 400 })
    }

    try {
        const containerName = `website-${subdomain}`
        // check if container is running using podman inspect
        const { stdout } = await execPromise(`podman inspect ${containerName} --format "{{.State.Running}}"`)

        const isRunning = stdout.trim() === 'true'

        return NextResponse.json({
            status: isRunning ? 'running' : 'stopped'
        })
    } catch (error: any) {
        // If container doesn't exist, podman inspect fails
        return NextResponse.json({
            status: 'not_found',
            error: error.message
        })
    }
}
