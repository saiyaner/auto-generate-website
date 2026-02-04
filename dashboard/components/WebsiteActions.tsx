'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { startWebsiteAction, stopWebsiteAction, deleteWebsiteAction } from '@/app/actions/website'
import { Play, Square, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LogViewer } from './LogViewer'

interface WebsiteActionsProps {
    site: {
        id: number
        name: string
        subdomain: string
        status: string
        port: number
    }
}

export function WebsiteActions({ site }: WebsiteActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleAction(action: 'start' | 'stop' | 'delete') {
        const confirmMsg = action === 'delete'
            ? `Are you sure you want to delete ${site.name}? This will remove the container and all data.`
            : null;

        if (confirmMsg && !confirm(confirmMsg)) return;

        setIsLoading(true)
        try {
            let result;
            if (action === 'start') result = await startWebsiteAction(site.subdomain);
            else if (action === 'stop') result = await stopWebsiteAction(site.subdomain);
            else result = await deleteWebsiteAction(site.subdomain);

            if (result.success) {
                router.refresh()
            } else {
                alert(result.message)
            }
        } catch (err) {
            console.error(err)
            alert('An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
                {site.status === 'running' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handleAction('stop')}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                        Stop
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleAction('start')}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Start
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleAction('delete')}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                </Button>
            </div>

            <div className="flex space-x-2">
                <LogViewer subdomain={site.subdomain} websiteName={site.name} />
                <a
                    href={`https://${site.subdomain}.citaks.my.id`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-3 flex-1"
                >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open
                </a>
            </div>
        </div>
    )
}
