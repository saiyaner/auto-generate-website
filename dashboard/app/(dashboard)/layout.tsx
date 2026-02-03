import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, Settings, LogOut, PlusCircle } from 'lucide-react'
import { logout } from '../actions'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = (await cookies()).get('session')
    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">Citaks Homelab</h1>
                    <p className="text-xs text-slate-400 mt-1">v1.0.0</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/websites" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <Globe size={20} />
                        <span>Websites</span>
                    </Link>
                    <Link href="/websites/new" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <PlusCircle size={20} />
                        <span>New Website</span>
                    </Link>
                    <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <form action={logout}>
                        <button className="flex items-center space-x-3 px-3 py-2 w-full text-left text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between">
                    <h2 className="text-lg font-medium text-slate-800">Dashboard</h2>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                            A
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
