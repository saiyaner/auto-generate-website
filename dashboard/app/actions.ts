'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Mock Auth Logic (Replace with real bcrypt check)
    // Check if user exists (mock check against seeds)
    // For now, accept any login that matches 'admin' or 'demo_user'

    // NOTE: This is insecure, for demo only
    if (email === 'admin@citaks.my.id' && password === 'password123') {
        (await cookies()).set('session', 'admin_token', { httpOnly: true, path: '/' })
        redirect('/')
    } else {
        return { error: 'Invalid credentials' }
    }
}

export async function logout() {
    (await cookies()).delete('session')
    redirect('/login')
}
