import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProblemFilterBarProps {
    search: string;
    setSearch: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    difficulty: string;
    setDifficulty: (value: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    categories: string[];
    difficulties: string[];
    user?: any;
}

export function ProblemFilterBar({
    search,
    setSearch,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    viewMode,
    setViewMode,
    categories,
    difficulties,
    user
}: ProblemFilterBarProps) {
    return (
        <div className="sticky top-20 z-40 backdrop-blur-xl bg-background/70 rounded-2xl border border-white/20 shadow-2xl shadow-primary/5 mb-12 max-w-5xl mx-auto transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
            <div className="p-3 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <label htmlFor="problem-search" className="sr-only">Search problems</label>
                    <input
                        id="problem-search"
                        type="text"
                        placeholder="Search problems (e.g., 'Uber', 'Chat', 'Cache')..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 rounded-xl hover:bg-white/5 transition-colors"
                        autoFocus={!!user}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    <div className="relative min-w-[140px] md:w-48">
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            aria-label="Filter by Category"
                            className="w-full h-12 px-4 bg-muted/40 border border-transparent hover:border-border/50 rounded-xl outline-none cursor-pointer hover:bg-muted/60 transition-colors appearance-none text-sm font-medium"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative min-w-[120px] md:w-40">
                        <select
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            aria-label="Filter by Difficulty"
                            className="w-full h-12 px-4 bg-muted/40 border border-transparent hover:border-border/50 rounded-xl outline-none cursor-pointer hover:bg-muted/60 transition-colors appearance-none text-sm font-medium"
                        >
                            {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary pointer-events-none" />
                    </div>

                    <div className="flex bg-muted/40 p-1.5 rounded-xl h-12 items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                            className={`h-9 px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                            className={`h-9 px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
