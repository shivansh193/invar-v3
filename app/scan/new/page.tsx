'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { ScanType, ScanDepth } from '@/lib/types'

type Step = 1 | 2 | 3

const DEPTHS = [
  { id: 'quick', label: 'Quick', desc: '1 level', time: '~1 min' },
  { id: 'shallow', label: 'Shallow', desc: 'Homepage + 1 level', time: '~2 min' },
  { id: 'standard', label: 'Standard', desc: 'Full app traversal', time: '~8 min' },
  { id: 'deep', label: 'Deep', desc: 'Follows all links', time: '~20 min' },
] as const

function NewScanForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as ScanType) || 'unauthenticated'
  const initialUrl = searchParams.get('url') || ''

  const [step, setStep] = useState<Step>(1)
  const [url, setUrl] = useState(initialUrl)
  const [urlError, setUrlError] = useState('')
  const [scanType, setScanType] = useState<ScanType>(initialType)
  const [depth, setDepth] = useState<ScanDepth>('quick')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [isLaunching, setIsLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [domainVerification, setDomainVerification] = useState<{
    domain: string
    domainId: string
    token: string
    checking: boolean
    failed: boolean
  } | null>(null)

  function validateUrl(val: string): boolean {
    try {
      const u = new URL(val.startsWith('http') ? val : `https://${val}`)
      return !!u.hostname
    } catch {
      return false
    }
  }

  function handleStep1() {
    if (!url.trim()) { setUrlError('Please enter a URL'); return }
    if (!validateUrl(url)) { setUrlError('Please enter a valid URL'); return }
    setUrlError('')
    if (scanType === 'authenticated') {
      setStep(2)
    } else {
      setStep(3)
    }
  }

  async function handleLaunch() {
    setIsLaunching(true)
    setLaunchError(null)
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url.startsWith('http') ? url : `https://${url}`,
          type: scanType,
          depth,
          credentials: scanType === 'authenticated' ? { username, password } : undefined,
          exclusions: exclusions.split('\n').filter(Boolean),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'upgrade_required') {
          setLaunchError('Authenticated scans require a Growth plan. Please upgrade.')
        } else if (data.error === 'daily_limit_reached') {
          setLaunchError('Free tier limit: 1 scan per day. Upgrade for unlimited scans.')
        } else if (data.error === 'domain_not_verified') {
          setDomainVerification({
            domain: data.domain,
            domainId: data.domainId,
            token: data.token,
            checking: false,
            failed: false,
          })
        } else {
          setLaunchError(data.error ?? 'Failed to create scan')
        }
        setIsLaunching(false)
        return
      }

      router.push(`/scan/${data.id}/progress`)
    } catch {
      setLaunchError('Something went wrong. Please try again.')
      setIsLaunching(false)
    }
  }

  async function handleVerifyDomain() {
    if (!domainVerification) return
    setDomainVerification((prev) => prev ? { ...prev, checking: true, failed: false } : null)
    try {
      const res = await fetch('/api/domains/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: domainVerification.domainId }),
      })
      const data = await res.json()
      if (data.verified) {
        setDomainVerification(null)
        handleLaunch()
      } else {
        setDomainVerification((prev) => prev ? { ...prev, checking: false, failed: true } : null)
      }
    } catch {
      setDomainVerification((prev) => prev ? { ...prev, checking: false, failed: true } : null)
    }
  }

  const normalizedUrl = url.startsWith('http') ? url : url ? `https://${url}` : ''

  return (
    <div className="max-w-2xl mx-auto px-8 pt-32 pb-20">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-12">
        {[
          { n: 1, label: 'Target' },
          { n: 2, label: 'Configure' },
          { n: 3, label: 'Launch' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold border transition-colors ${
                  step === n
                    ? 'bg-[#00D97E] border-[#00D97E] text-white'
                    : step > n
                    ? 'bg-[#00D97E]/20 border-[#00D97E]/40 text-[#00D97E]'
                    : 'bg-transparent border-zinc-700 text-zinc-600'
                }`}
              >
                {step > n ? '✓' : n}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-widest mt-1.5 ${step >= n ? 'text-zinc-400' : 'text-zinc-700'}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-20 h-px mb-5 mx-1 ${step > n ? 'bg-[#00D97E]/40' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Target */}
      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-2xl font-bold text-white uppercase tracking-tight mb-1"
            >
              Target URL
            </h1>
            <p className="text-zinc-500 text-sm">Enter the URL you want Invariant to scan.</p>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Application URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
              placeholder="https://app.yourproduct.com"
              className="w-full bg-[#1f1f25] border border-zinc-700 focus:border-[#00D97E] text-white font-mono px-4 py-3 text-sm outline-none transition-colors"
            />
            {urlError && <p className="text-red-400 font-mono text-xs mt-2">{urlError}</p>}
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-3">
              Scan Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ScanTypeCard
                type="unauthenticated"
                selected={scanType === 'unauthenticated'}
                onSelect={() => setScanType('unauthenticated')}
                title="Unauthenticated Scan"
                badge="FREE"
                description="Crawls public-facing pages. Tests XSS, info disclosure, API discovery."
              />
              <ScanTypeCard
                type="authenticated"
                selected={scanType === 'authenticated'}
                onSelect={() => setScanType('authenticated')}
                title="Authenticated Scan"
                badge="GROWTH"
                description="Logs in and tests business logic, IDOR, and privilege escalation."
              />
            </div>
          </div>

          <button
            onClick={handleStep1}
            className="w-full bg-[#00D97E] text-white font-bold py-4 uppercase tracking-tighter hover:brightness-110 transition-all"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Configuration (authenticated only) */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-2xl font-bold text-white uppercase tracking-tight mb-1"
            >
              Scan Configuration
            </h1>
            <p className="text-zinc-500 text-sm">
              Provide credentials for <span className="text-zinc-300 font-mono text-xs">{normalizedUrl}</span>
            </p>
          </div>

          <div className="bg-[#00D97E]/5 border border-[#00D97E]/20 px-4 py-3">
            <p className="text-xs font-mono text-zinc-400">
              <span className="text-[#00D97E]">⚑ Security note:</span> Credentials are encrypted immediately on receipt and never stored in plaintext or logs. We recommend creating a dedicated test account.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              label="Username or Email"
              value={username}
              onChange={setUsername}
              placeholder="test@yourproduct.com"
            />
            <FormField
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-3">
              Scan Depth
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEPTHS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDepth(d.id as ScanDepth)}
                  className={`p-4 border text-left transition-colors ${
                    depth === d.id
                      ? 'border-[#00D97E]/50 bg-[#00D97E]/5'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className={`font-mono text-xs font-bold uppercase tracking-wide mb-1 ${depth === d.id ? 'text-[#00D97E]' : 'text-zinc-300'}`}>
                    {d.label}
                  </div>
                  <div className="text-zinc-500 text-xs">{d.desc}</div>
                  <div className="text-zinc-600 font-mono text-[10px] mt-1">{d.time}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Exclusions <span className="text-zinc-700 normal-case tracking-normal">(optional, one per line)</span>
            </label>
            <textarea
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              placeholder={'/logout\n/delete-account\n/admin'}
              rows={3}
              className="w-full bg-[#1f1f25] border border-zinc-700 focus:border-[#00D97E] text-white font-mono px-4 py-3 text-xs outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-zinc-800 text-zinc-500 font-mono py-4 text-xs uppercase tracking-widest hover:border-zinc-700 transition-colors"
            >
              ← Target
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!username || !password}
              className="flex-[2] bg-[#00D97E] text-white font-bold py-4 uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Review & Launch →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-2xl font-bold text-white uppercase tracking-tight mb-1"
            >
              Confirm & Launch
            </h1>
            <p className="text-zinc-500 text-sm">Review what will be scanned before launching.</p>
          </div>

          <div className="border border-zinc-800 divide-y divide-zinc-800">
            <SummaryRow label="Target" value={normalizedUrl || url} mono />
            <SummaryRow label="Scan type" value={scanType === 'authenticated' ? 'Authenticated (Growth)' : 'Unauthenticated (Free)'} />
            {scanType === 'authenticated' && (
              <>
                <SummaryRow label="Credentials" value={`${username} / ••••••••`} mono />
                <SummaryRow label="Depth" value={depth.charAt(0).toUpperCase() + depth.slice(1)} />
              </>
            )}
            <SummaryRow
              label="Est. duration"
              value={depth === 'shallow' ? '~2 minutes' : depth === 'standard' ? '~8 minutes' : '~20 minutes'}
            />
            <SummaryRow label="Domain verified" value={scanType === 'unauthenticated' ? 'Not required (public scan)' : 'Required — verify you own this domain'} />
          </div>

          {scanType === 'authenticated' && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 px-4 py-3">
              <p className="text-xs font-mono text-yellow-400/80">
                ⚠ By launching an authenticated scan, you confirm you are authorized to test this application and own or have permission to test this domain.
              </p>
            </div>
          )}

          {domainVerification && (
            <div className="border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-4">
              <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest">
                Domain verification required for <span className="text-white">{domainVerification.domain}</span>
              </p>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                Add a DNS TXT record or host a file to prove ownership, then click Verify:
              </p>
              <div className="bg-[#0A0A0F] border border-zinc-800 px-4 py-3 font-mono text-xs text-zinc-400 space-y-1">
                <p>DNS: <span className="text-zinc-300">_invariant-verify.{domainVerification.domain}</span></p>
                <p>Value: <span className="text-[#00D97E]">invariant-verify={domainVerification.token}</span></p>
                <p className="pt-1 text-zinc-600">— or —</p>
                <p>File: <span className="text-zinc-300">https://{domainVerification.domain}/.well-known/invariant-verify.txt</span></p>
                <p>Contents: <span className="text-[#00D97E]">{domainVerification.token}</span></p>
              </div>
              {domainVerification.failed && (
                <p className="text-red-400 font-mono text-xs">Verification failed — check the record and try again.</p>
              )}
              <button
                onClick={handleVerifyDomain}
                disabled={domainVerification.checking}
                className="w-full border border-[#00D97E]/50 text-[#00D97E] font-mono py-3 text-xs uppercase tracking-widest hover:bg-[#00D97E]/10 transition-colors disabled:opacity-50"
              >
                {domainVerification.checking ? 'Checking...' : 'Verify Domain →'}
              </button>
            </div>
          )}

          {launchError && (
            <p className="text-red-400 font-mono text-xs uppercase tracking-widest">{launchError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(scanType === 'authenticated' ? 2 : 1)}
              className="flex-1 border border-zinc-700 text-zinc-400 font-mono py-3.5 text-sm uppercase tracking-widest hover:border-zinc-500 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={isLaunching || !!domainVerification}
              className="flex-[2] bg-[#00D97E] text-white font-bold py-3.5 uppercase tracking-tighter hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isLaunching ? (
                <>
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  Launching...
                </>
              ) : (
                'Launch Scan →'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewScanPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      <Suspense fallback={<div className="max-w-2xl mx-auto px-8 pt-32 pb-20 font-mono text-xs text-zinc-500">Loading configurations...</div>}>
        <NewScanForm />
      </Suspense>
    </div>
  )
}

function ScanTypeCard({
  type, selected, onSelect, title, badge, description,
}: {
  type: ScanType
  selected: boolean
  onSelect: () => void
  title: string
  badge: string
  description: string
}) {
  return (
    <button
      onClick={onSelect}
      className={`p-5 border text-left transition-colors ${
        selected
          ? 'border-[#00D97E]/50 bg-[#00D97E]/5'
          : 'border-zinc-700 hover:border-zinc-500'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          className={`text-sm font-bold uppercase tracking-tight ${selected ? 'text-white' : 'text-zinc-400'}`}
        >
          {title}
        </span>
        <span
          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border tracking-widest uppercase ${
            badge === 'FREE'
              ? 'border-[#00D97E]/30 text-[#00D97E] bg-[#00D97E]/5'
              : 'border-zinc-600 text-zinc-400 bg-zinc-800/50'
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      {selected && (
        <div className="mt-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[#00D97E] rounded-full" />
          <span className="text-[10px] font-mono text-[#00D97E] uppercase tracking-widest">Selected</span>
        </div>
      )}
    </button>
  )
}

function FormField({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1f1f25] border border-zinc-700 focus:border-[#00D97E] text-white font-mono px-4 py-3 text-sm outline-none transition-colors"
      />
    </div>
  )
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between px-5 py-3.5">
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex-shrink-0 mr-4">{label}</span>
      <span className={`text-sm text-zinc-300 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}