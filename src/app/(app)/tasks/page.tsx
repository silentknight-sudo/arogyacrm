'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus, UserProfile } from '@/types';
import { PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query, where } from 'firebase/firestore';
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
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-all hover:shadow-lg rounded-2xl border-primary/5">
            <CardContent className="p-4">
                <p className="font-bold text-foreground">{task.title}</p>
                 <div className="mt-3 flex items-center justify-between">
                     <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate), 'MMM dd')}
                     </span>
                     <Badge variant="outline" className="text-[10px] uppercase tracking-tighter py-0">{task.priority}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}

const TaskColumn = ({ status, tasks, isLoading }: { status: TaskStatus; tasks: Task[], isLoading: boolean }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-2xl bg-muted/30 p-2">
        <div className="p-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]} shadow-lg`} />
            <h2 className="font-bold text-primary tracking-tight">{status}</h2>
            <Badge variant="secondary" className="rounded-full bg-white/50 text-[10px]">{isLoading ? '...' : tasks.length}</Badge>
          </div>
        </div>
        <div className="flex-1 p-2 pt-0 overflow-y-auto scrollbar-hide">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
            )}
            {!isLoading && tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
             {!isLoading && tasks.length === 0 && (
                <div className="text-center text-muted-foreground text-xs font-medium pt-12 opacity-50">Nothing here yet.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function TasksPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'tasks'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const usersQuery = useMemoFirebase(() => {
    return (!isUserLoading && currentUser && currentTeamspace?.id)
        ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) 
        : null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingTasks || isLoadingUsers;

  return (
     <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Action Items</h1>
                <p className="text-muted-foreground font-medium">
                    Organize your work and track your progress.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateTaskDialog users={users || []} isLoading={isLoading}>
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Task
                    </Button>
                </CreateTaskDialog>
            </div>
        </div>
        <div className="flex-1 rounded-[2.5rem] border bg-card/50 backdrop-blur-sm shadow-inner overflow-hidden">
             <div className="flex space-x-6 p-6 overflow-x-auto h-[calc(100vh-220px)] scrollbar-hide">
                {statuses.map(status => {
                const tasksInStatus = tasks ? tasks.filter(task => task.status === status) : [];
                return <TaskColumn key={status} status={status} tasks={tasksInStatus} isLoading={isLoading} />;
                })}
            </div>
        </div>
    </div>
  );
}