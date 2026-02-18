'use client';

import { useApp } from '@/context/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LogOut, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EditProfileDialog } from './edit-profile-dialog';

function ProfileDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 items-start gap-4">
            <Label className="text-muted-foreground">{label}</Label>
            <div className="col-span-2 font-medium">{value}</div>
        </div>
    )
}


export default function ProfilePage() {
  const { currentUser, logout, isUserLoading, availableTeamspaces, areTeamspacesLoading } = useApp();

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


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information.</p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                 <Avatar className="h-24 w-24 border">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                    <AvatarFallback className="text-3xl">
                        {currentUser.displayName?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-3xl">{currentUser.displayName}</CardTitle>
                    <CardDescription className="mt-1">{currentUser.email}</CardDescription>
                </div>
                <EditProfileDialog>
                  <Button variant="outline">Edit Profile</Button>
                </EditProfileDialog>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <Separator />
             <ProfileDetailRow label="Role" value={<Badge variant="outline" className="capitalize"><Shield className="mr-2 h-3 w-3" /> {currentUser.role.replace(/_/g, ' ')}</Badge>} />
            <Separator />
            <ProfileDetailRow 
                label="Teamspaces" 
                value={
                    <div className="flex flex-wrap gap-2">
                         {teamspaceNames}
                    </div>
                } 
            />
        </CardContent>
         <CardFooter className="flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-6 gap-4">
            <p className="text-sm text-muted-foreground">To change your password or other sensitive details, contact an admin.</p>
            <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
