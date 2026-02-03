'use client'

import { login } from '../actions'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useState } from 'react'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-center">Homelab Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <Input id="email" name="email" type="email" placeholder="admin@citaks.my.id" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Password</label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">Sign In</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
