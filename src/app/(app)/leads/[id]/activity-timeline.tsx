'use client';

import type { InteractionLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, PenSquare, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { users } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';

const iconMap: { [key: string]: React.ReactNode } = {
    Email: <Mail className="h-5 w-5" />,
    Call: <Phone className="h-5 w-5" />,
    Meeting: <Calendar className="h-5 w-5" />,
    Note: <PenSquare className="h-5 w-5" />,
};

const getAgentAvatar = (agentName: string) => {
    const user = users.find(u => u.name === agentName);
    return user ? user.avatar : `https://picsum.photos/seed/${agentName.replace(/\s+/g, '-')}/100/100`;
}
const getAgentFallback = (agentName: string) => {
    if (agentName === 'System') return 'S';
    return agentName.split(' ').map(n => n[0]).join('');
}


export function ActivityTimeline({ logs }: { logs: InteractionLog[] }) {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>A log of all interactions with this lead.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mb-6">
                    <Textarea placeholder="Add a note, log an email, or schedule a meeting..." />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline"> <Plus className="mr-2"/> Log Activity</Button>
                        <Button> <Send className="mr-2"/> Send Email</Button>
                    </div>
                </div>

                <div className="space-y-8 relative">
                    <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2" />
                    {sortedLogs.map((log) => {
                        const agent = log.agent || 'System';
                        return (
                            <div key={log.id} className="flex gap-4 items-start relative">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border z-10">
                                    {iconMap[log.type]}
                                </span>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{log.type}</p>
                                        <time className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{log.notes}</p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={getAgentAvatar(agent)} />
                                            <AvatarFallback>{getAgentFallback(agent)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">{agent}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {logs.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 border-t mt-6">
                        No activities logged yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
