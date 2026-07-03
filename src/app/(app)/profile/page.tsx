'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LogOut, Shield, KeyRound, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EditProfileDialog } from './edit-profile-dialog';
import { ChangePasswordDialog } from '../admin/users/change-password-dialog';
import type { Lead, UserProfile } from '@/types';
import { RolePerformancePanel } from '@/components/role-performance-panel';
import { getRoleLabel } from '@/lib/user-labels';

function ProfileDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 items-start gap-4">
            <Label className="text-muted-foreground">{label}</Label>
            <div className="col-span-2 font-medium">{value}</div>
        </div>
    )
}


export default function ProfilePage() {
  const { currentUser, logout, isUserLoading, availableTeamspaces, areTeamspacesLoading, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id]);

  const leadsQuery = useMemoFirebase(() => {
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'));
  }, [firestore, currentTeamspace?.id]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: leadsData } = useCollection<Lead>(leadsQuery);
  const users = usersData || [];
  const leads = leadsData || [];

  if (isUserLoading || !currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
             <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-5 w-3/4" />
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-px w-full" />
            <div className="space-y-6 py-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
           <CardFooter className="border-t pt-6">
                <Skeleton className="h-10 w-32 ml-auto" />
           </CardFooter>
        </Card>
      </div>
    );
  }

  const teamspaceNames = areTeamspacesLoading 
    ? <Skeleton className="h-5 w-48" />
    : (currentUser.teamspaceIds || [])
        .map(id => availableTeamspaces.find(ts => ts.id === id)?.name)
        .filter(Boolean)
        .map(name => <Badge key={name} variant="secondary">{name}</Badge>);

  const hasManagementPrivileges = ['admin', 'sales_team_lead'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">My Profile</h1>
        <p className="text-muted-foreground font-medium">Manage your professional credentials and identity.</p>
      </div>

      <Card className="premium-card">
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                 <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-1 ring-primary/5">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                    <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                        {currentUser.displayName?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <CardTitle className="text-3xl font-black tracking-tight text-primary">{currentUser.displayName}</CardTitle>
                    <CardDescription className="text-lg font-medium">{currentUser.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <EditProfileDialog>
                        <Button variant="outline" className="rounded-xl font-bold">Edit Profile</Button>
                    </EditProfileDialog>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <Separator className="opacity-50" />
             <ProfileDetailRow label="System Role" value={<Badge variant="outline" className="capitalize font-black gold-glow bg-accent/5 border-accent/20 text-accent-foreground px-4 py-1"><Shield className="mr-2 h-3 w-3" /> {getRoleLabel(currentUser.role)}</Badge>} />
            <Separator className="opacity-50" />
            <ProfileDetailRow label="Phone Number" value={currentUser.phone || 'Not added yet'} />
            <Separator className="opacity-50" />
            <ProfileDetailRow label="Date of Birth" value={currentUser.dateOfBirth || 'Not added yet'} />
            <Separator className="opacity-50" />
            <ProfileDetailRow 
                label="Assigned Workspaces" 
                value={
                    <div className="flex flex-wrap gap-2">
                         {teamspaceNames}
                    </div>
                } 
            />
            
            {hasManagementPrivileges && (
                <>
                    <Separator className="opacity-50" />
                    <div className="pt-2">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
                            <Lock className="h-3 w-3" /> Security Settings
                        </h3>
                        <div className="p-6 rounded-[1.5rem] bg-muted/20 border border-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-primary">Professional Credentials</p>
                                <p className="text-xs text-muted-foreground font-medium">Update your secure access password periodically.</p>
                            </div>
                            <Button variant="secondary" className="rounded-xl font-black text-xs uppercase tracking-widest px-6" onClick={() => setIsPasswordDialogOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Update Password
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </CardContent>
         <CardFooter className="flex-col sm:flex-row justify-between items-start sm:items-center border-t border-primary/5 pt-8 gap-4 px-6 pb-8">
            <p className="text-xs text-muted-foreground font-medium max-w-sm italic">
                Your account is protected by enterprise-grade encryption. To modify core organizational settings, please consult the system administrator.
            </p>
            <Button variant="destructive" onClick={logout} className="rounded-xl px-8 font-black uppercase tracking-widest shadow-lg shadow-destructive/20 active:scale-95 transition-all">
                <LogOut className="mr-2 h-4 w-4" />
                Secure Sign Out
            </Button>
        </CardFooter>
      </Card>

      <RolePerformancePanel subject={currentUser} leads={leads} users={users} />

      <ChangePasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
        user={currentUser} 
      />
    </div>
  );
}
