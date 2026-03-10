
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus, UserProfile } from '@/types';
import { PlusCircle, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTaskDialog } from './create-task-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const statuses: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

const statusColors: Record<TaskStatus, string> = {
  Todo: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Done: 'bg-green-500',
};

const TaskCard = ({ task, allUsers }: { task: Task, allUsers: UserProfile[] }) => {
    const assignees = (task.assignedToIds || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as UserProfile[];

    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-all hover:shadow-2xl rounded-2xl border-primary/5 group cursor-pointer active:scale-95">
            <CardContent className="p-5">
                <p className="font-black text-foreground group-hover:text-primary transition-colors leading-tight">{task.title}</p>
                
                <div className="mt-4 flex items-center justify-between">
                     <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-black uppercase tracking-widest">
                        <Calendar className="h-3 w-3 text-primary/40" />
                        {format(new Date(task.dueDate), 'MMM dd')}
                     </span>
                     <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-primary/10 px-2 py-0">{task.priority}</Badge>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-primary/5 pt-3">
                    <div className="flex -space-x-2">
                        {assignees.slice(0, 3).map((user) => (
                            <Tooltip key={user.id}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-primary/5">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-[8px] font-black">{user.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px] font-bold">{user.displayName}</TooltipContent>
                            </Tooltip>
                        ))}
                        {assignees.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-black">
                                +{assignees.length - 3}
                            </div>
                        )}
                    </div>
                    {assignees.length === 0 && <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Unassigned</span>}
                </div>
            </CardContent>
        </Card>
    )
}

const TaskColumn = ({ status, tasks, isLoading, allUsers }: { status: TaskStatus; tasks: Task[], isLoading: boolean, allUsers: UserProfile[] }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-[2.5rem] bg-muted/20 p-2 shadow-inner border border-primary/5">
        <div className="p-5 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[status]} shadow-lg animate-pulse`} />
            <h2 className="font-black text-primary tracking-tighter uppercase text-sm">{status}</h2>
            <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-black border-none shadow-sm">{isLoading ? '...' : tasks.length}</Badge>
          </div>
        </div>
        <div className="flex-1 p-3 pt-0 overflow-y-auto scrollbar-hide">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-[2rem]" />
                    <Skeleton className="h-24 w-full rounded-[2rem]" />
                </div>
            )}
            {!isLoading && tasks.map(task => (
                <TaskCard key={task.id} task={task} allUsers={allUsers} />
            ))}
             {!isLoading && tasks.length === 0 && (
                <div className="text-center text-muted-foreground text-[10px] font-black pt-16 opacity-30 uppercase tracking-[0.3em]">No Action Items</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function TasksPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  // TASK QUERY: Hierarchy Isolation
  const tasksQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    const tasksRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'tasks');
    
    // Admins see all tasks in the teamspace
    if (currentUser.role === 'admin') return query(tasksRef);
    
    // Team Leads and Executives see tasks where they are assigned
    return query(tasksRef, where('assignedToIds', 'array-contains', currentUser.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);
  
  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    if (currentUser.role === 'admin') {
        return query(
          collection(firestore, 'users'), 
          where('teamspaceIds', 'array-contains', currentTeamspace.id)
        );
    }
    
    if (currentUser.role === 'sales_team_lead') {
        return query(
          collection(firestore, 'users'), 
          where('createdBy', '==', currentUser.id)
        );
    }
    
    return null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingTasks || isLoadingUsers;

  return (
     <div className="flex flex-col h-full gap-8 pb-8 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8 px-2">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Users className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Operational Flow</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Task Center</h1>
                <p className="text-2xl text-muted-foreground font-semibold">
                    Coordinate wellness initiatives and manage team deliverables.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateTaskDialog users={users || []} isLoading={isLoading}>
                    <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                        <PlusCircle className="mr-3 h-6 w-6" />
                        New Action
                    </Button>
                </CreateTaskDialog>
            </div>
        </div>
        <div className="flex-1 rounded-[3rem] border-4 border-white shadow-[0_30px_100px_rgba(0,0,0,0.08)] bg-card/40 backdrop-blur-2xl overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-accent/[0.02] pointer-events-none" />
             <div className="flex space-x-8 p-8 overflow-x-auto h-[calc(100vh-240px)] scrollbar-hide">
                {statuses.map(status => {
                const tasksInStatus = tasks ? tasks.filter(task => task.status === status) : [];
                return <TaskColumn key={status} status={status} tasks={tasksInStatus} isLoading={isLoading} allUsers={users || []} />;
                })}
            </div>
        </div>
    </div>
  );
}
