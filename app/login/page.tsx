'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password')
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9] flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-8 py-32">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-4xl font-bold text-white uppercase tracking-tight"
            >
              Log in to Invariant
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
              Access your security dashboard and reports.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <SocialButton icon="G" label="Continue with Google" onClick={() => signIn('google', { callbackUrl: '/dashboard' })} />
              <SocialButton icon="GH" label="Continue with GitHub" onClick={() => signIn('github', { callbackUrl: '/dashboard' })} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest">
                <span className="bg-[#0A0A0F] px-4 text-zinc-600">Or with email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <AuthInput label="Email address" type="email" placeholder="name@company.com" value={email} onChange={setEmail} />
              <AuthInput label="Password" type="password" placeholder="••••••••••••" value={password} onChange={setPassword} />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 focus:ring-[#00D97E] text-[#00D97E]" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Remember me</span>
                </label>
                <Link href="#" className="text-[10px] font-mono text-zinc-500 hover:text-[#00D97E] uppercase tracking-widest">Forgot password?</Link>
              </div>

              {error && (
                <p className="text-red-400 font-mono text-xs uppercase tracking-widest">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="w-full bg-[#00D97E] text-white font-bold py-4 uppercase tracking-tighter hover:brightness-110 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs font-mono text-zinc-600 uppercase tracking-widest">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#00D97E] hover:underline">Sign up</Link>
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
      className="w-full flex items-center justify-center gap-3 border border-zinc-700 bg-zinc-800/20 py-3.5 hover:border-zinc-500 hover:bg-zinc-800/40 transition-all"
    >
      <span className="font-bold text-xs uppercase tracking-tighter">{icon}</span>
      <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">{label}</span>
    </button>
  )
}

function AuthInput({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1f1f25] border border-zinc-700 focus:border-[#00D97E] text-white font-mono px-4 py-3.5 text-xs outline-none transition-colors"
      />
    </div>
  )
}
