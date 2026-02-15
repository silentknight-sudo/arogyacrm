import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import KanbanBoard from './kanban-board';

export default function DealsPage() {
  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
                <p className="text-muted-foreground">
                    Visualize and manage your deals through the sales process.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Deal
                </Button>
            </div>
        </div>
        <div className="flex-1 rounded-lg border bg-card shadow-sm">
            <KanbanBoard />
        </div>
    </div>
  );
}
