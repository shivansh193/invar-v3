import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'

const TIERS = [
  {
    name: 'Community',
    price: '$0',
    description: 'For individual developers and open source projects.',
    features: [
      'Unauthenticated public scans',
      'OWASP Top 10 coverage',
      'Standard email support',
      '1 scan at a time',
      '7-day report retention'
    ],
    cta: 'Start for Free',
    href: '/scan/new',
    popular: false
  },
  {
    name: 'Growth',
    price: '$490',
    description: 'For growing teams that need deeper security insights.',
    features: [
      'Authenticated user flow testing',
      'Business logic vulnerability detection',
      'CI/CD pipeline integration',
      '24/7 Priority engineer support',
      '3 concurrent scans',
      'Unlimited report retention'
    ],
    cta: 'Try Growth Now',
    href: '/signup',
    popular: true
  },
  {
    name: 'Scale',
    price: 'Custom',
    description: 'For enterprises requiring maximum security assurance.',
    features: [
      'Custom vulnerability signatures',
      'Dedicated security engineer',
      'On-premise execution option',
      'SLA-backed response times',
      'Role-based access control',
      'Advanced API access'
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@invariant.io',
    popular: false
  }
]

export default function PricingPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 pt-40 pb-32">
        <div className="text-center mb-24">
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tight mb-6"
          >
            Transparent Pricing
          </h1>
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto">
            Choose the plan that fits your application's security requirements. From simple scans to deep autonomous testing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              className={`p-10 border flex flex-col h-full transition-all duration-300 ${
                tier.popular 
                  ? 'border-[#00D97E]/40 bg-[#00D97E]/5 relative scale-105 z-10' 
                  : 'border-zinc-800 bg-[#0f0f14] hover:border-zinc-700'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-[#00D97E] text-white text-[10px] font-bold px-10 py-1.5 rotate-45 translate-x-4 translate-y-3 uppercase tracking-[0.2em]">
                  Most Popular
                </div>
              )}
              
              <div className="mb-10">
                <h3 
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-bold text-white uppercase tracking-tight mb-2"
                >
                  {tier.name}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{tier.description}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-zinc-600 font-mono text-sm uppercase">/mo</span>}
                </div>
                {tier.price !== 'Custom' && (
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-2">Billed monthly</p>
                )}
              </div>

              <ul className="space-y-4 mb-12 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="text-[#00D97E] mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`w-full py-4 text-center font-bold uppercase tracking-tighter transition-all ${
                  tier.popular
                    ? 'bg-[#00D97E] text-white hover:brightness-110'
                    : 'border border-zinc-700 text-zinc-300 hover:border-[#00D97E] hover:text-white'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Preview or Note */}
        <div className="mt-32 pt-20 border-t border-zinc-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h4 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-white uppercase tracking-tight mb-4">Are there annual discounts?</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">Yes, save 20% on all plans when billed annually. Contact support to switch your billing cycle.</p>
            </div>
            <div>
              <h4 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-white uppercase tracking-tight mb-4">Can I cancel anytime?</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">Absolutely. Invariant is a month-to-month service with no long-term commitments. Cancel from your dashboard anytime.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer (Simplified) */}
      <footer className="border-t border-zinc-800/30">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-10 max-w-7xl mx-auto">
          <div className="font-mono font-bold text-lg mb-6 md:mb-0 flex items-center gap-1">
            <span className="text-[#00D97E]">&gt;_</span>
            <span className="text-white">INVARIANT</span>
          </div>
          <div className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase">
            © 2024 Invariant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
