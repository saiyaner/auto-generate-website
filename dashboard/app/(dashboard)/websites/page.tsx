import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getWebsites() {
    const result = await query(`
    SELECT w.id, w.name, w.subdomain, w.status, w.port, t.name as type 
    FROM websites w
    LEFT JOIN templates t ON w.template_id = t.id
    ORDER BY w.created_at DESC
  `)
    return result.rows
}

export default async function WebsitesPage() {
    const websites = await getWebsites()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Websites</h1>
                <Link href="/websites/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {websites.map((site) => (
                    <Card key={site.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">{site.name}</CardTitle>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${site.status === 'running' ? 'bg-green-100 text-green-800' :
                                site.status === 'stopped' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {site.status}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-2 text-sm text-slate-500">
                                <div className="flex justify-between py-1">
                                    <span>Subdomain:</span>
                                    <span className="font-mono">{site.subdomain}.citaks.my.id</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span>Stack:</span>
                                    <span>{site.type}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span>Port:</span>
                                    <span className="font-mono">{site.port}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <Button variant="outline" size="sm" className="w-full">Manage</Button>
                                <Button variant="outline" size="sm" className="w-full">Logs</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
