'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Zap, Key, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { AI_MONTHLY_CREDITS, FREE_MONTHLY_CREDITS, PLAN_PRICES_INR, type PlanType } from '@/lib/plans';
import { FREE_PROBLEM_SLUGS } from '@/lib/access';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface PricingClientProps {
  isLoggedIn: boolean;
  currentPlan: PlanType;
  razorpayKeyId?: string;
}

const PLATFORM_FEATURES = [
  'Unlock all 75+ FAANG problems',
  'Bring your own Gemini API key (BYOK)',
  'Unlimited problem attempts',
  'Advanced architecture widgets',
  'Save diagram state',
];

const AI_FEATURES = [
  'Unlock all 75+ FAANG problems',
  `${AI_MONTHLY_CREDITS} AI feedback credits / month`,
  'No API keys required',
  'Help assistant + step evaluation',
  'Premium solutions access',
];

const FREE_FEATURES = [
  `${FREE_PROBLEM_SLUGS.length} core starter problems`,
  `${FREE_MONTHLY_CREDITS} AI credits / month on free problems`,
  'Bring your own API key (BYOK) when credits run out',
  'Interactive diagram canvas',
  'Architecture widgets & simulators',
  'Progress tracking & gamification',
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingClient({ isLoggedIn, currentPlan, razorpayKeyId }: PricingClientProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<Exclude<PlanType, 'free'> | null>(null);

  const startCheckout = async (planType: Exclude<PlanType, 'free'>) => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    if (!razorpayKeyId) {
      toast.error('Payments are not configured yet. Please try again later.');
      return;
    }

    setLoadingPlan(planType);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load payment checkout');
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error ?? 'Failed to create order');
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ultimate SD',
        description: `${planType === 'ai' ? 'AI' : 'Platform'} Plan — Monthly`,
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              planType,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            toast.error(verifyData.error ?? 'Payment verification failed');
            return;
          }

          toast.success(verifyData.message ?? 'Plan activated!');
          router.refresh();
        },
        theme: { color: '#6366f1' },
      });

      rzp.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <Card className="relative border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Free</CardTitle>
          <CardDescription>Perfect for getting started</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">₹0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href={isLoggedIn ? '/' : '/login'}>
              {currentPlan === 'free' && isLoggedIn ? 'Current Plan' : 'Get Started Free'}
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="relative border-blue-500/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            Platform <Key className="h-5 w-5 text-blue-500" />
          </CardTitle>
          <CardDescription>Bring Your Own Key (BYOK)</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">₹{PLAN_PRICES_INR.platform}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {PLATFORM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            disabled={loadingPlan === 'platform' || currentPlan === 'platform' || currentPlan === 'ai'}
            onClick={() => startCheckout('platform')}
          >
            {currentPlan === 'platform' ? 'Current Plan' : loadingPlan === 'platform' ? 'Processing…' : (
              <>
                <Zap className="mr-2 h-4 w-4 fill-white" />
                Subscribe Platform
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="relative overflow-hidden border-indigo-500/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ring-1 ring-indigo-500/20">
        <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            AI Plan <Sparkles className="h-5 w-5 text-indigo-500" />
          </CardTitle>
          <CardDescription>Generous AI credits included</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">₹{PLAN_PRICES_INR.ai}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {AI_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            size="lg"
            disabled={loadingPlan === 'ai' || currentPlan === 'ai'}
            onClick={() => startCheckout('ai')}
          >
            {currentPlan === 'ai' ? 'Current Plan' : loadingPlan === 'ai' ? 'Processing…' : (
              <>
                <Zap className="mr-2 h-4 w-4 fill-white" />
                Upgrade to AI
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
