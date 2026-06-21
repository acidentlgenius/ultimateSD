import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PLAN_PRICES_PAISE, type PlanType } from '@/lib/plans';

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function getRazorpayKeyId(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getPlanAmountPaise(planType: Exclude<PlanType, 'free'>): number {
  return PLAN_PRICES_PAISE[planType];
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}
