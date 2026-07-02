import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRazorpayClient, verifyPaymentSignature } from '@/lib/razorpay';
import { activateUserPlan } from '@/lib/user-llm';
import { type PlanType, PLAN_LABELS } from '@/lib/plans';
import { canAccessFeature } from '@/lib/feature-flags-server';
import posthog from '@/lib/posthog';

function isPlanType(value: unknown): value is Exclude<PlanType, 'free'> {
  return value === 'platform' || value === 'ai' || value === 'lifetime';
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planType?: PlanType;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    if (planType !== 'platform' && planType !== 'ai' && planType !== 'lifetime') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const valid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!valid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // The HMAC signature only binds order_id|payment_id, not the plan or
    // amount that was actually paid for. Never trust the client-supplied
    // planType to decide what gets activated: fetch the order from Razorpay
    // and use its notes (set server-side at order-creation time) as the
    // source of truth.
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json({ error: 'Payment provider unavailable' }, { status: 503 });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const orderPlanType = order.notes?.planType;
    const orderUserId = order.notes?.userId;

    if (!isPlanType(orderPlanType)) {
      return NextResponse.json({ error: 'Order has an invalid plan type' }, { status: 400 });
    }

    if (orderUserId !== session.user.id) {
      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 });
    }

    if (orderPlanType === 'lifetime' && !(await canAccessFeature(session.user.id, 'lifetimePlan'))) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    await activateUserPlan(session.user.id, orderPlanType);

    posthog.capture({
      distinctId: session.user.id,
      event: 'payment verified',
      properties: {
        plan_type: orderPlanType,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      },
    })

    return NextResponse.json({
      success: true,
      planType: orderPlanType,
      message: `${PLAN_LABELS[orderPlanType]} plan activated successfully.`,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
