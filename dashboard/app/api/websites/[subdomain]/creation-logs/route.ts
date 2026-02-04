import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> }
) {
    const { subdomain } = await params

    // Path to the log file
    const logPath = path.join(process.cwd(), '..', 'data', 'logs', `${subdomain}.log`)

    try {
        if (!await fs.access(logPath).then(() => true).catch(() => false)) {
            return NextResponse.json({ logs: 'Waiting for deployment to start...' })
        }

        const logs = await fs.readFile(logPath, 'utf-8')
        return NextResponse.json({ logs })
    } catch (error) {
        return NextResponse.json({ logs: 'No logs found for this deployment.' }, { status: 404 })
    }
}
