import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Box, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type TaskStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed';

interface Task {
    id: string;
    name: string;
    dependencies: string[];
    duration: number; // in ms
    status: TaskStatus;
    workerId?: number;
}

interface Worker {
    id: number;
    busy: boolean;
    taskId?: string;
}

const INITIAL_TASKS: Task[] = [
    { id: '1', name: 'Extract Data', dependencies: [], duration: 2000, status: 'ready' },
    { id: '2', name: 'Transform A', dependencies: ['1'], duration: 1500, status: 'pending' },
    { id: '3', name: 'Transform B', dependencies: ['1'], duration: 1500, status: 'pending' },
    { id: '4', name: 'Load Warehouse', dependencies: ['2', '3'], duration: 1000, status: 'pending' },
    { id: '5', name: 'Email Report', dependencies: ['4'], duration: 1000, status: 'pending' },
];

const INITIAL_WORKERS: Worker[] = [
    { id: 1, busy: false },
    { id: 2, busy: false },
    { id: 3, busy: false },
];

const JobSchedulerViz: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());



    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    // Helper to add log
    const addLog = useCallback((message: string) => {
        setLogs(prev => [`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`, ...prev].slice(0, 5));
    }, []);

    // Check dependencies and update status
    useEffect(() => {
        if (!isRunning) return;

        setTasks(currentTasks => {
            const newTasks = [...currentTasks];
            let changed = false;

            newTasks.forEach(task => {
                if (task.status === 'pending') {
                    const parents = newTasks.filter(t => task.dependencies.includes(t.id));
                    const allParentsDone = parents.every(p => p.status === 'completed');
                    if (allParentsDone) {
                        task.status = 'ready';
                        changed = true;
                    }
                }
            });

            return changed ? newTasks : currentTasks;
        });
    }, [tasks, isRunning]);

    // Scheduler Loop
    useEffect(() => {
        if (!isRunning) return;

                const interval = setInterval(() => {
            // Find idle workers
            const idleWorkers = workers.filter(w => !w.busy);
            if (idleWorkers.length === 0) return;

            // Find ready tasks
            const readyTasks = tasks.filter(t => t.status === 'ready');
            if (readyTasks.length === 0) {
                if (tasks.every(t => t.status === 'completed')) {
                    setIsRunning(false);
                    addLog('All jobs completed successfully.');
                }
                return;
            }

            // Assign tasks to workers
            const assignments: { workerId: number, taskId: string }[] = [];
            const tasksToUpdate = [...tasks];
            const workersToUpdate = [...workers];

            for (let i = 0; i < Math.min(idleWorkers.length, readyTasks.length); i++) {
                const worker = idleWorkers[i];
                const task = readyTasks[i];

                // Update Task
                const taskIndex = tasksToUpdate.findIndex(t => t.id === task.id);
                tasksToUpdate[taskIndex] = { ...task, status: 'running', workerId: worker.id };

                // Update Worker
                const workerIndex = workersToUpdate.findIndex(w => w.id === worker.id);
                workersToUpdate[workerIndex] = { ...worker, busy: true, taskId: task.id };

                assignments.push({ workerId: worker.id, taskId: task.id });
                addLog(`Worker ${worker.id} started task: ${task.name}`);
            }

            if (assignments.length > 0) {
                setTasks(tasksToUpdate);
                setWorkers(workersToUpdate);

                // Schedule completion
                assignments.forEach(({ workerId, taskId }) => {
                    const task = tasks.find(t => t.id === taskId);
                    const timeoutId = setTimeout(() => {
                        completeTask(taskId, workerId);
                        timeoutIds.current.delete(timeoutId);
                    }, task?.duration || 1000);
                    timeoutIds.current.add(timeoutId);
                });
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, workers, tasks, addLog]);

    const completeTask = useCallback((taskId: string, workerId: number) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', workerId: undefined } : t));
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, busy: false, taskId: undefined } : w));
        addLog(`Task completed: ${INITIAL_TASKS.find(t => t.id === taskId)?.name}`);
    }, [addLog]);

    const reset = () => {
        setTasks(INITIAL_TASKS.map(t => ({ ...t }))); // Deep copy to reset status
        setWorkers(INITIAL_WORKERS.map(w => ({ ...w, busy: false, taskId: undefined })));
        setLogs([]);
        setIsRunning(false);
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse';
            case 'ready': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-slate-800 text-slate-500 border-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-400" />
                        Distributed Scheduler
                    </CardTitle>
                    <CardDescription>
                        Visualize how tasks with dependencies are scheduled across a worker pool.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button
                            onClick={() => setIsRunning(true)}
                            disabled={isRunning || tasks.every(t => t.status === 'completed')}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Play className="w-4 h-4 mr-2" /> Start Job
                        </Button>
                        <Button
                            variant="outline"
                            onClick={reset}
                            className="border-slate-700 hover:bg-slate-800"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Task DAG */}
                <div className="col-span-2 space-y-4">
                    <h3 className="text-sm font-medium text-slate-400">Dependency Graph (DAG)</h3>
                    <div className="relative p-6 bg-slate-950 rounded-lg border border-slate-800 min-h-[300px] flex items-center justify-center">
                        {/* Visualizing DAG nodes roughly positioned */}
                        <div className="grid grid-cols-3 gap-8">
                            {/* Level 1 */}
                            <div className="col-span-1 flex items-center justify-center">
                                <TaskCard task={tasks.find(t => t.id === '1')!} getStatusColor={getStatusColor} />
                            </div>
                            {/* Level 2 */}
                            <div className="col-span-1 flex flex-col gap-8 justify-center">
                                <TaskCard task={tasks.find(t => t.id === '2')!} getStatusColor={getStatusColor} />
                                <TaskCard task={tasks.find(t => t.id === '3')!} getStatusColor={getStatusColor} />
                            </div>
                            {/* Level 3 */}
                            <div className="col-span-1 flex flex-col gap-8 justify-center">
                                <TaskCard task={tasks.find(t => t.id === '4')!} getStatusColor={getStatusColor} />
                                <TaskCard task={tasks.find(t => t.id === '5')!} getStatusColor={getStatusColor} />
                            </div>
                        </div>

                        {/* Arrows (Simplified visualization using absolute positioning usually, but grid is safer for responsive) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" style={{ zIndex: 0 }}>
                            {/* Just decorative lines if needed, or rely on grid layout structure implied */}
                        </svg>
                    </div>
                </div>

                {/* Worker Pool */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400">Worker Pool</h3>
                    <div className="space-y-3">
                        {workers.map(worker => (
                            <div key={worker.id} className={`p-4 rounded-lg border transition-all ${worker.busy ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-300">Worker {worker.id}</span>
                                    <Badge variant="outline" className={worker.busy ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-400'}>
                                        {worker.busy ? 'Busy' : 'Idle'}
                                    </Badge>
                                </div>
                                {worker.busy && (
                                    <div className="text-xs text-indigo-400 flex items-center gap-1">
                                        <Box className="w-3 h-3" />
                                        Running: {tasks.find(t => t.id === worker.taskId)?.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Logs */}
                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 h-[200px] overflow-hidden">
                        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">System Logs</h4>
                        <div className="space-y-1 font-mono text-xs">
                            <AnimatePresence>
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-slate-400"
                                    >
                                        {log}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task, getStatusColor }: { task: Task, getStatusColor: (s: TaskStatus) => string }) => (
    <motion.div
        layout
        className={`w-32 p-3 rounded-lg border text-center z-10 shadow-lg ${getStatusColor(task.status)}`}
    >
        <div className="text-xs font-semibold truncate">{task.name}</div>
        <div className="text-[10px] mt-1 opacity-80 uppercase tracking-tighter">{task.status}</div>
        {task.status === 'running' && task.workerId && (
            <Badge variant="secondary" className="mt-1 h-4 text-[9px] px-1 bg-black/30">W-{task.workerId}</Badge>
        )}
    </motion.div>
);

export default JobSchedulerViz;
