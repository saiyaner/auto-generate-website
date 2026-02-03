import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Activity, Server, Database, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

import { query } from '@/lib/db'

// Fetch real stats from database
async function getStats() {
    try {
        // Get total websites count
        const totalResult = await query('SELECT COUNT(*) as total FROM websites');
        const total = parseInt(totalResult.rows[0]?.total || '0');

        // Get running websites count
        const runningResult = await query("SELECT COUNT(*) as running FROM websites WHERE status = 'running'");
        const running = parseInt(runningResult.rows[0]?.running || '0');

        // Get stopped websites count
        const stoppedResult = await query("SELECT COUNT(*) as stopped FROM websites WHERE status = 'stopped'");
        const stopped = parseInt(stoppedResult.rows[0]?.stopped || '0');

        return {
            activeWebsites: running,
            totalContainers: total,
            stoppedContainers: stopped,
            dbUsage: 'N/A', // Could be calculated if needed
            uptime: 'N/A'   // Would need system integration
        }
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to zeros if query fails
        return {
            activeWebsites: 0,
            totalContainers: 0,
            stoppedContainers: 0,
            dbUsage: 'N/A',
            uptime: 'N/A'
        }
    }
}


export default async function DashboardPage() {
    const stats = await getStats()

    // Get recent websites (limit 3)
    const recentWebsites = await query(`
        SELECT w.id, w.name, w.status, w.created_at
        FROM websites w
        ORDER BY w.created_at DESC
        LIMIT 3
    `);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
                        <Globe className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeWebsites}</div>
                        <p className="text-xs text-slate-500">Currently running</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Containers</CardTitle>
                        <Server className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalContainers}</div>
                        <p className="text-xs text-slate-500">{stats.stoppedContainers} stopped</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database Usage</CardTitle>
                        <Database className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.dbUsage}</div>
                        <p className="text-xs text-slate-500">of 1GB quota</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                        <Activity className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.uptime}</div>
                        <p className="text-xs text-slate-500">Heartbeat healthy</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentWebsites.rows.length > 0 ? (
                                recentWebsites.rows.map((site) => (
                                    <div key={site.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Website '{site.name}' created</p>
                                            <p className="text-sm text-slate-500">
                                                {site.created_at ? new Date(site.created_at).toLocaleString() : 'Recently'}
                                            </p>
                                        </div>
                                        <div className={`ml-auto font-medium ${site.status === 'running' ? 'text-green-600' : 'text-slate-500'
                                            }`}>
                                            {site.status === 'running' ? 'Running' : 'Stopped'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
