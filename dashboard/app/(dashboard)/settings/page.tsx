import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                        Settings are currently read-only in this demo version.
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="font-medium">Host Address</div>
                        <div>localhost</div>

                        <div className="font-medium">Domain</div>
                        <div>citaks.my.id</div>

                        <div className="font-medium">Version</div>
                        <div>v1.0.0-alpha</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
