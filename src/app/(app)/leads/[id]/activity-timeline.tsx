'use client';

import type { InteractionLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, PenSquare, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const iconMap: { [key: string]: React.ReactNode } = {
    Email: <Mail className="h-5 w-5" />,
    Call: <Phone className="h-5 w-5" />,
    Meeting: <Calendar className="h-5 w-5" />,
    Note: <PenSquare className="h-5 w-5" />,
};

const getAgentAvatar = (agentName: string) => {
    return `https://picsum.photos/seed/${agentName.replace(/\s+/g, '-')}/100/100`;
}
const getAgentFallback = (agentName: string) => {
    if (agentName === 'System') return 'S';
    return agentName.split(' ').map(n => n[0]).join('');
}


export function ActivityTimeline({ logs = [] }: { logs: InteractionLog[] }) {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card className="premium-card">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Activity Timeline</CardTitle>
                <CardDescription>A log of all interactions with this wellness prospect.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mb-8">
                    <Textarea className="rounded-2xl bg-muted/20 border-primary/5 focus-visible:ring-primary/20" placeholder="Add a note, log an email, or schedule a wellness strategy session..." />
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" className="rounded-xl font-bold"> <Plus className="mr-2 h-4 w-4"/> Log Activity</Button>
                        <Button className="rounded-xl herbal-gradient shadow-lg shadow-primary/20 font-bold"> <Send className="mr-2 h-4 w-4"/> Send Email</Button>
                    </div>
                </div>

                <div className="space-y-8 relative">
                     {sortedLogs.length > 0 && <div className="absolute left-5 top-2 bottom-2 w-px bg-primary/10 -translate-x-1/2" />}
                    {sortedLogs.map((log) => {
                        const agent = log.agent || 'System';
                        return (
                            <div key={log.id} className="flex gap-4 items-start relative group">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-primary/10 shadow-sm z-10 group-hover:scale-110 transition-transform text-primary">
                                    {iconMap[log.type] || <PenSquare className="h-5 w-5" />}
                                </span>
                                <div className="flex-1 space-y-1 bg-muted/10 p-4 rounded-2xl border border-primary/5">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-primary">{log.type}</p>
                                        <time className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{log.notes}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Avatar className="h-6 w-6 border-2 border-background">
                                            <AvatarImage src={getAgentAvatar(agent)} />
                                            <AvatarFallback className="text-[10px]">{getAgentFallback(agent)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-bold text-muted-foreground">{agent}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {logs.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 border-t border-dashed mt-6 italic">
                        No strategic activities logged yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
