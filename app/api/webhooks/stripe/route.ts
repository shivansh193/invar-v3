import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      const customerId = checkoutSession.customer as string
      const subscriptionId = checkoutSession.subscription as string

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'growth', stripeSubscriptionId: subscriptionId },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'free', stripeSubscriptionId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
