'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SystemDesignProblem } from '@/types';
import { tokens } from '@/styles/tokens';
import { 
  Sparkles, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  SkipForward,
  Loader2,
  ArrowLeft,
  Eye
} from 'lucide-react';

interface StepData {
  phase: string;
  subStep: string;
  title: string;
  prompt: string;
  inputType: 'list' | 'textarea';
  placeholder?: string;
}

// Define all steps for each phase
const PHASE_STEPS: { [key: string]: StepData[] } = {
  requirements: [
    {
      phase: 'Requirements',
      subStep: 'functional',
      title: 'Functional Requirements',
      prompt: 'What are the core features your system must provide? List the key functionalities users will interact with.',
      inputType: 'list',
      placeholder: 'e.g., User can post tweets'
    },
    {
      phase: 'Requirements',
      subStep: 'non-functional',
      title: 'Non-Functional Requirements',
      prompt: 'What are the quality attributes? Consider scalability, availability, latency, consistency, etc.',
      inputType: 'list',
      placeholder: 'e.g., System should handle 100M DAU'
    },
    {
      phase: 'Requirements',
      subStep: 'constraints',
      title: 'Constraints & Assumptions',
      prompt: 'What are the constraints and assumptions? Consider traffic estimates, data size, limitations.',
      inputType: 'list',
      placeholder: 'e.g., Average tweet size is 280 characters'
    }
  ],
  hld: [
    {
      phase: 'HLD',
      subStep: 'api',
      title: 'API Design',
      prompt: 'Define the key APIs/endpoints your system will expose. What operations will clients perform?',
      inputType: 'list',
      placeholder: 'e.g., POST /api/v1/tweets - Create a new tweet'
    },
    {
      phase: 'HLD',
      subStep: 'data-model',
      title: 'Data Model',
      prompt: 'What are your main entities and their relationships? Describe your database schema.',
      inputType: 'textarea',
      placeholder: 'Describe your entities, tables, and relationships...'
    },
    {
      phase: 'HLD',
      subStep: 'architecture',
      title: 'High-Level Architecture',
      prompt: 'Describe your system architecture. What are the major components and how do they interact?',
      inputType: 'textarea',
      placeholder: 'Describe load balancers, app servers, databases, caches, etc...'
    }
  ],
  lld: [
    {
      phase: 'LLD',
      subStep: 'components',
      title: 'Component Deep-Dive',
      prompt: 'Detail the internal design of critical components. How do they work internally?',
      inputType: 'textarea',
      placeholder: 'Explain algorithms, data structures, internal workflows...'
    },
    {
      phase: 'LLD',
      subStep: 'data-flow',
      title: 'Data Flow',
      prompt: 'Trace a typical request through your system. What happens at each step?',
      inputType: 'textarea',
      placeholder: 'Walk through a complete flow from user action to response...'
    }
  ],
  tradeoffs: [
    {
      phase: 'Trade-offs',
      subStep: 'decisions',
      title: 'Key Decisions & Trade-offs',
      prompt: 'What major technical decisions did you make? What were the alternatives and why did you choose this approach?',
      inputType: 'list',
      placeholder: 'e.g., Chose NoSQL over SQL for horizontal scalability'
    },
    {
      phase: 'Trade-offs',
      subStep: 'bottlenecks',
      title: 'Bottlenecks & Solutions',
      prompt: 'What are potential bottlenecks in your design? How would you address them?',
      inputType: 'list',
      placeholder: 'e.g., Database writes - use write-through cache'
    }
  ],
  scalability: [
    {
      phase: 'Scalability',
      subStep: 'scaling',
      title: 'Scaling Strategy',
      prompt: 'How will your system scale to millions of users? Describe horizontal/vertical scaling approaches.',
      inputType: 'textarea',
      placeholder: 'Explain sharding, replication, load balancing strategies...'
    },
    {
      phase: 'Scalability',
      subStep: 'monitoring',
      title: 'Monitoring & Reliability',
      prompt: 'How will you monitor and ensure reliability? What metrics matter?',
      inputType: 'list',
      placeholder: 'e.g., Monitor API latency, error rates, database load'
    }
  ]
};

interface FeedbackResult {
  score: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  missed: string[];
  isAcceptable: boolean;
}

interface SavedStepData {
  listItems: string[];
  textInput: string;
  feedback: FeedbackResult | null;
  completed: boolean;
}

interface Props {
  problem: SystemDesignProblem;
}

export default function StepByStepChat({ problem }: Props) {
  const [currentPhase, setCurrentPhase] = useState('requirements');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [listItems, setListItems] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  // Store all step data
  const [savedStepData, setSavedStepData] = useState<Map<string, SavedStepData>>(new Map());

  const phases = Object.keys(PHASE_STEPS);
  const currentSteps = PHASE_STEPS[currentPhase];
  const currentStep = currentSteps[currentStepIndex];

  // Get step key for storage
  const getStepKey = (phase: string, stepIdx: number) => `${phase}-${stepIdx}`;
  const currentStepKey = getStepKey(currentPhase, currentStepIndex);

  // Load saved data when step changes
  useEffect(() => {
    const saved = savedStepData.get(currentStepKey);
    if (saved) {
      setListItems(saved.listItems);
      setTextInput(saved.textInput);
      setFeedback(saved.feedback);
      setShowFeedback(saved.feedback !== null);
    } else {
      setListItems([]);
      setTextInput('');
      setFeedback(null);
      setShowFeedback(false);
    }
    setNewItemInput('');
  }, [currentStepKey, savedStepData]);

  // Dispatch phase change events
  useEffect(() => {
    const evt = new CustomEvent('sd-phase-change', { 
      detail: { phase: currentStep.phase } 
    });
    window.dispatchEvent(evt);
  }, [currentStep.phase]);

  const addListItem = () => {
    if (newItemInput.trim()) {
      setListItems([...listItems, newItemInput.trim()]);
      setNewItemInput('');
    }
  };

  const removeListItem = (index: number) => {
    setListItems(listItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const userAnswer = currentStep.inputType === 'list' 
      ? listItems.join('\n') 
      : textInput;

    if (!userAnswer.trim()) return;

    setLoading(true);
    setShowFeedback(false);

    try {
      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.slug,
          phase: currentStep.phase,
          subStep: currentStep.subStep,
          userAnswer,
          problemDetails: problem
        })
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setShowFeedback(true);

      // Save step data
      const newSavedData = new Map(savedStepData);
      newSavedData.set(currentStepKey, {
        listItems: [...listItems],
        textInput,
        feedback: data.feedback,
        completed: data.feedback.isAcceptable
      });
      setSavedStepData(newSavedData);

      if (data.feedback.isAcceptable) {
        setCompletedSteps(prev => new Set(prev).add(currentStepKey));
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setFeedback({
        score: 0,
        accuracy: 0,
        strengths: [],
        weaknesses: ['Error connecting to AI. Please try again.'],
        missed: [],
        isAcceptable: false
      });
      setShowFeedback(true);
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Move to next phase
      const currentPhaseIndex = phases.indexOf(currentPhase);
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhase(phases[currentPhaseIndex + 1]);
        setCurrentStepIndex(0);
      } else {
        // All done
        alert('🎉 Congratulations! You have completed all sections!');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Move to previous phase
      const currentPhaseIndex = phases.indexOf(currentPhase);
      if (currentPhaseIndex > 0) {
        const prevPhase = phases[currentPhaseIndex - 1];
        setCurrentPhase(prevPhase);
        setCurrentStepIndex(PHASE_STEPS[prevPhase].length - 1);
      }
    }
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip this step?')) {
      // Save as skipped
      const newSavedData = new Map(savedStepData);
      newSavedData.set(currentStepKey, {
        listItems: [],
        textInput: '',
        feedback: null,
        completed: false
      });
      setSavedStepData(newSavedData);
      handleNext();
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setFeedback(null);
  };

  const getPhaseColor = (phase: string) => {
    const phaseKey = phase.toLowerCase().replace('-', '').replace(' ', '') as keyof typeof tokens.colors.phase;
    return tokens.colors.phase[phaseKey] || tokens.colors.info;
  };

  const progress = ((currentStepIndex + 1) / currentSteps.length) * 100;
  const isFirstStep = currentPhase === 'requirements' && currentStepIndex === 0;
  const canGoBack = !isFirstStep;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {phases.map((phase, phaseIdx) => {
          const phaseSteps = PHASE_STEPS[phase];
          const isCurrentPhase = phase === currentPhase;
          const phaseIndex = phases.indexOf(phase);
          const currentPhaseIdx = phases.indexOf(currentPhase);
          
          return (
            <div key={phase} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isCurrentPhase ? 'text-primary' : phaseIndex < currentPhaseIdx ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {phase.charAt(0).toUpperCase() + phase.slice(1).replace('-', ' ')}
                </span>
                {isCurrentPhase && (
                  <Badge variant="secondary" className="text-xs">
                    {currentStepIndex + 1}/{phaseSteps.length}
                  </Badge>
                )}
              </div>
              {phaseIdx < phases.length - 1 && (
                <ArrowRight className="h-3 w-3" />
              )}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <Card className="glass border-2 border-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentStep.phase}</h2>
                <p className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {currentSteps.length}
                </p>
              </div>
            </div>
            <Badge
              style={{ backgroundColor: getPhaseColor(currentStep.phase), color: 'white' }}
              className="text-sm font-semibold shadow-sm"
            >
              {currentStep.title}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: getPhaseColor(currentStep.phase)
              }}
            />
          </div>
        </div>
      </Card>

      {/* Step Content */}
      <Card className="glass border-2 border-border">
        <div className="p-6 space-y-6">
          {/* Question/Prompt */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {currentStep.prompt}
            </p>
          </div>

          {/* Input Area */}
          {!showFeedback && (
            <div className="space-y-4">
              {currentStep.inputType === 'list' ? (
                <div className="space-y-3">
                  {/* List items */}
                  {listItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border group hover:border-primary/50 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <p className="flex-1 text-sm">{item}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeListItem(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add new item */}
                  <div className="flex gap-2">
                    <Input
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addListItem();
                        }
                      }}
                      placeholder={currentStep.placeholder}
                      className="flex-1"
                    />
                    <Button
                      onClick={addListItem}
                      disabled={!newItemInput.trim()}
                      variant="outline"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {listItems.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Add at least one item to continue
                    </p>
                  )}
                </div>
              ) : (
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={currentStep.placeholder}
                  className="min-h-[200px] resize-none"
                />
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                  {canGoBack && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || (currentStep.inputType === 'list' ? listItems.length === 0 : !textInput.trim())}
                  className="gradient-bg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      Submit for Review
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback Display */}
          {showFeedback && feedback && (
            <div className="space-y-4 animate-fade-in">
              {/* Accuracy Score */}
              <div className="p-4 rounded-lg border-2" style={{
                borderColor: feedback.isAcceptable ? '#22c55e' : '#ef4444',
                backgroundColor: feedback.isAcceptable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {feedback.isAcceptable ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <h4 className="font-semibold text-lg">
                      {feedback.isAcceptable ? 'Great Work!' : 'Needs Improvement'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{feedback.score}/10</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                {/* Accuracy bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Accuracy</span>
                    <span className="font-semibold">{feedback.accuracy}%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${feedback.accuracy}%`,
                        backgroundColor: feedback.accuracy >= 70 ? '#22c55e' : feedback.accuracy >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    What You Did Well
                  </h5>
                  <ul className="space-y-1 text-sm">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-green-600 dark:text-green-500">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {feedback.weaknesses.length > 0 && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                    Areas to Improve
                  </h5>
                  <ul className="space-y-1 text-sm">
                    {feedback.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-orange-600 dark:text-orange-500">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missed points */}
              {feedback.missed.length > 0 && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Sparkles className="h-4 w-4" />
                    Key Points You Missed
                  </h5>
                  <ul className="space-y-1 text-sm">
                    {feedback.missed.map((miss, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-blue-600 dark:text-blue-500">•</span>
                        <span>{miss}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                  {canGoBack && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  {!feedback.isAcceptable && (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
                
                <Button
                  onClick={handleNext}
                  className="gradient-bg"
                  disabled={!feedback.isAcceptable}
                >
                  {feedback.isAcceptable ? (
                    <>
                      Continue to Next Step
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>Must pass to continue</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Step History - Show completed/visited steps */}
      {savedStepData.size > 0 && (
        <Card className="glass border border-border/50">
          <div className="p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Your Progress History
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.from(savedStepData.entries()).map(([key, data]) => {
                const [phase, stepIdx] = key.split('-');
                const stepIndex = parseInt(stepIdx);
                const step = PHASE_STEPS[phase][stepIndex];
                const isCurrent = key === currentStepKey;
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const [targetPhase, targetIdx] = key.split('-');
                      setCurrentPhase(targetPhase);
                      setCurrentStepIndex(parseInt(targetIdx));
                    }}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      isCurrent
                        ? 'border-primary bg-primary/10'
                        : data.completed
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {phase.replace('-', ' ').toUpperCase()}
                      </span>
                      {data.completed && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">{step.title}</div>
                    {data.feedback && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Score: {data.feedback.score}/10 • {data.feedback.accuracy}%
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Mini progress indicator */}
      <div className="flex justify-center gap-2">
        {currentSteps.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentStepIndex
                ? 'w-8'
                : 'w-2'
            }`}
            style={{
              backgroundColor: index <= currentStepIndex
                ? getPhaseColor(currentStep.phase)
                : '#e5e7eb'
            }}
          />
        ))}
      </div>
    </div>
  );
}
