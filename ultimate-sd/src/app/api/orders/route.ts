import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getPlanAmountPaise,
  getRazorpayClient,
  isRazorpayConfigured,
} from '@/lib/razorpay';
import { type PlanType } from '@/lib/plans';
import { canAccessFeature } from '@/lib/feature-flags-server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Payments are not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const { planType } = await req.json() as { planType?: PlanType };
    if (planType !== 'platform' && planType !== 'ai' && planType !== 'lifetime') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }
    if (planType === 'lifetime' && !(await canAccessFeature(session.user.id, 'lifetimePlan'))) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json({ error: 'Payment provider unavailable' }, { status: 503 });
    }

    const amount = getPlanAmountPaise(planType);
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `${planType}_${session.user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planType,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planType,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
