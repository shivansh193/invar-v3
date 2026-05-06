'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const plan = user?.plan ?? 'free'

  async function handleUpgrade() {
    const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handleManageBilling() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-8 pt-32 pb-20">
        <div className="mb-12">
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-3xl font-bold text-white uppercase tracking-tight"
          >
            Settings
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-1 uppercase tracking-widest">Account & Subscription Management</p>
        </div>

        <div className="space-y-12">
          {/* Section: Account */}
          <section className="space-y-6">
            <h2 className="text-xs font-mono text-[#00D97E] uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SettingField label="Full Name" value={user?.name ?? '—'} />
              <SettingField label="Email address" value={user?.email ?? '—'} />
            </div>
            <button className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-4 py-2 hover:border-zinc-700 transition-colors uppercase tracking-widest">
              Update Profile
            </button>
          </section>

          {/* Section: Subscription */}
          <section className="space-y-6">
            <h2 className="text-xs font-mono text-[#00D97E] uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Subscription Plan</h2>
            <div className="bg-[#1f1f25] border border-zinc-800 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">
                  {plan === 'growth' ? 'Growth Plan' : plan === 'scale' ? 'Scale Plan' : 'Community Plan'}
                </p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {plan === 'free'
                    ? 'Free forever · Unauthenticated scans only'
                    : plan === 'growth'
                    ? '$490/mo · Full authenticated scanning'
                    : 'Custom · Enterprise features'}
                </p>
              </div>
              {plan === 'free' ? (
                <button
                  onClick={handleUpgrade}
                  className="bg-[#00D97E] text-white font-mono text-[10px] font-bold px-6 py-2 uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Upgrade to Growth
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  className="border border-zinc-600 text-zinc-300 font-mono text-[10px] font-bold px-6 py-2 uppercase tracking-widest hover:border-zinc-400 transition-all"
                >
                  Manage Billing
                </button>
              )}
            </div>
          </section>

          {/* Section: API */}
          <section className="space-y-6">
            <h2 className="text-xs font-mono text-[#00D97E] uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">API Keys</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 bg-[#0A0A0F] border border-zinc-800 px-4 py-3">
                <span className="font-mono text-xs text-zinc-600">sk_live_••••••••••••••••••••••••</span>
                <button className="text-[10px] font-mono text-[#00D97E] uppercase tracking-widest">Copy Key</button>
              </div>
              <p className="text-[10px] font-mono text-zinc-600 leading-relaxed uppercase tracking-widest">
                API access is available for Growth and Scale plans.{' '}
                <Link href="/pricing" className="text-zinc-500 hover:text-white underline">Upgrade to access</Link>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block">{label}</label>
      <div className="bg-[#1f1f25] border border-zinc-800 px-4 py-3 text-sm text-zinc-300 font-mono">{value}</div>
    </div>
  )
}
