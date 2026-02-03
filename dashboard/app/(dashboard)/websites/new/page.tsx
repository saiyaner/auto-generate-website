'use client'

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useState } from 'react'

import { createWebsiteAction } from '@/app/actions/website'
import { useRouter } from 'next/navigation'

export default function NewWebsitePage() {
    const [sourceType, setSourceType] = useState<'template' | 'git' | 'zip'>('template')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const router = useRouter() // Import from next/navigation

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setStatus(null)

        const formData = new FormData(e.currentTarget)
        formData.append('sourceType', sourceType)

        try {
            const result = await createWebsiteAction(formData)

            if (result.success) {
                setStatus({ type: 'success', message: `${result.message} Redirecting...` })
                // Redirect after short delay
                setTimeout(() => {
                    router.push('/websites')
                    router.refresh() // Ensure list updates
                }, 1500)
            } else {
                setStatus({ type: 'error', message: result.message || 'Failed to create website' })
            }
        } catch (err) {
            console.error(err)
            setStatus({ type: 'error', message: 'An unexpected error occurred.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Website</h1>

            {/* Alerts */}
            {status && (
                <div className={`p-4 rounded-md flex items-center gap-2 ${status.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {status.type === 'success' ? (
                        <div className="h-4 w-4 bg-green-500 rounded-full" />
                    ) : (
                        <div className="h-4 w-4 bg-red-500 rounded-full" />
                    )}
                    <p className="text-sm font-medium">{status.message}</p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Website Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Website Name</label>
                            <Input id="name" name="name" placeholder="my-awesome-project" required />
                            <p className="text-xs text-slate-500">This will be used for your subdomain: name.citaks.my.id</p>
                        </div>

                        {/* Source Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Deployment Source</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSourceType('template')}
                                    className={`p-3 text-sm border rounded-md transition-colors ${sourceType === 'template' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    Official Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('git')}
                                    className={`p-3 text-sm border rounded-md transition-colors ${sourceType === 'git' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    GitHub Repo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSourceType('zip')}
                                    className={`p-3 text-sm border rounded-md transition-colors ${sourceType === 'zip' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    Upload ZIP
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Fields based on Source Type */}
                        {sourceType === 'template' && (
                            <div className="space-y-2">
                                <label htmlFor="stack" className="text-sm font-medium">Select Template</label>
                                <select id="stack" name="template" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">
                                    <option value="html">Static HTML</option>
                                    <option value="php">PHP 8.2</option>
                                    <option value="node">Node.js 18</option>
                                    <option value="python">Python Flask</option>
                                </select>
                            </div>
                        )}

                        {sourceType === 'git' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="repoUrl" className="text-sm font-medium">GitHub Repository URL</label>
                                    <Input id="repoUrl" name="repoUrl" type="url" placeholder="https://github.com/username/repo" required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="gitStack" className="text-sm font-medium">Runtime Stack</label>
                                    <select id="gitStack" name="template" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">
                                        <option value="auto">Auto-Detect</option>
                                        <option value="node">Node.js 18</option>
                                        <option value="php">PHP 8.2</option>
                                        <option value="html">Static HTML</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {sourceType === 'zip' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="file" className="text-sm font-medium">Project ZIP File</label>
                                    <Input id="file" name="file" type="file" accept=".zip" required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="zipStack" className="text-sm font-medium">Runtime Stack</label>
                                    <select id="zipStack" name="template" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">
                                        <option value="auto">Auto-Detect</option>
                                        <option value="node">Node.js 18</option>
                                        <option value="php">PHP 8.2</option>
                                        <option value="html">Static HTML</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="flex items-start space-x-2">
                                <input type="checkbox" className="mt-1 rounded border-slate-300" />
                                <div className="space-y-1">
                                    <span className="text-sm font-medium">Create PostgreSQL Database</span>
                                    <p className="text-xs text-slate-500 text-muted-foreground">
                                        If checked, we will provision a dedicated database for this project and inject
                                        <code> DATABASE_URL</code> into your environment variables.
                                        Useful for dynamic apps (Wordpress, Node API, etc).
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Website'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
