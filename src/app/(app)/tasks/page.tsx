
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus, UserProfile } from '@/types';
import { PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTaskDialog } from './create-task-dialog';


const statuses: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

const statusColors: Record<TaskStatus, string> = {
  Todo: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Done: 'bg-green-500',
};

const TaskCard = ({ task }: { task: Task }) => {
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <CardContent className="p-4">
                <p className="font-semibold">{task.title}</p>
                 <div className="mt-2 flex items-center justify-between">
                     <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate), 'MMM dd')}
                     </span>
                </div>
            </CardContent>
        </Card>
    )
}

const TaskColumn = ({ status, tasks, isLoading }: { status: TaskStatus; tasks: Task[], isLoading: boolean }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
            <h2 className="font-semibold">{status}</h2>
            <Badge variant="secondary">{isLoading ? '...' : tasks.length}</Badge>
          </div>
        </div>
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            )}
            {!isLoading && tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
             {!isLoading && tasks.length === 0 && (
                <div className="text-center text-muted-foreground text-sm pt-8">No tasks in this stage.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function TasksPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'tasks'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isLoadingTasks || isLoadingUsers;

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
                <CreateTaskDialog users={users || []} isLoading={isLoading}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Task
                    </Button>
                </CreateTaskDialog>
            </div>
        </div>
        <div className="flex-1 rounded-lg border bg-card shadow-sm">
             <div className="flex space-x-4 p-4 overflow-x-auto h-[calc(100vh-220px)]">
                {statuses.map(status => {
                const tasksInStatus = tasks ? tasks.filter(task => task.status === status) : [];
                return <TaskColumn key={status} status={status} tasks={tasksInStatus} isLoading={isLoading} />;
                })}
            </div>
        </div>
    </div>
  );
}
