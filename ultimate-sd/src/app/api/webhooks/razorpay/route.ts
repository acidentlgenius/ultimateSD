import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { activateUserPlan } from '@/lib/user-llm';
import { prisma } from '@/lib/prisma';
import { type PlanType } from '@/lib/plans';
import posthog from '@/lib/posthog';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            notes?: { userId?: string; planType?: string };
          };
        };
      };
    };

    if (event.event !== 'payment.captured') {
      return NextResponse.json({ received: true });
    }

    const notes = event.payload?.payment?.entity?.notes;
    const userId = notes?.userId;
    const planType = notes?.planType as PlanType | undefined;

    if (
      !userId ||
      (planType !== 'platform' && planType !== 'ai' && planType !== 'lifetime')
    ) {
      return NextResponse.json({ received: true });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ received: true });
    }

    await activateUserPlan(userId, planType);

    posthog.capture({
      distinctId: userId,
      event: 'subscription activated',
      properties: {
        plan_type: planType,
        source: 'razorpay_webhook',
      },
    })

    return NextResponse.json({ received: true });
  } catch (error) {
    posthog.captureException(error as Error)
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
