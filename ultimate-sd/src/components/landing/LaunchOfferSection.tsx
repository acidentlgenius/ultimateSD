'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Gift, Key, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  claimLaunchPlatformAction,
  enterAiGiveawayAction,
} from '@/app/actions/launch-offer';
import {
  LAUNCH_AI_WINNER_SLOTS,
  LAUNCH_OFFER_MONTHS,
  LAUNCH_PLATFORM_SLOTS,
  type LaunchOfferPublicStats,
  type LaunchOfferUserState,
} from '@/lib/launch-offer';

interface LaunchOfferSectionProps {
  stats: LaunchOfferPublicStats;
  userState: LaunchOfferUserState | null;
  isLoggedIn: boolean;
  /** Less padding when nested inside another page (e.g. pricing). */
  embedded?: boolean;
}

export function LaunchOfferSection({
  stats,
  userState,
  isLoggedIn,
  embedded = false,
}: LaunchOfferSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'claim' | 'enter' | null>(null);

  if (!stats.isActive) return null;

  const platformSoldOut = stats.platformRemaining === 0;
  const platformClaimed = userState?.redemptionKind === 'PLATFORM_LAUNCH';
  const aiWon = userState?.redemptionKind === 'AI_GIVEAWAY';
  const hasRedeemed = userState?.hasRedeemed ?? false;
  const hasEntered = userState?.hasEnteredGiveaway ?? false;

  const platformProgress = Math.round((stats.platformClaimed / LAUNCH_PLATFORM_SLOTS) * 100);

  const handleClaim = () => {
    if (!isLoggedIn) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setAction('claim');
    startTransition(async () => {
      const result = await claimLaunchPlatformAction();
      setAction(null);

      if ('error' in result) {
        const messages: Record<string, string> = {
          not_authenticated: 'Please sign in to claim your launch offer.',
          offer_ended: 'The launch offer has ended.',
          already_redeemed: 'You have already redeemed a launch offer.',
          sold_out: 'All launch Platform slots have been claimed.',
          has_paid_plan: 'You already have an active paid plan.',
        };
        toast.error(messages[result.error] ?? 'Could not claim offer');
        return;
      }

      toast.success('Launch offer claimed! Enjoy 3 months of Platform access.');
      router.refresh();
    });
  };

  const handleEnter = () => {
    if (!isLoggedIn) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setAction('enter');
    startTransition(async () => {
      const result = await enterAiGiveawayAction();
      setAction(null);

      if ('error' in result) {
        const messages: Record<string, string> = {
          not_authenticated: 'Please sign in to enter the giveaway.',
          offer_ended: 'The launch offer has ended.',
          already_redeemed: 'You have already redeemed a launch offer.',
          already_entered: 'You are already entered in the AI giveaway.',
          has_paid_plan: 'You already have an active paid plan.',
        };
        toast.error(messages[result.error] ?? 'Could not enter giveaway');
        return;
      }

      toast.success('You are entered in the AI plan giveaway!');
      router.refresh();
    });
  };

  return (
    <section
      id="launch-offer"
      className={embedded ? 'py-8 md:py-12 bg-background relative overflow-hidden' : 'py-16 md:py-24 bg-background relative overflow-hidden'}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12 space-y-4"
        >
          {!embedded && (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Gift className="w-4 h-4" />
                Limited launch offer
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight px-2">
                Free access for early supporters
              </h2>
            </>
          )}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {embedded ? (
              <>
                {LAUNCH_PLATFORM_SLOTS} free {LAUNCH_OFFER_MONTHS}-month Platform plans and{' '}
                {LAUNCH_AI_WINNER_SLOTS} AI giveaways — claim or enter below.
              </>
            ) : (
              <>
                Celebrate our launch with {LAUNCH_PLATFORM_SLOTS} free {LAUNCH_OFFER_MONTHS}-month Platform plans
                and {LAUNCH_AI_WINNER_SLOTS} AI plan giveaways.
              </>
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-blue-500/30 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                Platform Plan <Key className="h-5 w-5 text-blue-500" />
              </CardTitle>
              <CardDescription>
                {LAUNCH_OFFER_MONTHS} months free · BYOK · all problems unlocked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Claimed</span>
                  <span className="font-medium">
                    {stats.platformClaimed} / {LAUNCH_PLATFORM_SLOTS}
                  </span>
                </div>
                <Progress value={platformProgress} className="h-2" />
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  'First-come, first-served',
                  'Unlock all practice problems',
                  'Use your own Gemini API key',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {platformClaimed || aiWon ? (
                <Button className="w-full" disabled>
                  Launch offer claimed
                </Button>
              ) : platformSoldOut ? (
                <Button className="w-full" variant="outline" disabled>
                  All slots claimed
                </Button>
              ) : hasRedeemed ? (
                <Button className="w-full" disabled>
                  Already redeemed
                </Button>
              ) : (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={isPending && action === 'claim'}
                  onClick={handleClaim}
                >
                  {isPending && action === 'claim'
                    ? 'Claiming…'
                    : isLoggedIn
                      ? 'Claim free Platform access'
                      : 'Sign in to claim'}
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="border-indigo-500/40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ring-1 ring-indigo-500/20">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                AI Plan <Sparkles className="h-5 w-5 text-indigo-500" />
              </CardTitle>
              <CardDescription>
                {LAUNCH_AI_WINNER_SLOTS} winners · {LAUNCH_OFFER_MONTHS} months free
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Trophy className="h-8 w-8 text-indigo-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{stats.aiEntries} entries so far</p>
                  <p className="text-muted-foreground">{stats.aiWinners} / {LAUNCH_AI_WINNER_SLOTS} winners picked</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  'No API keys required',
                  'Generous monthly AI credits',
                  'Winners notified by email',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {aiWon ? (
                <Button className="w-full" disabled>
                  You won the AI giveaway!
                </Button>
              ) : platformClaimed ? (
                <Button className="w-full" disabled>
                  Platform offer already claimed
                </Button>
              ) : hasEntered ? (
                <Button className="w-full" variant="outline" disabled>
                  You&apos;re entered ✓
                </Button>
              ) : hasRedeemed ? (
                <Button className="w-full" disabled>
                  Already redeemed
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  size="lg"
                  disabled={isPending && action === 'enter'}
                  onClick={handleEnter}
                >
                  {isPending && action === 'enter'
                    ? 'Entering…'
                    : isLoggedIn
                      ? 'Enter AI giveaway'
                      : 'Sign in to enter'}
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
                <Link href="/pricing">View full pricing</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
