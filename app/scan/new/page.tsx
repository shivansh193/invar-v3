'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'

function OnboardingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [url, setUrl] = useState(searchParams.get('url') || '')
  const [scanType, setScanType] = useState<'public' | 'full'>('full')
  const [verifyMethod, setVerifyMethod] = useState<'dns' | 'file' | 'meta'>('dns')
  const [verified, setVerified] = useState(false)
  const [verifyToken, setVerifyToken] = useState('a4f3c8e2-9b1d-4f7a-8e3c-6b2d9a1f4e7c')
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const domain = (url || 'yourcompany.com').replace(/https?:\/\//, '').split('/')[0]

  async function handleInitiateVerify() {
    setVerifying(true)
    setError('')
    try {
      const res = await fetch('/api/domains/verify/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (data.token) setVerifyToken(data.token)
    } catch {}
    setVerifying(false)
  }

  async function handleCheckVerify() {
    setVerifying(true)
    setError('')
    try {
      const res = await fetch('/api/domains/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (data.verified) {
        setVerified(true)
      } else {
        setError('Verification not found yet. Make sure the record is in place and try again.')
      }
    } catch {
      setError('Verification check failed.')
    }
    setVerifying(false)
  }

  async function handleStartScan() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          type: scanType === 'full' ? 'authenticated' : 'unauthenticated',
          depth: 'quick',
        }),
      })
      const data = await res.json()
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 403 && data.code === 'upgrade_required') {
        setError('Authenticated scans require a Growth plan. Upgrade in Settings.')
        setSubmitting(false)
        return
      }
      if (res.status === 429) {
        setError('You\'ve reached your daily scan limit. Upgrade to Growth for unlimited scans.')
        setSubmitting(false)
        return
      }
      if (data.id) {
        router.push(`/scan/${data.id}/progress`)
      } else {
        setError(data.error || 'Failed to start scan.')
        setSubmitting(false)
      }
    } catch {
      setError('Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <div className="ob-shell">
      <div className="ob-top">
        <Wordmark />
        <div className="ob-step-pill">
          <span>Step {step + 1} of {scanType === 'full' ? 3 : 2}</span>
          <span className={`step-dot ${step >= 0 ? 'active' : ''}`} />
          {scanType === 'full' && <span className={`step-dot ${step >= 1 ? 'active' : ''}`} />}
          <span className={`step-dot ${step >= (scanType === 'full' ? 2 : 1) ? 'active' : ''}`} />
        </div>
        <Link href="/" className="btn btn-ghost btn-sm">Cancel</Link>
      </div>

      <div className="ob-body">
        {step === 0 && (
          <div className="ob-content">
            <div className="eyebrow" style={{ marginBottom: 18 }}>STEP 01 · TARGET</div>
            <h1 className="ob-h">Let&rsquo;s scan your product.</h1>
            <p className="ob-sub">Paste the URL you want to scan. Then choose what kind of scan to run.</p>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>
                Target URL
              </label>
              <input
                className="input mono"
                type="text"
                placeholder="https://app.yourcompany.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={{ fontSize: 15 }}
              />
            </div>

            <div className="scan-cards">
              <div className={`scan-card ${scanType === 'public' ? 'selected' : ''}`} onClick={() => setScanType('public')}>
                <div className="badge">Free</div>
                <div className="check-mark"><Icons.check /></div>
                <h4>Public scan</h4>
                <p>We explore your site without logging in. Finds information exposure, misconfigurations, and issues visible to anyone on the internet.</p>
              </div>
              <div className={`scan-card ${scanType === 'full' ? 'selected' : ''}`} onClick={() => setScanType('full')}>
                <div className="badge paid">$199 / mo</div>
                <div className="check-mark"><Icons.check /></div>
                <h4>Full authenticated scan</h4>
                <p>We log in as a real user and test access controls, permissions, and business logic. <b style={{ color: 'var(--text)' }}>This is the scan your enterprise prospects care about.</b></p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 }}>
              <p className="muted" style={{ fontSize: 13, maxWidth: 480 }}>
                We only scan sites you own. You will verify ownership before the scan begins.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => { setStep(1); handleInitiateVerify() }} disabled={!url}>
                Continue <Icons.arrow />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="ob-content">
            <div className="eyebrow" style={{ marginBottom: 18 }}>STEP 02 · VERIFY OWNERSHIP</div>
            <h1 className="ob-h">
              Verify you own <span className="mono" style={{ color: 'var(--accent)' }}>{domain}</span>
            </h1>
            <p className="ob-sub">We verify domain ownership before scanning. Choose any one method below.</p>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {[
                  { k: 'dns' as const, l: 'DNS record' },
                  { k: 'file' as const, l: 'File upload' },
                  { k: 'meta' as const, l: 'Meta tag' },
                ].map(t => (
                  <button
                    key={t.k}
                    onClick={() => setVerifyMethod(t.k)}
                    style={{
                      padding: '14px 22px', flex: 1,
                      borderRight: '1px solid var(--border)',
                      color: verifyMethod === t.k ? 'var(--text)' : 'var(--text-2)',
                      background: verifyMethod === t.k ? 'var(--bg-3)' : 'transparent',
                      borderBottom: verifyMethod === t.k ? '2px solid var(--accent)' : 'none',
                      marginBottom: verifyMethod === t.k ? -1 : 0,
                      fontSize: 14,
                    }}
                  >{t.l}</button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {verifyMethod === 'dns' && (
                  <div>
                    <p style={{ marginBottom: 14, fontSize: 14 }}>Add this TXT record to your domain&rsquo;s DNS:</p>
                    <pre className="evidence" style={{ color: 'var(--text)' }}>{`Type:   TXT\nHost:   _invariant-verify.${domain}\nValue:  ${verifyToken}`}</pre>
                    <p className="muted mt-16" style={{ fontSize: 13 }}>DNS changes can take a few minutes to propagate.</p>
                  </div>
                )}
                {verifyMethod === 'file' && (
                  <div>
                    <p style={{ marginBottom: 14, fontSize: 14 }}>Serve this content at <code className="mono" style={{ color: 'var(--accent)' }}>{`https://${domain}/.well-known/invariant-verify.txt`}</code>:</p>
                    <pre className="evidence" style={{ color: 'var(--text)' }}>{verifyToken}</pre>
                  </div>
                )}
                {verifyMethod === 'meta' && (
                  <div>
                    <p style={{ marginBottom: 14, fontSize: 14 }}>Add this meta tag to your HTML <code className="mono" style={{ color: 'var(--accent)' }}>{'<head>'}</code>:</p>
                    <pre className="evidence" style={{ color: 'var(--text)' }}>{`<meta name="invariant-verify" content="${verifyToken}"/>`}</pre>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
                  <button
                    className={`btn ${verified ? 'btn-subtle' : 'btn-primary'}`}
                    onClick={verified ? undefined : handleCheckVerify}
                    disabled={verified || verifying}
                  >
                    {verified ? <><Icons.check /> Verified</> : verifying ? 'Checking…' : 'Check now'}
                  </button>
                  {verified && <span className="muted" style={{ fontSize: 13 }}>You can run this scan and skip this step in the future.</span>}
                </div>
                {error && <p style={{ color: 'var(--crit)', fontSize: 13, marginTop: 12 }}>{error}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => scanType === 'full' ? setStep(2) : handleStartScan()}
                disabled={!verified || submitting}
              >
                {submitting ? 'Starting…' : <>Start scan <Icons.arrow /></>}
              </button>
            </div>
          </div>
        )}

        {step === 2 && scanType === 'full' && (
          <div className="ob-content">
            <div className="eyebrow" style={{ marginBottom: 18 }}>STEP 03 · AUTHENTICATE</div>
            <h1 className="ob-h">Provide login credentials</h1>
            <p className="ob-sub">We&rsquo;ll log in as a test user to scan your authenticated flows. These credentials are used only during the scan and never stored.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Test account email</label>
                <input className="input" type="email" placeholder="testuser@yourcompany.com" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>Test account password</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
            </div>

            {error && <p style={{ color: 'var(--crit)', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={handleStartScan} disabled={submitting}>
                {submitting ? 'Starting…' : <>Start scan <Icons.arrow /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewScanPage() {
  return (
    <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--text-3)' }}>Loading…</div>}>
      <OnboardingInner />
    </Suspense>
  )
}
