import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { activateUserPlan } from '@/lib/user-llm';
import { type PlanType } from '@/lib/plans';
import posthog from '@/lib/posthog';

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

    if (planType !== 'platform' && planType !== 'ai') {
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

    await activateUserPlan(session.user.id, planType);

    posthog.capture({
      distinctId: session.user.id,
      event: 'payment verified',
      properties: {
        plan_type: planType,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      },
    })

    return NextResponse.json({
      success: true,
      planType,
      message: `${planType === 'ai' ? 'AI' : 'Platform'} plan activated successfully.`,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
