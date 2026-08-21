'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { saveUserPreferences, skipOnboarding } from '@/app/actions/progress';
import { toast } from 'sonner';
import { Check, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPERIENCE_LEVELS, PRACTICE_INTENTS, RECOMMENDED_FIRST_PROBLEM, type ExperienceLevel, type PracticeIntent } from '@/lib/onboarding';
import { getProblemBySlug } from '@/lib/problems';

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Netflix', 'Uber', 'Microsoft', 'Apple', 'Spotify', 'Twitter/X'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const FOCUS_AREAS = ['System Design', 'API Design', 'Database', 'Microservices', 'Scalability'];

type OnboardingStep = 'goal' | 'level' | 'ready' | 'prefs';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function OnboardingModal({ isOpen, onClose, userId }: OnboardingModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('goal');
    const [selectedIntent, setSelectedIntent] = useState<PracticeIntent | null>(null);
    const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<ExperienceLevel | null>(null);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const recommendedProblem = selectedIntent
        ? getProblemBySlug(RECOMMENDED_FIRST_PROBLEM[selectedIntent])
        : undefined;

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const savePreferences = async () => {
        const result = await saveUserPreferences(
            selectedCompanies,
            selectedDifficulty,
            selectedFocus,
            selectedIntent ?? '',
            selectedExperienceLevel ?? ''
        );
        if (!result.success) {
            toast.error(
                result.error === 'session_stale'
                    ? 'Your session is out of date. Sign out and sign back in.'
                    : 'Failed to save preferences.'
            );
        }
        return result.success;
    };

    const handleSkip = async () => {
        try {
            const result = await skipOnboarding();
            if (!result.success) {
                toast.error(
                    result.error === 'session_stale'
                        ? 'Your session is out of date. Sign out and sign back in.'
                        : 'Could not save onboarding status. Please try again.'
                );
                return;
            }
            onClose();
            router.refresh();
        } catch {
            toast.error('Could not save onboarding status. Please try again.');
        }
    };

    const handleStartSolving = async () => {
        if (!recommendedProblem) return;
        setIsSaving(true);
        try {
            const ok = await savePreferences();
            if (!ok) return;
            onClose();
            router.push(`/practice/${recommendedProblem.slug}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExplore = async () => {
        setIsSaving(true);
        try {
            const ok = await savePreferences();
            if (!ok) return;
            onClose();
            router.refresh();
            document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinishPrefs = async () => {
        setIsSaving(true);
        try {
            const ok = await savePreferences();
            if (ok) {
                toast.success('Preferences saved!', { description: 'We will use these to recommend problems on your dashboard.' });
                setStep('ready');
                router.refresh();
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-card" aria-describedby={undefined}>
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 'goal' && (
                            <motion.div
                                key="goal"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">What brings you here?</DialogTitle>
                                    <DialogDescription className="text-lg">Pick a goal and we&apos;ll point you at the right first problem.</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-3">
                                    {PRACTICE_INTENTS.map(intent => (
                                        <div
                                            key={intent.id}
                                            onClick={() => { setSelectedIntent(intent.id); setStep('level'); }}
                                            className={`
                                        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                                        ${selectedIntent === intent.id
                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'}
                                    `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-lg font-semibold ${selectedIntent === intent.id ? 'text-primary' : ''}`}>{intent.label}</span>
                                                {selectedIntent === intent.id && <Check className="w-5 h-5 text-primary" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{intent.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                                        Skip for now
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'level' && (
                            <motion.div
                                key="level"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">What&apos;s your experience level?</DialogTitle>
                                    <DialogDescription className="text-lg">We&apos;ll calibrate difficulty and pacing to match where you are today.</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-3">
                                    {EXPERIENCE_LEVELS.map(level => (
                                        <div
                                            key={level.id}
                                            onClick={() => { setSelectedExperienceLevel(level.id); setStep('ready'); }}
                                            className={`
                                        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                                        ${selectedExperienceLevel === level.id
                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'}
                                    `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-lg font-semibold ${selectedExperienceLevel === level.id ? 'text-primary' : ''}`}>{level.label}</span>
                                                {selectedExperienceLevel === level.id && <Check className="w-5 h-5 text-primary" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep('goal')} className="text-muted-foreground">
                                        Back
                                    </Button>
                                    <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                                        Skip for now
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'ready' && (
                            <motion.div
                                key="ready"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">You&apos;re set. Start here:</DialogTitle>
                                    <DialogDescription className="text-lg">
                                        The best first problem for your goal — free, with step-by-step AI guidance.
                                    </DialogDescription>
                                </DialogHeader>

                                {recommendedProblem && (
                                    <div className="p-5 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold">{recommendedProblem.title}</span>
                                            <Badge variant="secondary">{recommendedProblem.difficulty}</Badge>
                                            <Badge variant="outline">Free</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{recommendedProblem.context}</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <Button size="lg" onClick={handleStartSolving} disabled={isSaving || !recommendedProblem} className="gap-2 h-12 text-base font-semibold">
                                        {isSaving ? 'Starting…' : `Start solving ${recommendedProblem?.title ?? ''}`} <ArrowRight className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center justify-between">
                                        <Button variant="ghost" onClick={handleExplore} disabled={isSaving} className="text-muted-foreground">
                                            Explore problems on my own
                                        </Button>
                                        <Button variant="ghost" onClick={() => setStep('prefs')} disabled={isSaving} className="gap-2 text-muted-foreground">
                                            <SlidersHorizontal className="w-4 h-4" /> Fine-tune recommendations
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'prefs' && (
                            <motion.div
                                key="prefs"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Fine-tune your recommendations</DialogTitle>
                                    <DialogDescription className="text-lg">All optional — pick what applies and we&apos;ll tailor your dashboard.</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Target companies</p>
                                        <div className="flex flex-wrap gap-2">
                                            {COMPANIES.map(company => (
                                                <div
                                                    key={company}
                                                    onClick={() => toggleSelection(company, selectedCompanies, setSelectedCompanies)}
                                                    className={`
                                                cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-sm
                                                ${selectedCompanies.includes(company)
                                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                            : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                            `}
                                                >
                                                    {company}
                                                    {selectedCompanies.includes(company) && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comfortable difficulty</p>
                                        <div className="flex flex-wrap gap-2">
                                            {DIFFICULTIES.map(diff => (
                                                <div
                                                    key={diff}
                                                    onClick={() => toggleSelection(diff, selectedDifficulty, setSelectedDifficulty)}
                                                    className={`
                                                cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-sm
                                                ${selectedDifficulty.includes(diff)
                                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                            : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                            `}
                                                >
                                                    {diff}
                                                    {selectedDifficulty.includes(diff) && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Focus areas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {FOCUS_AREAS.map(area => (
                                                <div
                                                    key={area}
                                                    onClick={() => toggleSelection(area, selectedFocus, setSelectedFocus)}
                                                    className={`
                                                cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-sm
                                                ${selectedFocus.includes(area)
                                                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                            : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                            `}
                                                >
                                                    {area}
                                                    {selectedFocus.includes(area) && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => setStep('ready')} disabled={isSaving}>Back</Button>
                                    <Button onClick={handleFinishPrefs} disabled={isSaving} className="min-w-[120px]">
                                        {isSaving ? 'Saving…' : 'Save preferences'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
