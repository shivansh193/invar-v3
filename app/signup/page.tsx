'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Navbar } from '@/components/layout/navbar'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('You must agree to the Terms of Service'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return }
      await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-8 py-32">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-4xl font-bold text-white uppercase tracking-tight"
            >
              Secure your app
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
              Create an Invariant account to start deep-traversal scanning.
            </p>
          </div>

          <div className="space-y-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <AuthInput label="First Name" placeholder="Jane" value={firstName} onChange={setFirstName} />
                <AuthInput label="Last Name" placeholder="Doe" value={lastName} onChange={setLastName} />
              </div>
              <AuthInput label="Work Email" type="email" placeholder="jane@company.com" value={email} onChange={setEmail} />
              <AuthInput label="Company Name" placeholder="Acme Inc." value={company} onChange={setCompany} />
              <AuthInput label="Password" type="password" placeholder="••••••••••••" value={password} onChange={setPassword} />

              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 focus:ring-[#00D97E] text-[#00D97E]"
                />
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">
                  I agree to the <Link href="#" className="text-zinc-400 hover:text-[#00D97E]">Terms of Service</Link> and <Link href="#" className="text-zinc-400 hover:text-[#00D97E]">Privacy Policy</Link>.
                </p>
              </div>

              {error && <p className="text-red-400 font-mono text-xs uppercase tracking-widest">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="w-full bg-[#00D97E] text-white font-bold py-4 uppercase tracking-tighter hover:brightness-110 transition-all text-sm shadow-[0_0_20px_rgba(0,217,126,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest">
                <span className="bg-[#0A0A0F] px-4 text-zinc-600">Or use OAuth</span>
              </div>
            </div>

            <div className="flex gap-4">
              <SocialButton icon="G" label="Google" onClick={() => signIn('google', { callbackUrl: '/dashboard' })} />
              <SocialButton icon="GH" label="GitHub" onClick={() => signIn('github', { callbackUrl: '/dashboard' })} />
            </div>
          </div>

          <p className="text-center text-xs font-mono text-zinc-600 uppercase tracking-widest">
            Already have an account? <Link href="/login" className="text-[#00D97E] hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function SocialButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-3 border border-zinc-800 bg-zinc-800/10 py-3 hover:border-zinc-700 hover:bg-zinc-800/30 transition-all"
    >
      <span className="font-bold text-xs uppercase tracking-tighter">{icon}</span>
      <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{label}</span>
    </button>
  )
}

function AuthInput({ label, type = 'text', placeholder, value, onChange }: { label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1f1f25] border border-zinc-700 focus:border-[#00D97E] text-white font-mono px-4 py-3 text-xs outline-none transition-colors rounded-sm"
      />
    </div>
  )
}
