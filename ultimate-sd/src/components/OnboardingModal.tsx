'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { saveUserPreferences } from '@/app/actions/progress';
import { toast } from 'sonner';
import { Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Netflix', 'Uber', 'Microsoft', 'Apple', 'Spotify', 'Twitter/X'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const FOCUS_AREAS = ['System Design', 'API Design', 'Database', 'Microservices', 'Scalability'];

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function OnboardingModal({ isOpen, onClose, userId }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            const result = await saveUserPreferences(selectedCompanies, selectedDifficulty, selectedFocus);
            if (result.success) {
                toast.success('Preferences saved!', { description: 'Your specialized roadmap is ready.' });
                onClose();
            } else {
                toast.error('Failed to save preferences.');
            }
        } catch (error) {
            toast.error('Something went wrong.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-card">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Dream Companies</DialogTitle>
                                    <DialogDescription className="text-lg">Select the companies you are targeting.</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-wrap gap-3">
                                    {COMPANIES.map(company => (
                                        <div
                                            key={company}
                                            onClick={() => toggleSelection(company, selectedCompanies, setSelectedCompanies)}
                                            className={`
                                        cursor-pointer px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2
                                        ${selectedCompanies.includes(company)
                                                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm transform scale-105'
                                                    : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                    `}
                                        >
                                            {company}
                                            {selectedCompanies.includes(company) && <Check className="w-4 h-4" />}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Experience Level</DialogTitle>
                                    <DialogDescription className="text-lg">What difficulty levels are you comfortable with?</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-3">
                                    {DIFFICULTIES.map(diff => (
                                        <div
                                            key={diff}
                                            onClick={() => toggleSelection(diff, selectedDifficulty, setSelectedDifficulty)}
                                            className={`
                                        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between
                                        ${selectedDifficulty.includes(diff)
                                                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                                                    : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                    `}
                                        >
                                            <span className="text-lg">{diff}</span>
                                            {selectedDifficulty.includes(diff) && <Check className="w-5 h-5" />}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Focus Areas</DialogTitle>
                                    <DialogDescription className="text-lg">Any specific topics you want to master?</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-wrap gap-3">
                                    {FOCUS_AREAS.map(area => (
                                        <div
                                            key={area}
                                            onClick={() => toggleSelection(area, selectedFocus, setSelectedFocus)}
                                            className={`
                                        cursor-pointer px-4 py-3 rounded-xl border-2 transition-all duration-200
                                        ${selectedFocus.includes(area)
                                                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                                                    : 'border-muted hover:border-primary/50 text-muted-foreground hover:bg-muted/50'}
                                    `}
                                        >
                                            {area}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 pt-0 flex justify-between items-center">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button onClick={() => setStep(step + 1)} className="gap-2">
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleFinish} disabled={isSaving} className="gap-2 min-w-[120px]">
                            {isSaving ? 'Building Roadmap...' : 'Finish'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
