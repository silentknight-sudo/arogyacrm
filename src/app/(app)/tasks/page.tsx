'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus } from '@/types';
import { tasks as initialTasks } from '@/lib/data';
import { users } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const statuses: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

const statusColors: Record<TaskStatus, string> = {
  Todo: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Done: 'bg-green-500',
};

const TaskCard = ({ task }: { task: Task }) => {
    const assignedUser = users.find(u => u.name === task.assignedTo);

    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <CardContent className="p-4">
                <p className="font-semibold">{task.title}</p>
                <div className="mt-4 flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                     </span>
                     {assignedUser && (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignedUser.avatar} />
                                        <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{assignedUser.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}

const TaskColumn = ({ status, tasks }: { status: TaskStatus; tasks: Task[] }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
            <h2 className="font-semibold">{status}</h2>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </div>
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default function TasksPage() {
  return (
     <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                <p className="text-muted-foreground">
                    Organize your work and track your progress.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Task
                </Button>
            </div>
        </div>
        <div className="flex-1 rounded-lg border bg-card shadow-sm">
             <div className="flex space-x-4 p-4 overflow-x-auto h-[calc(100vh-220px)]">
                {statuses.map(status => {
                const tasksInStatus = initialTasks.filter(task => task.status === status);
                return <TaskColumn key={status} status={status} tasks={tasksInStatus} />;
                })}
            </div>
        </div>
    </div>
  );
}
