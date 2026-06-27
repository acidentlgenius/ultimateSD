import { Search, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProblemTag } from '@/lib/problem-tags';

type StatusFilter =
    | 'All'
    | 'Not Started'
    | 'Attempted'
    | 'In Progress'
    | 'Completed'
    | 'Review Due';

const STATUS_OPTIONS: StatusFilter[] = [
    'All',
    'Not Started',
    'Attempted',
    'In Progress',
    'Completed',
    'Review Due',
];

interface ProblemFilterBarProps {
    search: string;
    setSearch: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    difficulty: string;
    setDifficulty: (value: string) => void;
    statusFilter?: StatusFilter;
    setStatusFilter?: (value: StatusFilter) => void;
    showStatusFilter?: boolean;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    categories: string[];
    difficulties: string[];
    topicFilter?: string;
    setTopicFilter?: (value: string) => void;
    topicOptions?: ProblemTag[];
    user?: unknown;
}

export function ProblemFilterBar({
    search,
    setSearch,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    statusFilter = 'All',
    setStatusFilter,
    showStatusFilter = false,
    viewMode,
    setViewMode,
    categories,
    difficulties,
    topicFilter = 'All',
    setTopicFilter,
    topicOptions = [],
    user
}: ProblemFilterBarProps) {
    return (
        <div className="sticky top-20 z-40 backdrop-blur-2xl bg-background/60 rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl shadow-primary/5 mb-12 max-w-5xl mx-auto transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 rounded-3xl opacity-50 pointer-events-none" />

            <div className="relative p-2 flex flex-col md:flex-row gap-2">
                {/* Search Field */}
                <div className="relative flex-1 group/search">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors duration-300">
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within/search:text-primary" />
                    </div>
                    <label htmlFor="problem-search" className="sr-only">Search problems</label>
                    <input
                        id="problem-search"
                        type="text"
                        placeholder="Search problems..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-2xl outline-none text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:bg-black/10 dark:bg-white/10 focus:shadow-glow-sm"
                        autoFocus={!!user}
                    />
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar touch-pan-x">

                    {/* Category Dropdown */}
                    <div className="relative min-w-[140px] md:w-auto md:min-w-[160px]">
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            aria-label="Filter by Category"
                            className="w-full h-12 pl-4 pr-10 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-sidebar-border rounded-2xl outline-none cursor-pointer text-sm font-medium appearance-none transition-all hover:bg-black/10 dark:bg-white/10 focus:ring-2 focus:ring-primary/20 text-muted-foreground focus:text-foreground"
                        >
                            {categories.map(cat => <option key={cat} value={cat} className="bg-popover text-popover-foreground">{cat}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Difficulty Dropdown */}
                    <div className="relative min-w-[120px] md:w-auto md:min-w-[140px]">
                        <select
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            aria-label="Filter by Difficulty"
                            className="w-full h-12 pl-4 pr-10 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-sidebar-border rounded-2xl outline-none cursor-pointer text-sm font-medium appearance-none transition-all hover:bg-black/10 dark:bg-white/10 focus:ring-2 focus:ring-primary/20 text-muted-foreground focus:text-foreground"
                        >
                            {difficulties.map(diff => <option key={diff} value={diff} className="bg-popover text-popover-foreground">{diff}</option>)}
                        </select>
                        <div className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full pointer-events-none transition-colors",
                            difficulty === 'Easy' ? 'bg-green-500' :
                                difficulty === 'Medium' ? 'bg-amber-500' :
                                    difficulty === 'Hard' ? 'bg-red-500' : 'bg-muted-foreground/30'
                        )} />
                    </div>

                    {topicOptions.length > 0 && setTopicFilter && (
                        <div className="relative min-w-[140px] md:w-auto md:min-w-[160px]">
                            <select
                                value={topicFilter}
                                onChange={e => setTopicFilter(e.target.value)}
                                aria-label="Filter by Topic"
                                className="w-full h-12 pl-4 pr-10 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-sidebar-border rounded-2xl outline-none cursor-pointer text-sm font-medium appearance-none transition-all hover:bg-black/10 dark:bg-white/10 focus:ring-2 focus:ring-primary/20 text-muted-foreground focus:text-foreground"
                            >
                                <option value="All" className="bg-popover text-popover-foreground">All Topics</option>
                                {topicOptions.map((tag) => (
                                    <option key={tag.id} value={tag.id} className="bg-popover text-popover-foreground">
                                        {tag.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    )}

                    {showStatusFilter && setStatusFilter && (
                        <div className="relative min-w-[140px] md:w-auto md:min-w-[160px]">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                                aria-label="Filter by Status"
                                className="w-full h-12 pl-4 pr-10 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-sidebar-border rounded-2xl outline-none cursor-pointer text-sm font-medium appearance-none transition-all hover:bg-black/10 dark:bg-white/10 focus:ring-2 focus:ring-primary/20 text-muted-foreground focus:text-foreground"
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status} className="bg-popover text-popover-foreground">
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl h-12 items-center gap-1 shrink-0 border border-black/5 dark:border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "h-full px-3 rounded-xl transition-all duration-300",
                                viewMode === 'grid'
                                    ? "bg-background shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-black dark:hover:bg-white/5"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "h-full px-3 rounded-xl transition-all duration-300",
                                viewMode === 'list'
                                    ? "bg-background shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-black dark:hover:bg-white/5"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
