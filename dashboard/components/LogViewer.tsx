'use client'

import { useState, useEffect } from 'react'
import { Button, Modal, CardHeader, CardTitle } from './ui'
import { Terminal, RefreshCw, Loader2 } from 'lucide-react'

interface LogViewerProps {
    subdomain: string
    websiteName: string
}

export function LogViewer({ subdomain, websiteName }: LogViewerProps) {
    const [logs, setLogs] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    async function fetchLogs() {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/websites/${subdomain}/logs`)
            const data = await res.json()
            setLogs(data.logs || 'No logs available.')
        } catch (err) {
            setLogs('Failed to load logs.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchLogs()
        }
    }, [isOpen])

    return (
        <>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
                <Terminal className="mr-2 h-4 w-4" /> Logs
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="flex flex-col h-full overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                        <CardTitle className="text-lg">Logs: {websiteName}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="mr-6"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                    </CardHeader>
                    <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-6 font-mono text-xs whitespace-pre-wrap">
                        {logs || (isLoading ? 'Fetching logs...' : 'Waiting for data...')}
                    </div>
                    <div className="p-4 border-t flex justify-end">
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
